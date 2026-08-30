import { publicationHandoffSchema, type CallbackOutboxRecord, type CanonicalPublishedDocument, type CreatorCallbackEvent, type PublicationHandoff, type PublicationRequestRecord, type PublishedPointer, type RetryPolicy } from "./domain";
import { asPublicationError, PublicationError } from "./errors";
import type { CreatorCallbackClient, CreatorMediaSource, ImmutableObjectStore, PublicationAuthority, PublicationScheduler, PublicationStore } from "./ports";
import { publishMediaAssets } from "./media";
import { retryAt } from "./retry";
import { contentHashForHandoff, buildPublishedDocument, validateDocumentChecksum, validateMediaReferences } from "./snapshot";
import { deterministicId, newLeaseToken, sha256Hex } from "./security";
import { buildPublicIndexRecord } from "./publicContent";

interface ApprovedSnapshot {
  handoff: PublicationHandoff;
}

export interface PublishingServiceOptions {
  publishRetry: RetryPolicy;
  callbackRetry: RetryPolicy;
  leaseDurationMs: number;
  pointerCasAttempts: number;
  maxMediaBytes: number;
  now?: () => Date;
}

export class PublishingService {
  private readonly now: () => Date;

  constructor(
    private readonly store: PublicationStore,
    private readonly objects: ImmutableObjectStore,
    private readonly scheduler: PublicationScheduler,
    private readonly callbacks: CreatorCallbackClient,
    private readonly authority: PublicationAuthority,
    private readonly mediaSource: CreatorMediaSource,
    private readonly options: PublishingServiceOptions
  ) {
    this.now = options.now ?? (() => new Date());
  }

  async acceptHandoff(input: unknown): Promise<{ created: boolean; request: PublicationRequestRecord }> {
    const handoff = publicationHandoffSchema.parse(input);
    validateDocumentChecksum(handoff);
    if (handoff.action !== "retract") validateMediaReferences(handoff);
    const contentHash = contentHashForHandoff(handoff);
    const requestId = deterministicId("req", handoff.job.idempotencyKey);
    const now = this.now();
    const runAt = handoff.action === "schedule" ? new Date(handoff.job.scheduledAt!) : now;
    if (!Number.isFinite(runAt.getTime()) || (handoff.action === "schedule" && runAt.getTime() < now.getTime() + 120_000)) {
      throw new PublicationError("Scheduled publication must be at least two minutes in the future", "SCHEDULE_TIME_INVALID", false, 422);
    }

    const initialStatus = handoff.action === "schedule" ? "Scheduled" : "Queued";
    const result = await this.store.createRequest({
      requestId,
      idempotencyKey: handoff.job.idempotencyKey,
      action: handoff.action,
      status: "Received",
      articleUuid: handoff.article.uuid,
      revisionUuid: handoff.revision.uuid,
      revisionNumber: handoff.revision.number,
      creatorJobId: handoff.job.creatorJobId,
      scheduledAt: handoff.job.scheduledAt ?? null,
      contentHash,
      now: now.toISOString()
    });

    if (result.request.contentHash !== contentHash) {
      throw new PublicationError("Idempotency key was already used for a different snapshot", "IDEMPOTENCY_CONFLICT", false, 409);
    }

    if (!result.request.snapshotObjectId) {
      const key = `snapshots/${requestId}/${contentHash}.json`;
      const objectId = await this.objects.putPrivateJson(key, { handoff } satisfies ApprovedSnapshot);
      await this.store.attachSnapshot(requestId, objectId, initialStatus, now.toISOString());
    }

    if (result.request.status !== "Succeeded" && result.request.status !== "Failed") {
      if (handoff.action === "schedule") {
        await this.scheduler.schedulePublication(requestId, runAt, true);
      } else {
        await this.scheduler.dispatchPublicationNow(requestId);
      }
    }
    const request = await this.store.getRequest(requestId);
    if (!request) throw new PublicationError("Publication request disappeared after creation", "REQUEST_NOT_FOUND", true);
    return { created: result.created, request };
  }

  async processPublication(requestId: string): Promise<PublicationRequestRecord> {
    const now = this.now();
    const leaseToken = newLeaseToken();
    const claimed = await this.store.claimRequest(requestId, leaseToken, now.getTime() + this.options.leaseDurationMs, now.toISOString());
    if (!claimed) {
      const existing = await this.store.getRequest(requestId);
      if (!existing) throw new PublicationError("Publication request not found", "REQUEST_NOT_FOUND", false, 404);
      return existing;
    }

    try {
      if (!claimed.snapshotObjectId) throw new PublicationError("Approved snapshot is missing", "SNAPSHOT_MISSING", false);
      if (claimed.scheduledAt && new Date(claimed.scheduledAt).getTime() > now.getTime()) {
        throw new PublicationError("Scheduled publication is not due", "NOT_DUE", true, 409);
      }
      const snapshot = await this.objects.getPrivateJson<ApprovedSnapshot>(claimed.snapshotObjectId);
      const handoff = publicationHandoffSchema.parse(snapshot.handoff);
      if (contentHashForHandoff(handoff) !== claimed.contentHash) {
        throw new PublicationError("Stored snapshot hash does not match the publication request", "SNAPSHOT_HASH_MISMATCH", false);
      }
      if (handoff.article.uuid !== claimed.articleUuid || handoff.revision.uuid !== claimed.revisionUuid || handoff.revision.number !== claimed.revisionNumber) {
        throw new PublicationError("Stored snapshot identity does not match the publication request", "SNAPSHOT_IDENTITY_MISMATCH", false);
      }
      await this.authority.assertPublishable(handoff);

      if (handoff.action === "retract") {
        const retractedAt = now.toISOString();
        const pointer = await this.retractPointer(handoff, requestId, retractedAt);
        const document = await this.objects.getPublicJson<CanonicalPublishedDocument>(pointer.objectId);
        await this.store.upsertPublicIndex(buildPublicIndexRecord(pointer, document));
        await this.store.markRequestSucceeded(requestId, leaseToken, claimed.attemptCount, pointer.publicationId, retractedAt);
        await this.queueAndAttemptCallback(this.callbackFor(claimed, "Succeeded", {
          publicationId: pointer.publicationId,
          publishedAt: retractedAt
        }));
        const result = await this.store.getRequest(requestId);
        if (!result) throw new PublicationError("Retraction request disappeared after completion", "REQUEST_NOT_FOUND", true);
        return result;
      }

      const publishedMedia = await publishMediaAssets(handoff.media, this.mediaSource, this.objects, this.options.maxMediaBytes);

      const publicationId = deterministicId("pub", handoff.article.uuid, handoff.revision.uuid, claimed.contentHash);
      const publishedAt = now.toISOString();
      const document = buildPublishedDocument(handoff, publicationId, claimed.contentHash, publishedAt, publishedMedia);
      const articleKey = sha256Hex(handoff.article.uuid).slice(0, 32);
      const revisionKey = sha256Hex(handoff.revision.uuid).slice(0, 32);
      const objectKey = `content/${articleKey}/${revisionKey}/${claimed.contentHash}.json`;
      const storedDocument = await this.objects.putPublicJson(objectKey, document);
      const objectId = storedDocument.objectKey;
      const version = await this.store.insertVersionIfAbsent({
        publicationId,
        requestId,
        articleUuid: handoff.article.uuid,
        revisionUuid: handoff.revision.uuid,
        revisionNumber: handoff.revision.number,
        contentHash: claimed.contentHash,
        objectId,
        publishedAt
      });

      const pointer = await this.advancePointer({
        articleUuid: version.articleUuid,
        publicationId: version.publicationId,
        revisionUuid: version.revisionUuid,
        revisionNumber: version.revisionNumber,
        contentHash: version.contentHash,
        objectId: version.objectId,
        publishedAt: version.publishedAt,
        pointerVersion: 1,
        servingStatus: "Published",
        retractedAt: null,
        retractionReason: null,
        retractionEventId: null,
        replacementPath: null
      });
      await this.store.upsertPublicIndex(buildPublicIndexRecord(pointer, document));

      await this.store.markRequestSucceeded(requestId, leaseToken, claimed.attemptCount, publicationId, publishedAt);
      await this.queueAndAttemptCallback(this.callbackFor(claimed, "Succeeded", {
        publicationId,
        objectId: version.objectId,
        publishedAt,
        media: publishedMedia
      }));
    } catch (error) {
      const failure = asPublicationError(error);
      const canRetry = failure.transient && claimed.attemptCount < this.options.publishRetry.maxAttempts;
      if (canRetry) {
        const next = retryAt(now, this.options.publishRetry, claimed.attemptCount);
        await this.store.markRequestRetry(requestId, leaseToken, claimed.attemptCount, next.toISOString(), failure.code, failure.message, now.toISOString());
        await this.scheduler.schedulePublication(requestId, next);
        await this.queueAndAttemptCallback(this.callbackFor(claimed, "Retrying", {
          nextRetryAt: next.toISOString(),
          errorCode: failure.code,
          errorMessage: failure.message
        }));
      } else {
        await this.store.markRequestFailed(requestId, leaseToken, claimed.attemptCount, failure.code, failure.message, now.toISOString());
        await this.queueAndAttemptCallback(this.callbackFor(claimed, "Failed", {
          errorCode: failure.code,
          errorMessage: failure.message
        }));
      }
    }
    const result = await this.store.getRequest(requestId);
    if (!result) throw new PublicationError("Publication request not found after processing", "REQUEST_NOT_FOUND", true);
    return result;
  }

  async processCallback(eventId: string): Promise<CallbackOutboxRecord> {
    const record = await this.store.getCallback(eventId);
    if (!record) throw new PublicationError("Callback event not found", "CALLBACK_NOT_FOUND", false, 404);
    if (record.deliveryStatus === "Delivered" || record.deliveryStatus === "DeadLetter") return record;
    try {
      let media: CreatorCallbackEvent["media"] = [];
      if (record.status === "Succeeded" && record.objectId) {
        const document = await this.objects.getPublicJson<CanonicalPublishedDocument>(record.objectId);
        if (!Array.isArray(document.media)) throw new Error("Published document is missing media mappings");
        media = document.media;
      }
      await this.callbacks.send({ ...record, media });
      await this.store.markCallbackDelivered(eventId);
    } catch (error) {
      const attemptCount = record.deliveryAttemptCount + 1;
      const message = error instanceof Error ? error.message : "Creator callback failed";
      if (attemptCount >= this.options.callbackRetry.maxAttempts) {
        await this.store.markCallbackDeadLetter(eventId, attemptCount, message);
      } else {
        const next = retryAt(this.now(), this.options.callbackRetry, attemptCount);
        await this.store.markCallbackRetry(eventId, attemptCount, next.toISOString(), message);
        await this.scheduler.scheduleCallback(eventId, next);
      }
    }
    return (await this.store.getCallback(eventId))!;
  }

  private async advancePointer(candidate: PublishedPointer): Promise<PublishedPointer> {
    for (let attempt = 0; attempt < this.options.pointerCasAttempts; attempt += 1) {
      const current = await this.store.getPointer(candidate.articleUuid);
      if (current?.publicationId === candidate.publicationId) return current;
      if (current && current.revisionNumber > candidate.revisionNumber) {
        throw new PublicationError("A newer revision is already published", "STALE_REVISION", false, 409);
      }
      if (current && current.revisionNumber === candidate.revisionNumber && current.contentHash !== candidate.contentHash) {
        throw new PublicationError("The same revision number already points to different content", "REVISION_CONTENT_CONFLICT", false, 409);
      }
      const next = { ...candidate, pointerVersion: (current?.pointerVersion ?? 0) + 1 };
      if (await this.store.compareAndSwapPointer(current, next)) return next;
    }
    throw new PublicationError("Published pointer was concurrently updated", "POINTER_CONTENTION", true, 409);
  }

  private async retractPointer(handoff: PublicationHandoff, requestId: string, retractedAt: string): Promise<PublishedPointer> {
    for (let attempt = 0; attempt < this.options.pointerCasAttempts; attempt += 1) {
      const current = await this.store.getPointer(handoff.article.uuid);
      if (!current) throw new PublicationError("Article has no published pointer to retract", "PUBLISHED_POINTER_NOT_FOUND", false, 409);
      if (current.revisionUuid !== handoff.revision.uuid || current.revisionNumber !== handoff.revision.number) {
        throw new PublicationError("The requested revision is not the current published pointer", "RETRACTION_POINTER_MISMATCH", false, 409);
      }
      if (current.servingStatus === "Retracted") return current;
      const next: PublishedPointer = {
        ...current,
        servingStatus: "Retracted",
        retractedAt,
        retractionReason: handoff.retraction!.reason,
        retractionEventId: deterministicId("retract", requestId, current.publicationId),
        replacementPath: handoff.retraction!.replacementPath || null,
        pointerVersion: current.pointerVersion + 1
      };
      if (await this.store.compareAndSwapPointer(current, next)) return next;
    }
    throw new PublicationError("Published pointer was concurrently updated during retraction", "POINTER_CONTENTION", true, 409);
  }

  private callbackFor(
    request: PublicationRequestRecord,
    status: CreatorCallbackEvent["status"],
    values: Partial<Pick<CreatorCallbackEvent, "publicationId" | "objectId" | "publishedAt" | "nextRetryAt" | "errorCode" | "errorMessage" | "media">>
  ): CreatorCallbackEvent {
    const eventId = deterministicId("callback", request.requestId, status, String(request.attemptCount), values.publicationId ?? "", values.errorCode ?? "");
    return {
      eventId,
      requestId: request.requestId,
      creatorJobId: request.creatorJobId,
      idempotencyKey: request.idempotencyKey,
      status,
      attemptCount: request.attemptCount,
      publicationId: values.publicationId ?? null,
      objectId: values.objectId ?? null,
      publishedAt: values.publishedAt ?? null,
      nextRetryAt: values.nextRetryAt ?? null,
      errorCode: values.errorCode ?? null,
      errorMessage: values.errorMessage ?? null,
      media: values.media ?? []
    };
  }

  private async queueAndAttemptCallback(event: CreatorCallbackEvent): Promise<void> {
    const record = await this.store.enqueueCallback(event);
    if (record.deliveryStatus !== "Delivered" && record.deliveryStatus !== "DeadLetter") {
      await this.processCallback(event.eventId);
    }
  }
}
