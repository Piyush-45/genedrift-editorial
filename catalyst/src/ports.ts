import type {
  CallbackOutboxRecord,
  CreatorCallbackEvent,
  PublicationRequestRecord,
  PublicIndexRecord,
  PublishedPointer,
  PublishedVersion,
  RequestStatus
} from "./domain";
import type { PublicationHandoff } from "./domain";

export interface NewPublicationRequest {
  requestId: string;
  idempotencyKey: string;
  action: PublicationHandoff["action"];
  status: RequestStatus;
  articleUuid: string;
  revisionUuid: string;
  revisionNumber: number;
  creatorJobId: string;
  scheduledAt: string | null;
  contentHash: string;
  now: string;
}

export interface PublicationStore {
  claimNonce(nonce: string, expiresAt: string): Promise<boolean>;
  createRequest(input: NewPublicationRequest): Promise<{ created: boolean; request: PublicationRequestRecord }>;
  getRequest(requestId: string): Promise<PublicationRequestRecord | null>;
  attachSnapshot(requestId: string, objectId: string, status: RequestStatus, now: string): Promise<void>;
  claimRequest(requestId: string, leaseToken: string, leaseUntilEpochMs: number, now: string): Promise<PublicationRequestRecord | null>;
  markRequestRetry(requestId: string, leaseToken: string, attemptCount: number, nextAttemptAt: string, code: string, message: string, now: string): Promise<void>;
  markRequestSucceeded(requestId: string, leaseToken: string, attemptCount: number, publicationId: string, now: string): Promise<void>;
  markRequestFailed(requestId: string, leaseToken: string, attemptCount: number, code: string, message: string, now: string): Promise<void>;
  insertVersionIfAbsent(version: PublishedVersion): Promise<PublishedVersion>;
  getPointer(articleUuid: string): Promise<PublishedPointer | null>;
  listPointers(): Promise<PublishedPointer[]>;
  compareAndSwapPointer(expected: PublishedPointer | null, next: PublishedPointer): Promise<boolean>;
  upsertPublicIndex(record: PublicIndexRecord): Promise<void>;
  getPublicIndexBySlug(slug: string): Promise<PublicIndexRecord | null>;
  listPublicIndex(): Promise<PublicIndexRecord[]>;
  enqueueCallback(event: CreatorCallbackEvent): Promise<CallbackOutboxRecord>;
  getCallback(eventId: string): Promise<CallbackOutboxRecord | null>;
  markCallbackDelivered(eventId: string): Promise<void>;
  markCallbackRetry(eventId: string, attemptCount: number, nextDeliveryAt: string, message: string): Promise<void>;
  markCallbackDeadLetter(eventId: string, attemptCount: number, message: string): Promise<void>;
  reopenDeadLetterCallback(eventId: string): Promise<void>;
}

export interface ImmutableObjectStore {
  putPrivateJson(objectKey: string, value: unknown): Promise<string>;
  getPrivateJson<T>(objectKey: string): Promise<T>;
  putPublicJson(objectKey: string, value: unknown): Promise<{ objectKey: string; publicUrl: string }>;
  getPublicJson<T>(objectKey: string): Promise<T>;
  putPublicMedia(objectKey: string, value: Buffer, contentType: string, metadata: Record<string, string>): Promise<{ objectKey: string; publicUrl: string }>;
}

export interface CreatorMediaSource {
  download(asset: PublicationHandoff["media"][number]): Promise<Buffer>;
}

export interface PublicationScheduler {
  dispatchPublicationNow(requestId: string): Promise<string>;
  schedulePublication(requestId: string, runAt: Date, preserveRequestedTime?: boolean): Promise<string>;
  scheduleCallback(eventId: string, runAt: Date): Promise<string>;
}

export interface CreatorCallbackClient {
  send(event: CreatorCallbackEvent): Promise<void>;
}

export interface PublicationAuthority {
  assertPublishable(handoff: PublicationHandoff): Promise<void>;
}
