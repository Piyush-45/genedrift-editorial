import { type CallbackOutboxRecord, type PublicationRequestRecord, type RetryPolicy } from "./domain";
import type { CreatorCallbackClient, CreatorMediaSource, ImmutableObjectStore, PublicationAuthority, PublicationScheduler, PublicationStore } from "./ports";
export interface PublishingServiceOptions {
    publishRetry: RetryPolicy;
    callbackRetry: RetryPolicy;
    leaseDurationMs: number;
    pointerCasAttempts: number;
    maxMediaBytes: number;
    now?: () => Date;
}
export declare class PublishingService {
    private readonly store;
    private readonly objects;
    private readonly scheduler;
    private readonly callbacks;
    private readonly authority;
    private readonly mediaSource;
    private readonly options;
    private readonly now;
    constructor(store: PublicationStore, objects: ImmutableObjectStore, scheduler: PublicationScheduler, callbacks: CreatorCallbackClient, authority: PublicationAuthority, mediaSource: CreatorMediaSource, options: PublishingServiceOptions);
    acceptHandoff(input: unknown): Promise<{
        created: boolean;
        request: PublicationRequestRecord;
    }>;
    processPublication(requestId: string): Promise<PublicationRequestRecord>;
    processCallback(eventId: string): Promise<CallbackOutboxRecord>;
    private advancePointer;
    private retractPointer;
    private callbackFor;
    private queueAndAttemptCallback;
    private replayTerminalCallback;
}
