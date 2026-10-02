"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryPublicationAuthority = exports.MemoryCallbackClient = exports.MemoryScheduler = exports.MemoryMediaSource = exports.MemoryObjectStore = exports.MemoryPublicationStore = void 0;
function clone(value) {
    return structuredClone(value);
}
class MemoryPublicationStore {
    requests = new Map();
    idempotency = new Map();
    nonces = new Map();
    versions = new Map();
    pointers = new Map();
    publicIndex = new Map();
    callbackOutbox = new Map();
    async claimNonce(nonce, expiresAt) {
        if (this.nonces.has(nonce))
            return false;
        this.nonces.set(nonce, expiresAt);
        return true;
    }
    async createRequest(input) {
        const existingId = this.idempotency.get(input.idempotencyKey);
        if (existingId)
            return { created: false, request: clone(this.requests.get(existingId)) };
        const request = {
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
    async getRequest(requestId) {
        const value = this.requests.get(requestId);
        return value ? clone(value) : null;
    }
    async attachSnapshot(requestId, objectId, status, now) {
        const request = this.requiredRequest(requestId);
        request.snapshotObjectId = objectId;
        request.status = status;
        request.updatedAt = now;
    }
    async claimRequest(requestId, leaseToken, leaseUntilEpochMs, now) {
        const request = this.requests.get(requestId);
        if (!request || request.status === "Succeeded" || request.status === "Failed" || request.status === "Received")
            return null;
        if (request.status === "Scheduled" && request.scheduledAt && new Date(request.scheduledAt).getTime() > new Date(now).getTime())
            return null;
        if (request.status === "Processing" && (request.leaseUntilEpochMs ?? Number.MAX_SAFE_INTEGER) >= new Date(now).getTime())
            return null;
        if (request.nextAttemptAt && new Date(request.nextAttemptAt).getTime() > new Date(now).getTime())
            return null;
        request.status = "Processing";
        request.leaseToken = leaseToken;
        request.leaseUntilEpochMs = leaseUntilEpochMs;
        request.attemptCount += 1;
        request.updatedAt = now;
        return clone(request);
    }
    async markRequestRetry(requestId, leaseToken, attemptCount, nextAttemptAt, code, message, now) {
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
    async markRequestSucceeded(requestId, leaseToken, attemptCount, publicationId, now) {
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
    async markRequestFailed(requestId, leaseToken, attemptCount, code, message, now) {
        const request = this.requiredOwnedRequest(requestId, leaseToken);
        request.status = "Failed";
        request.attemptCount = attemptCount;
        request.lastErrorCode = code;
        request.lastErrorMessage = message;
        request.leaseToken = null;
        request.leaseUntilEpochMs = null;
        request.updatedAt = now;
    }
    async insertVersionIfAbsent(version) {
        const existing = this.versions.get(version.publicationId);
        if (existing)
            return clone(existing);
        this.versions.set(version.publicationId, clone(version));
        return clone(version);
    }
    async getPointer(articleUuid) {
        const pointer = this.pointers.get(articleUuid);
        return pointer ? clone(pointer) : null;
    }
    async listPointers() {
        return [...this.pointers.values()].map(clone);
    }
    async compareAndSwapPointer(expected, next) {
        const current = this.pointers.get(next.articleUuid) ?? null;
        if (expected === null) {
            if (current !== null)
                return false;
        }
        else if (!current || current.pointerVersion !== expected.pointerVersion || current.publicationId !== expected.publicationId) {
            return false;
        }
        this.pointers.set(next.articleUuid, clone(next));
        return true;
    }
    async upsertPublicIndex(record) {
        const current = this.publicIndex.get(record.articleUuid);
        if (current && current.pointerVersion > record.pointerVersion)
            return;
        this.publicIndex.set(record.articleUuid, clone(record));
    }
    async getPublicIndexBySlug(slug) {
        const matches = [...this.publicIndex.values()].filter((record) => record.slug === slug);
        if (matches.length > 1) {
            throw new Error(`Duplicate public slug ${slug}`);
        }
        return matches[0] ? clone(matches[0]) : null;
    }
    async listPublicIndex() {
        return [...this.publicIndex.values()].map(clone);
    }
    async enqueueCallback(event) {
        const existing = this.callbackOutbox.get(event.eventId);
        if (existing)
            return clone(existing);
        const record = {
            ...clone(event),
            deliveryStatus: "Pending",
            deliveryAttemptCount: 0,
            nextDeliveryAt: null,
            lastDeliveryError: null
        };
        this.callbackOutbox.set(record.eventId, record);
        return clone(record);
    }
    async getCallback(eventId) {
        const event = this.callbackOutbox.get(eventId);
        return event ? clone(event) : null;
    }
    async markCallbackDelivered(eventId) {
        const event = this.requiredCallback(eventId);
        event.deliveryStatus = "Delivered";
        event.deliveryAttemptCount += 1;
        event.nextDeliveryAt = null;
        event.lastDeliveryError = null;
    }
    async markCallbackRetry(eventId, attemptCount, nextDeliveryAt, message) {
        const event = this.requiredCallback(eventId);
        event.deliveryStatus = "RetryScheduled";
        event.deliveryAttemptCount = attemptCount;
        event.nextDeliveryAt = nextDeliveryAt;
        event.lastDeliveryError = message;
    }
    async markCallbackDeadLetter(eventId, attemptCount, message) {
        const event = this.requiredCallback(eventId);
        event.deliveryStatus = "DeadLetter";
        event.deliveryAttemptCount = attemptCount;
        event.nextDeliveryAt = null;
        event.lastDeliveryError = message;
    }
    async reopenDeadLetterCallback(eventId) {
        const event = this.requiredCallback(eventId);
        if (event.deliveryStatus !== "DeadLetter")
            return;
        event.deliveryStatus = "Pending";
        event.deliveryAttemptCount = 0;
        event.nextDeliveryAt = null;
        event.lastDeliveryError = null;
    }
    requiredRequest(requestId) {
        const request = this.requests.get(requestId);
        if (!request)
            throw new Error(`Missing request ${requestId}`);
        return request;
    }
    requiredOwnedRequest(requestId, leaseToken) {
        const request = this.requiredRequest(requestId);
        if (request.leaseToken !== leaseToken)
            throw new Error(`Publication lease lost for ${requestId}`);
        return request;
    }
    requiredCallback(eventId) {
        const event = this.callbackOutbox.get(eventId);
        if (!event)
            throw new Error(`Missing callback ${eventId}`);
        return event;
    }
}
exports.MemoryPublicationStore = MemoryPublicationStore;
class MemoryObjectStore {
    objects = new Map();
    publicUrls = new Map();
    failPuts = 0;
    publicJsonReads = 0;
    async putPrivateJson(objectKey, value) {
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
    async getPrivateJson(objectId) {
        if (!this.objects.has(objectId))
            throw new Error(`Missing object ${objectId}`);
        return clone(this.objects.get(objectId));
    }
    async getJson(objectId) {
        return this.getPrivateJson(objectId);
    }
    async putPublicJson(objectKey, value) {
        await this.putPrivateJson(objectKey, value);
        const publicUrl = `https://published.example/${objectKey}`;
        this.publicUrls.set(objectKey, publicUrl);
        return { objectKey, publicUrl };
    }
    async getPublicJson(objectKey) {
        this.publicJsonReads += 1;
        return this.getPrivateJson(objectKey);
    }
    async putPublicMedia(objectKey, value, _contentType, _metadata) {
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
exports.MemoryObjectStore = MemoryObjectStore;
class MemoryMediaSource {
    files = new Map();
    failDownloads = 0;
    async download(asset) {
        if (this.failDownloads > 0) {
            this.failDownloads -= 1;
            throw new Error("Injected Creator media download failure");
        }
        const file = this.files.get(asset.creatorRecordId);
        if (!file)
            throw new Error(`Missing Creator media ${asset.creatorRecordId}`);
        return Buffer.from(file);
    }
}
exports.MemoryMediaSource = MemoryMediaSource;
class MemoryScheduler {
    publicationJobs = new Map();
    immediatePublicationJobs = new Set();
    callbackJobs = new Map();
    async dispatchPublicationNow(requestId) {
        this.immediatePublicationJobs.add(requestId);
        return `publication-now:${requestId}`;
    }
    async schedulePublication(requestId, runAt, _preserveRequestedTime = false) {
        this.publicationJobs.set(requestId, new Date(runAt));
        return `publication:${requestId}`;
    }
    async scheduleCallback(eventId, runAt) {
        this.callbackJobs.set(eventId, new Date(runAt));
        return `callback:${eventId}`;
    }
}
exports.MemoryScheduler = MemoryScheduler;
class MemoryCallbackClient {
    delivered = [];
    failSends = 0;
    async send(event) {
        if (this.failSends > 0) {
            this.failSends -= 1;
            throw new Error("Injected callback failure");
        }
        this.delivered.push(clone(event));
    }
}
exports.MemoryCallbackClient = MemoryCallbackClient;
class MemoryPublicationAuthority {
    error = null;
    async assertPublishable(_handoff) {
        if (this.error)
            throw this.error;
    }
}
exports.MemoryPublicationAuthority = MemoryPublicationAuthority;
//# sourceMappingURL=memory.js.map