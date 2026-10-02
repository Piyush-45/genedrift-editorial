import type { CallbackOutboxRecord, CreatorCallbackEvent, PublicationRequestRecord, PublicIndexRecord, PublishedPointer, PublishedVersion, RequestStatus } from "../domain";
import type { CreatorCallbackClient, CreatorMediaSource, ImmutableObjectStore, NewPublicationRequest, PublicationAuthority, PublicationScheduler, PublicationStore } from "../ports";
import type { PublicationHandoff } from "../domain";
export declare class MemoryPublicationStore implements PublicationStore {
    readonly requests: Map<string, PublicationRequestRecord>;
    readonly idempotency: Map<string, string>;
    readonly nonces: Map<string, string>;
    readonly versions: Map<string, PublishedVersion>;
    readonly pointers: Map<string, PublishedPointer>;
    readonly publicIndex: Map<string, PublicIndexRecord>;
    readonly callbackOutbox: Map<string, CallbackOutboxRecord>;
    claimNonce(nonce: string, expiresAt: string): Promise<boolean>;
    createRequest(input: NewPublicationRequest): Promise<{
        created: boolean;
        request: PublicationRequestRecord;
    }>;
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
    private requiredRequest;
    private requiredOwnedRequest;
    private requiredCallback;
}
export declare class MemoryObjectStore implements ImmutableObjectStore {
    readonly objects: Map<string, unknown>;
    readonly publicUrls: Map<string, string>;
    failPuts: number;
    publicJsonReads: number;
    putPrivateJson(objectKey: string, value: unknown): Promise<string>;
    getPrivateJson<T>(objectId: string): Promise<T>;
    getJson<T>(objectId: string): Promise<T>;
    putPublicJson(objectKey: string, value: unknown): Promise<{
        objectKey: string;
        publicUrl: string;
    }>;
    getPublicJson<T>(objectKey: string): Promise<T>;
    putPublicMedia(objectKey: string, value: Buffer, _contentType: string, _metadata: Record<string, string>): Promise<{
        objectKey: string;
        publicUrl: string;
    }>;
}
export declare class MemoryMediaSource implements CreatorMediaSource {
    readonly files: Map<string, Buffer<ArrayBufferLike>>;
    failDownloads: number;
    download(asset: PublicationHandoff["media"][number]): Promise<Buffer>;
}
export declare class MemoryScheduler implements PublicationScheduler {
    readonly publicationJobs: Map<string, Date>;
    readonly immediatePublicationJobs: Set<string>;
    readonly callbackJobs: Map<string, Date>;
    dispatchPublicationNow(requestId: string): Promise<string>;
    schedulePublication(requestId: string, runAt: Date, _preserveRequestedTime?: boolean): Promise<string>;
    scheduleCallback(eventId: string, runAt: Date): Promise<string>;
}
export declare class MemoryCallbackClient implements CreatorCallbackClient {
    readonly delivered: CreatorCallbackEvent[];
    failSends: number;
    send(event: CreatorCallbackEvent): Promise<void>;
}
export declare class MemoryPublicationAuthority implements PublicationAuthority {
    error: Error | null;
    assertPublishable(_handoff: PublicationHandoff): Promise<void>;
}
