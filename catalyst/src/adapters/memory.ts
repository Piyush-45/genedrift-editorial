import type { CallbackOutboxRecord, CreatorCallbackEvent, PublicationRequestRecord, PublicIndexRecord, PublishedPointer, PublishedVersion, RequestStatus } from "../domain";
import type { CreatorCallbackClient, CreatorMediaSource, ImmutableObjectStore, NewPublicationRequest, PublicationAuthority, PublicationScheduler, PublicationStore } from "../ports";
import type { PublicationHandoff } from "../domain";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MemoryPublicationStore implements PublicationStore {
  readonly requests = new Map<string, PublicationRequestRecord>();
  readonly idempotency = new Map<string, string>();
  readonly nonces = new Map<string, string>();
  readonly versions = new Map<string, PublishedVersion>();
  readonly pointers = new Map<string, PublishedPointer>();
  readonly publicIndex = new Map<string, PublicIndexRecord>();
  readonly callbackOutbox = new Map<string, CallbackOutboxRecord>();

  async claimNonce(nonce: string, expiresAt: string): Promise<boolean> {
    if (this.nonces.has(nonce)) return false;
    this.nonces.set(nonce, expiresAt);
    return true;
  }

  async createRequest(input: NewPublicationRequest): Promise<{ created: boolean; request: PublicationRequestRecord }> {
    const existingId = this.idempotency.get(input.idempotencyKey);
    if (existingId) return { created: false, request: clone(this.requests.get(existingId)!) };
    const request: PublicationRequestRecord = {
      requestId: input.requestId,
      idempotencyKey: input.idempotencyKey,
      action: input.action,
      status: input.status,
      articleUuid: input.articleUuid,
      revisionUuid: input.revisionUuid,
      revisionNumber: input.revisionNumber,
      creatorJobId: input.creatorJobId,
      scheduledAt: input.scheduledAt,
      attemptCount: 0,
      nextAttemptAt: null,
      snapshotObjectId: null,
      contentHash: input.contentHash,
      leaseToken: null,
      leaseUntilEpochMs: null,
      publicationId: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      createdAt: input.now,
      updatedAt: input.now
    };
    this.requests.set(input.requestId, request);
    this.idempotency.set(input.idempotencyKey, input.requestId);
    return { created: true, request: clone(request) };
  }

  async getRequest(requestId: string): Promise<PublicationRequestRecord | null> {
    const value = this.requests.get(requestId);
    return value ? clone(value) : null;
  }

  async attachSnapshot(requestId: string, objectId: string, status: RequestStatus, now: string): Promise<void> {
    const request = this.requiredRequest(requestId);
    request.snapshotObjectId = objectId;
    request.status = status;
    request.updatedAt = now;
  }

  async claimRequest(requestId: string, leaseToken: string, leaseUntilEpochMs: number, now: string): Promise<PublicationRequestRecord | null> {
    const request = this.requests.get(requestId);
    if (!request || request.status === "Succeeded" || request.status === "Failed" || request.status === "Received") return null;
    if (request.status === "Scheduled" && request.scheduledAt && new Date(request.scheduledAt).getTime() > new Date(now).getTime()) return null;
    if (request.status === "Processing" && (request.leaseUntilEpochMs ?? Number.MAX_SAFE_INTEGER) >= new Date(now).getTime()) return null;
    if (request.nextAttemptAt && new Date(request.nextAttemptAt).getTime() > new Date(now).getTime()) return null;
    request.status = "Processing";
    request.leaseToken = leaseToken;
    request.leaseUntilEpochMs = leaseUntilEpochMs;
    request.attemptCount += 1;
    request.updatedAt = now;
    return clone(request);
  }

  async markRequestRetry(requestId: string, leaseToken: string, attemptCount: number, nextAttemptAt: string, code: string, message: string, now: string): Promise<void> {
    const request = this.requiredOwnedRequest(requestId, leaseToken);
    request.status = "RetryScheduled";
    request.attemptCount = attemptCount;
    request.nextAttemptAt = nextAttemptAt;
    request.lastErrorCode = code;
    request.lastErrorMessage = message;
    request.leaseToken = null;
    request.leaseUntilEpochMs = null;
    request.updatedAt = now;
  }

  async markRequestSucceeded(requestId: string, leaseToken: string, attemptCount: number, publicationId: string, now: string): Promise<void> {
    const request = this.requiredOwnedRequest(requestId, leaseToken);
    request.status = "Succeeded";
    request.attemptCount = attemptCount;
    request.publicationId = publicationId;
    request.nextAttemptAt = null;
    request.lastErrorCode = null;
    request.lastErrorMessage = null;
    request.leaseToken = null;
    request.leaseUntilEpochMs = null;
    request.updatedAt = now;
  }

  async markRequestFailed(requestId: string, leaseToken: string, attemptCount: number, code: string, message: string, now: string): Promise<void> {
    const request = this.requiredOwnedRequest(requestId, leaseToken);
    request.status = "Failed";
    request.attemptCount = attemptCount;
    request.lastErrorCode = code;
    request.lastErrorMessage = message;
    request.leaseToken = null;
    request.leaseUntilEpochMs = null;
    request.updatedAt = now;
  }

  async insertVersionIfAbsent(version: PublishedVersion): Promise<PublishedVersion> {
    const existing = this.versions.get(version.publicationId);
    if (existing) return clone(existing);
    this.versions.set(version.publicationId, clone(version));
    return clone(version);
  }

  async getPointer(articleUuid: string): Promise<PublishedPointer | null> {
    const pointer = this.pointers.get(articleUuid);
    return pointer ? clone(pointer) : null;
  }

  async listPointers(): Promise<PublishedPointer[]> {
    return [...this.pointers.values()].map(clone);
  }

  async compareAndSwapPointer(expected: PublishedPointer | null, next: PublishedPointer): Promise<boolean> {
    const current = this.pointers.get(next.articleUuid) ?? null;
    if (expected === null) {
      if (current !== null) return false;
    } else if (!current || current.pointerVersion !== expected.pointerVersion || current.publicationId !== expected.publicationId) {
      return false;
    }
    this.pointers.set(next.articleUuid, clone(next));
    return true;
  }

  async upsertPublicIndex(record: PublicIndexRecord): Promise<void> {
    const current = this.publicIndex.get(record.articleUuid);
    if (current && current.pointerVersion > record.pointerVersion) return;
    this.publicIndex.set(record.articleUuid, clone(record));
  }

  async getPublicIndexBySlug(slug: string): Promise<PublicIndexRecord | null> {
    const matches = [...this.publicIndex.values()].filter((record) => record.slug === slug);
    if (matches.length > 1) {
      throw new Error(`Duplicate public slug ${slug}`);
    }
    return matches[0] ? clone(matches[0]) : null;
  }

  async listPublicIndex(): Promise<PublicIndexRecord[]> {
    return [...this.publicIndex.values()].map(clone);
  }

  async enqueueCallback(event: CreatorCallbackEvent): Promise<CallbackOutboxRecord> {
    const existing = this.callbackOutbox.get(event.eventId);
    if (existing) return clone(existing);
    const record: CallbackOutboxRecord = {
      ...clone(event),
      deliveryStatus: "Pending",
      deliveryAttemptCount: 0,
      nextDeliveryAt: null,
      lastDeliveryError: null
    };
    this.callbackOutbox.set(record.eventId, record);
    return clone(record);
  }

  async getCallback(eventId: string): Promise<CallbackOutboxRecord | null> {
    const event = this.callbackOutbox.get(eventId);
    return event ? clone(event) : null;
  }

  async markCallbackDelivered(eventId: string): Promise<void> {
    const event = this.requiredCallback(eventId);
    event.deliveryStatus = "Delivered";
    event.deliveryAttemptCount += 1;
    event.nextDeliveryAt = null;
    event.lastDeliveryError = null;
  }

  async markCallbackRetry(eventId: string, attemptCount: number, nextDeliveryAt: string, message: string): Promise<void> {
    const event = this.requiredCallback(eventId);
    event.deliveryStatus = "RetryScheduled";
    event.deliveryAttemptCount = attemptCount;
    event.nextDeliveryAt = nextDeliveryAt;
    event.lastDeliveryError = message;
  }

  async markCallbackDeadLetter(eventId: string, attemptCount: number, message: string): Promise<void> {
    const event = this.requiredCallback(eventId);
    event.deliveryStatus = "DeadLetter";
    event.deliveryAttemptCount = attemptCount;
    event.nextDeliveryAt = null;
    event.lastDeliveryError = message;
  }

  private requiredRequest(requestId: string): PublicationRequestRecord {
    const request = this.requests.get(requestId);
    if (!request) throw new Error(`Missing request ${requestId}`);
    return request;
  }

  private requiredOwnedRequest(requestId: string, leaseToken: string): PublicationRequestRecord {
    const request = this.requiredRequest(requestId);
    if (request.leaseToken !== leaseToken) throw new Error(`Publication lease lost for ${requestId}`);
    return request;
  }

  private requiredCallback(eventId: string): CallbackOutboxRecord {
    const event = this.callbackOutbox.get(eventId);
    if (!event) throw new Error(`Missing callback ${eventId}`);
    return event;
  }
}

export class MemoryObjectStore implements ImmutableObjectStore {
  readonly objects = new Map<string, unknown>();
  readonly publicUrls = new Map<string, string>();
  failPuts = 0;
  publicJsonReads = 0;

  async putPrivateJson(objectKey: string, value: unknown): Promise<string> {
    if (this.failPuts > 0) {
      this.failPuts -= 1;
      throw new Error("Injected object-store failure");
    }
    const existing = this.objects.get(objectKey);
    if (existing !== undefined && JSON.stringify(existing) !== JSON.stringify(value)) {
      throw new Error(`Immutable object conflict for ${objectKey}`);
    }
    this.objects.set(objectKey, clone(value));
    return objectKey;
  }

  async getPrivateJson<T>(objectId: string): Promise<T> {
    if (!this.objects.has(objectId)) throw new Error(`Missing object ${objectId}`);
    return clone(this.objects.get(objectId) as T);
  }

  async getJson<T>(objectId: string): Promise<T> {
    return this.getPrivateJson<T>(objectId);
  }

  async putPublicJson(objectKey: string, value: unknown): Promise<{ objectKey: string; publicUrl: string }> {
    await this.putPrivateJson(objectKey, value);
    const publicUrl = `https://published.example/${objectKey}`;
    this.publicUrls.set(objectKey, publicUrl);
    return { objectKey, publicUrl };
  }

  async getPublicJson<T>(objectKey: string): Promise<T> {
    this.publicJsonReads += 1;
    return this.getPrivateJson<T>(objectKey);
  }

  async putPublicMedia(objectKey: string, value: Buffer, _contentType: string, _metadata: Record<string, string>): Promise<{ objectKey: string; publicUrl: string }> {
    if (this.failPuts > 0) {
      this.failPuts -= 1;
      throw new Error("Injected object-store failure");
    }
    const existing = this.objects.get(objectKey);
    if (existing !== undefined && (!Buffer.isBuffer(existing) || !existing.equals(value))) {
      throw new Error(`Immutable object conflict for ${objectKey}`);
    }
    this.objects.set(objectKey, Buffer.from(value));
    const publicUrl = `https://published.example/${objectKey}`;
    this.publicUrls.set(objectKey, publicUrl);
    return { objectKey, publicUrl };
  }
}

export class MemoryMediaSource implements CreatorMediaSource {
  readonly files = new Map<string, Buffer>();
  failDownloads = 0;

  async download(asset: PublicationHandoff["media"][number]): Promise<Buffer> {
    if (this.failDownloads > 0) {
      this.failDownloads -= 1;
      throw new Error("Injected Creator media download failure");
    }
    const file = this.files.get(asset.creatorRecordId);
    if (!file) throw new Error(`Missing Creator media ${asset.creatorRecordId}`);
    return Buffer.from(file);
  }
}

export class MemoryScheduler implements PublicationScheduler {
  readonly publicationJobs = new Map<string, Date>();
  readonly immediatePublicationJobs = new Set<string>();
  readonly callbackJobs = new Map<string, Date>();

  async dispatchPublicationNow(requestId: string): Promise<string> {
    this.immediatePublicationJobs.add(requestId);
    return `publication-now:${requestId}`;
  }

  async schedulePublication(requestId: string, runAt: Date, _preserveRequestedTime = false): Promise<string> {
    this.publicationJobs.set(requestId, new Date(runAt));
    return `publication:${requestId}`;
  }

  async scheduleCallback(eventId: string, runAt: Date): Promise<string> {
    this.callbackJobs.set(eventId, new Date(runAt));
    return `callback:${eventId}`;
  }
}

export class MemoryCallbackClient implements CreatorCallbackClient {
  readonly delivered: CreatorCallbackEvent[] = [];
  failSends = 0;

  async send(event: CreatorCallbackEvent): Promise<void> {
    if (this.failSends > 0) {
      this.failSends -= 1;
      throw new Error("Injected callback failure");
    }
    this.delivered.push(clone(event));
  }
}

export class MemoryPublicationAuthority implements PublicationAuthority {
  error: Error | null = null;

  async assertPublishable(_handoff: PublicationHandoff): Promise<void> {
    if (this.error) throw this.error;
  }
}
