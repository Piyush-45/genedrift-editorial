import type { CallbackOutboxRecord, CreatorCallbackEvent, PublicationRequestRecord, PublicIndexRecord, PublishedPointer, PublishedVersion, RequestStatus } from "../domain";
import type { CreatorCallbackClient, CreatorMediaSource, ImmutableObjectStore, NewPublicationRequest, PublicationAuthority, PublicationScheduler, PublicationStore } from "../ports";
import type { PublicationHandoff } from "../domain";
type CatalystApp = any;
export declare class CatalystPublicationStore implements PublicationStore {
    private readonly app;
    constructor(app: CatalystApp);
    private table;
    private query;
    private update;
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
    private finishAttempt;
    private assertLeaseCompletion;
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
export declare class CatalystStratusObjectStore implements ImmutableObjectStore {
    private readonly publicBaseUrl;
    private readonly privateBucket;
    private readonly publicBucket;
    constructor(app: CatalystApp, privateBucketName: string, publicBucketName: string, publicBaseUrl: string);
    putPrivateJson(objectKey: string, value: unknown): Promise<string>;
    getPrivateJson<T>(objectKey: string): Promise<T>;
    putPublicJson(objectKey: string, value: unknown): Promise<{
        objectKey: string;
        publicUrl: string;
    }>;
    getPublicJson<T>(objectKey: string): Promise<T>;
    putPublicMedia(objectKey: string, value: Buffer, contentType: string, metadata: Record<string, string>): Promise<{
        objectKey: string;
        publicUrl: string;
    }>;
    private putImmutable;
}
interface CreatorMediaSourceOptions {
    apiBaseUrl: string;
    accountOwner: string;
    appLinkName: string;
    reportLinkName: string;
    fileFieldLinkName: string;
    environment?: "development" | "stage" | "production";
    maxBytes: number;
}
export declare class ZohoCreatorMediaSource implements CreatorMediaSource {
    private readonly app;
    private readonly oauth;
    private readonly options;
    constructor(app: CatalystApp, oauth: CreatorOAuthOptions, options: CreatorMediaSourceOptions);
    download(asset: PublicationHandoff["media"][number]): Promise<Buffer>;
}
interface SchedulerOptions {
    jobPoolName: string;
    appSailName: string;
    appSailBaseUrl: string;
    publicationPath: string;
    callbackPath: string;
    internalSecret: string;
}
export declare class CatalystScheduler implements PublicationScheduler {
    private readonly app;
    private readonly options;
    private readonly now;
    constructor(app: CatalystApp, options: SchedulerOptions, now?: () => number);
    dispatchPublicationNow(requestId: string): Promise<string>;
    schedulePublication(requestId: string, runAt: Date, preserveRequestedTime?: boolean): Promise<string>;
    scheduleCallback(eventId: string, runAt: Date): Promise<string>;
    private schedule;
    private findExistingLegacyCron;
}
export declare class ZohoCreatorCallbackClient implements CreatorCallbackClient {
    private readonly app;
    private readonly callbackUrl;
    private readonly hmacSecret;
    private readonly oauth;
    constructor(app: CatalystApp, callbackUrl: string, hmacSecret: string, oauth: CreatorOAuthOptions);
    send(event: CreatorCallbackEvent): Promise<void>;
}
export interface CreatorOAuthOptions {
    connectorName?: string;
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    tokenUrl?: string;
    staticToken?: string;
}
export declare class ZohoCreatorPublicationAuthority implements PublicationAuthority {
    private readonly app;
    private readonly validateUrl;
    private readonly oauth;
    constructor(app: CatalystApp, validateUrl: string, oauth: CreatorOAuthOptions);
    assertPublishable(handoff: PublicationHandoff): Promise<void>;
}
export {};
