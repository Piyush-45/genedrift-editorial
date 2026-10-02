export interface SignedRequestHeaders {
    timestamp: string;
    nonce: string;
    signature: string;
}
export declare function sha256Hex(value: string | Buffer): string;
export declare function signatureBase(method: string, path: string, timestamp: string, nonce: string, rawBody: Buffer): string;
export declare function signRequest(secret: string, method: string, path: string, timestamp: string, nonce: string, rawBody: Buffer): string;
export declare function verifyRequestSignature(secret: string, method: string, path: string, rawBody: Buffer, headers: SignedRequestHeaders, now: Date, maxClockSkewSeconds: number): void;
export declare function stableJson(value: unknown): string;
export declare function deterministicId(prefix: string, ...parts: string[]): string;
export declare function newLeaseToken(): string;
export declare function callbackSignaturePayload(event: {
    callbackTimestamp: string;
    callbackNonce: string;
    eventId: string;
    creatorJobId: string;
    idempotencyKey: string;
    status: string;
    attemptCount: number;
    publicationId: string | null;
    objectId: string | null;
    publishedAt: string | null;
    nextRetryAt: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    media: unknown[];
}): string;
