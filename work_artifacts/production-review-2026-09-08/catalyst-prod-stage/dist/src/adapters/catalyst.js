"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZohoCreatorPublicationAuthority = exports.ZohoCreatorCallbackClient = exports.CatalystScheduler = exports.ZohoCreatorMediaSource = exports.CatalystStratusObjectStore = exports.CatalystPublicationStore = void 0;
const node_crypto_1 = require("node:crypto");
const errors_1 = require("../errors");
const security_1 = require("../security");
const TABLES = {
    requests: "GD_Publication_Requests",
    versions: "GD_Published_Versions",
    pointers: "GD_Published_Pointers",
    attempts: "GD_Publication_Attempts",
    callbacks: "GD_Callback_Outbox",
    nonces: "GD_Request_Nonces",
    publicIndex: "GD_Public_Index"
};
function sql(value) {
    if (value === null)
        return "NULL";
    if (typeof value === "number")
        return String(value);
    return `'${value.replaceAll("'", "''")}'`;
}
function nullable(value) {
    if (value === undefined || value === null || value === "")
        return null;
    return String(value);
}
function numeric(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}
function unwrapRows(rows, table) {
    return rows.map((row) => row[table] ?? Object.values(row)[0]).filter(Boolean);
}
function requestFromRow(row) {
    return {
        requestId: String(row.Request_ID),
        idempotencyKey: String(row.Idempotency_Key),
        action: row.Action,
        status: row.Status,
        articleUuid: String(row.Article_UUID),
        revisionUuid: String(row.Revision_UUID),
        revisionNumber: numeric(row.Revision_Number),
        creatorJobId: String(row.Creator_Job_ID),
        scheduledAt: nullable(row.Scheduled_At),
        attemptCount: numeric(row.Attempt_Count),
        nextAttemptAt: nullable(row.Next_Attempt_At),
        snapshotObjectId: nullable(row.Snapshot_Object_ID),
        contentHash: String(row.Content_Hash),
        leaseToken: nullable(row.Lease_Token),
        leaseUntilEpochMs: row.Lease_Until_Epoch_MS == null ? null : numeric(row.Lease_Until_Epoch_MS),
        publicationId: nullable(row.Publication_ID),
        lastErrorCode: nullable(row.Last_Error_Code),
        lastErrorMessage: nullable(row.Last_Error_Message),
        createdAt: String(row.Created_At),
        updatedAt: String(row.Updated_At)
    };
}
function pointerFromRow(row) {
    return {
        articleUuid: String(row.Article_UUID),
        publicationId: String(row.Publication_ID),
        revisionUuid: String(row.Revision_UUID),
        revisionNumber: numeric(row.Revision_Number),
        contentHash: String(row.Content_Hash),
        objectId: String(row.Object_ID),
        publishedAt: String(row.Published_At),
        pointerVersion: numeric(row.Pointer_Version),
        servingStatus: row.Serving_Status === "Retracted" ? "Retracted" : "Published",
        retractedAt: nullable(row.Retracted_At),
        retractionReason: nullable(row.Retraction_Reason),
        retractionEventId: nullable(row.Retraction_Event_ID),
        replacementPath: nullable(row.Replacement_Path)
    };
}
function callbackFromRow(row) {
    return {
        eventId: String(row.Event_ID),
        requestId: String(row.Request_ID),
        creatorJobId: String(row.Creator_Job_ID),
        idempotencyKey: String(row.Idempotency_Key),
        status: row.Callback_Status,
        attemptCount: numeric(row.Publication_Attempt_Count),
        publicationId: nullable(row.Publication_ID),
        objectId: nullable(row.Object_ID),
        publishedAt: nullable(row.Published_At),
        nextRetryAt: nullable(row.Publication_Next_Retry_At),
        errorCode: nullable(row.Error_Code),
        errorMessage: nullable(row.Error_Message),
        media: [],
        deliveryStatus: row.Delivery_Status,
        deliveryAttemptCount: numeric(row.Delivery_Attempt_Count),
        nextDeliveryAt: nullable(row.Next_Delivery_At),
        lastDeliveryError: nullable(row.Last_Delivery_Error)
    };
}
function jsonArray(value) {
    if (Array.isArray(value))
        return value.map(String);
    if (typeof value !== "string" || !value)
        return [];
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed))
        throw new errors_1.PublicationError("Public index tags are invalid", "PUBLIC_INDEX_INVALID", false, 500);
    return parsed.map(String);
}
function jsonObject(value) {
    if (value == null || value === "")
        return null;
    if (typeof value === "object")
        return value;
    return JSON.parse(String(value));
}
function publicIndexFromRow(row) {
    return {
        articleUuid: String(row.Article_UUID),
        publicationId: String(row.Publication_ID),
        revisionUuid: String(row.Revision_UUID),
        revisionNumber: numeric(row.Revision_Number),
        contentHash: String(row.Content_Hash),
        objectId: String(row.Object_ID),
        publishedAt: String(row.Published_At),
        pointerVersion: numeric(row.Pointer_Version),
        servingStatus: row.Serving_Status === "Retracted" ? "Retracted" : "Published",
        slug: String(row.Slug),
        title: String(row.Title),
        excerpt: String(row.Excerpt ?? ""),
        seoTitle: String(row.SEO_Title ?? ""),
        seoDescription: String(row.SEO_Description ?? ""),
        primaryCategory: String(row.Primary_Category ?? ""),
        tags: jsonArray(row.Tags_JSON),
        searchText: String(row.Search_Text ?? ""),
        readingTimeMinutes: numeric(row.Reading_Time_Minutes),
        featuredMedia: jsonObject(row.Featured_Media_JSON),
        robotsDirective: row.Robots_Directive,
        retractedAt: nullable(row.Retracted_At),
        retractionReason: nullable(row.Retraction_Reason),
        replacementPath: nullable(row.Replacement_Path),
        updatedAt: String(row.Updated_At)
    };
}
function publicIndexRow(record) {
    return {
        Article_UUID: record.articleUuid,
        Publication_ID: record.publicationId,
        Revision_UUID: record.revisionUuid,
        Revision_Number: record.revisionNumber,
        Content_Hash: record.contentHash,
        Object_ID: record.objectId,
        Published_At: record.publishedAt,
        Pointer_Version: record.pointerVersion,
        Serving_Status: record.servingStatus,
        Slug: record.slug,
        Title: record.title,
        Excerpt: record.excerpt,
        SEO_Title: record.seoTitle,
        SEO_Description: record.seoDescription,
        Primary_Category: record.primaryCategory,
        Tags_JSON: JSON.stringify(record.tags),
        Search_Text: record.searchText,
        Reading_Time_Minutes: record.readingTimeMinutes,
        Featured_Media_JSON: record.featuredMedia ? JSON.stringify(record.featuredMedia) : null,
        Robots_Directive: record.robotsDirective,
        Retracted_At: record.retractedAt,
        Retraction_Reason: record.retractionReason,
        Replacement_Path: record.replacementPath,
        Updated_At: record.updatedAt
    };
}
class CatalystPublicationStore {
    app;
    constructor(app) {
        this.app = app;
    }
    table(name) {
        return this.app.datastore().table(name);
    }
    async query(table, where) {
        const rows = await this.app.zcql().executeZCQLQuery(`SELECT * FROM ${table} WHERE ${where}`);
        return unwrapRows(rows, table);
    }
    async update(table, assignments, where) {
        const set = Object.entries(assignments).map(([key, value]) => `${key} = ${sql(value)}`).join(", ");
        await this.app.zcql().executeZCQLQuery(`UPDATE ${table} SET ${set} WHERE ${where}`);
    }
    async claimNonce(nonce, expiresAt) {
        try {
            await this.table(TABLES.nonces).insertRow({ Nonce: nonce, Expires_At: expiresAt });
            return true;
        }
        catch (error) {
            const existing = (await this.query(TABLES.nonces, `Nonce = ${sql(nonce)}`).catch(() => []))[0];
            if (existing)
                return false;
            throw error;
        }
    }
    async createRequest(input) {
        try {
            const row = await this.table(TABLES.requests).insertRow({
                Request_ID: input.requestId,
                Idempotency_Key: input.idempotencyKey,
                Action: input.action,
                Status: input.status,
                Article_UUID: input.articleUuid,
                Revision_UUID: input.revisionUuid,
                Revision_Number: input.revisionNumber,
                Creator_Job_ID: input.creatorJobId,
                Scheduled_At: input.scheduledAt,
                Attempt_Count: 0,
                Content_Hash: input.contentHash,
                Created_At: input.now,
                Updated_At: input.now
            });
            return { created: true, request: requestFromRow(row) };
        }
        catch (error) {
            const existing = (await this.query(TABLES.requests, `Idempotency_Key = ${sql(input.idempotencyKey)}`))[0];
            if (!existing)
                throw error;
            return { created: false, request: requestFromRow(existing) };
        }
    }
    async getRequest(requestId) {
        const row = (await this.query(TABLES.requests, `Request_ID = ${sql(requestId)}`))[0];
        return row ? requestFromRow(row) : null;
    }
    async attachSnapshot(requestId, objectId, status, now) {
        await this.update(TABLES.requests, { Snapshot_Object_ID: objectId, Status: status, Updated_At: now }, `Request_ID = ${sql(requestId)} AND Status = 'Received'`);
    }
    async claimRequest(requestId, leaseToken, leaseUntilEpochMs, now) {
        const nowEpoch = new Date(now).getTime();
        const current = await this.getRequest(requestId);
        if (!current)
            return null;
        // Catalyst DateTime values can preserve their submitted timezone offset.
        // Comparing those values to a UTC ISO string inside ZCQL can reject an
        // already-due request (for example, 22:25 +05:30 versus 16:55 Z). Resolve
        // due-time eligibility in JavaScript, then keep the state/lease predicate
        // in ZCQL so competing workers still converge on one owner.
        let claimableState;
        if (current.status === "Queued") {
            claimableState = "Status = 'Queued'";
        }
        else if (current.status === "Scheduled") {
            const scheduledEpoch = current.scheduledAt ? new Date(current.scheduledAt).getTime() : Number.NaN;
            if (!Number.isFinite(scheduledEpoch) || scheduledEpoch > nowEpoch)
                return null;
            claimableState = "Status = 'Scheduled'";
        }
        else if (current.status === "RetryScheduled") {
            const retryEpoch = current.nextAttemptAt ? new Date(current.nextAttemptAt).getTime() : Number.NaN;
            if (!Number.isFinite(retryEpoch) || retryEpoch > nowEpoch)
                return null;
            claimableState = "Status = 'RetryScheduled'";
        }
        else if (current.status === "Processing") {
            if ((current.leaseUntilEpochMs ?? Number.MAX_SAFE_INTEGER) >= nowEpoch)
                return null;
            claimableState = `Status = 'Processing' AND Lease_Until_Epoch_MS < ${nowEpoch}`;
        }
        else {
            return null;
        }
        await this.update(TABLES.requests, { Status: "Processing", Lease_Token: leaseToken, Lease_Until_Epoch_MS: leaseUntilEpochMs, Updated_At: now }, `Request_ID = ${sql(requestId)} AND ${claimableState}`);
        const row = (await this.query(TABLES.requests, `Request_ID = ${sql(requestId)} AND Lease_Token = ${sql(leaseToken)}`))[0];
        if (!row)
            return null;
        const nextAttempt = numeric(row.Attempt_Count) + 1;
        await this.update(TABLES.requests, { Attempt_Count: nextAttempt }, `Request_ID = ${sql(requestId)} AND Lease_Token = ${sql(leaseToken)}`);
        try {
            await this.table(TABLES.attempts).insertRow({
                Attempt_ID: `${requestId}:${nextAttempt}`,
                Request_ID: requestId,
                Attempt_Number: nextAttempt,
                Status: "Processing",
                Started_At: now
            });
        }
        catch { }
        const claimed = await this.getRequest(requestId);
        return claimed?.leaseToken === leaseToken ? claimed : null;
    }
    async markRequestRetry(requestId, leaseToken, attemptCount, nextAttemptAt, code, message, now) {
        await this.update(TABLES.requests, {
            Status: "RetryScheduled", Attempt_Count: attemptCount, Next_Attempt_At: nextAttemptAt,
            Last_Error_Code: code, Last_Error_Message: message.slice(0, 9000), Lease_Token: null, Lease_Until_Epoch_MS: null, Updated_At: now
        }, `Request_ID = ${sql(requestId)} AND Lease_Token = ${sql(leaseToken)}`);
        await this.assertLeaseCompletion(requestId, leaseToken, "RetryScheduled");
        await this.finishAttempt(requestId, attemptCount, "RetryScheduled", now, code, message);
    }
    async markRequestSucceeded(requestId, leaseToken, attemptCount, publicationId, now) {
        await this.update(TABLES.requests, {
            Status: "Succeeded", Attempt_Count: attemptCount, Publication_ID: publicationId, Next_Attempt_At: null,
            Last_Error_Code: null, Last_Error_Message: null, Lease_Token: null, Lease_Until_Epoch_MS: null, Updated_At: now
        }, `Request_ID = ${sql(requestId)} AND Lease_Token = ${sql(leaseToken)}`);
        await this.assertLeaseCompletion(requestId, leaseToken, "Succeeded");
        await this.finishAttempt(requestId, attemptCount, "Succeeded", now, null, null);
    }
    async markRequestFailed(requestId, leaseToken, attemptCount, code, message, now) {
        await this.update(TABLES.requests, {
            Status: "Failed", Attempt_Count: attemptCount, Last_Error_Code: code, Last_Error_Message: message.slice(0, 9000),
            Lease_Token: null, Lease_Until_Epoch_MS: null, Updated_At: now
        }, `Request_ID = ${sql(requestId)} AND Lease_Token = ${sql(leaseToken)}`);
        await this.assertLeaseCompletion(requestId, leaseToken, "Failed");
        await this.finishAttempt(requestId, attemptCount, "Failed", now, code, message);
    }
    async finishAttempt(requestId, attemptCount, status, now, code, message) {
        await this.update(TABLES.attempts, {
            Status: status, Completed_At: now, Error_Code: code, Error_Message: message?.slice(0, 9000) ?? null
        }, `Attempt_ID = ${sql(`${requestId}:${attemptCount}`)}`);
    }
    async assertLeaseCompletion(requestId, leaseToken, expectedStatus) {
        const row = (await this.query(TABLES.requests, `Request_ID = ${sql(requestId)}`))[0];
        // Completion clears Lease_Token. A row still carrying this token means the
        // conditional update did not produce the expected state; a different token
        // means another worker took ownership after expiry.
        if (!row || row.Status !== expectedStatus || row.Lease_Token != null) {
            throw new errors_1.PublicationError(`Publication lease was lost for ${requestId}`, "LEASE_LOST", true, 409);
        }
        void leaseToken;
    }
    async insertVersionIfAbsent(version) {
        try {
            await this.table(TABLES.versions).insertRow({
                Publication_ID: version.publicationId,
                Request_ID: version.requestId,
                Article_UUID: version.articleUuid,
                Revision_UUID: version.revisionUuid,
                Revision_Number: version.revisionNumber,
                Content_Hash: version.contentHash,
                Object_ID: version.objectId,
                Published_At: version.publishedAt
            });
            return version;
        }
        catch (error) {
            const row = (await this.query(TABLES.versions, `Publication_ID = ${sql(version.publicationId)}`))[0];
            if (!row)
                throw error;
            if (String(row.Content_Hash) !== version.contentHash) {
                throw new errors_1.PublicationError("Immutable publication identifier contains different content", "IMMUTABLE_VERSION_CONFLICT", false, 409);
            }
            return {
                publicationId: String(row.Publication_ID), requestId: String(row.Request_ID), articleUuid: String(row.Article_UUID),
                revisionUuid: String(row.Revision_UUID), revisionNumber: numeric(row.Revision_Number), contentHash: String(row.Content_Hash),
                objectId: String(row.Object_ID), publishedAt: String(row.Published_At)
            };
        }
    }
    async getPointer(articleUuid) {
        const row = (await this.query(TABLES.pointers, `Article_UUID = ${sql(articleUuid)}`))[0];
        return row ? pointerFromRow(row) : null;
    }
    async listPointers() {
        const pointers = [];
        for await (const row of this.table(TABLES.pointers).getIterableRows()) {
            pointers.push(pointerFromRow(row));
        }
        return pointers;
    }
    async compareAndSwapPointer(expected, next) {
        if (!expected) {
            try {
                await this.table(TABLES.pointers).insertRow({
                    Article_UUID: next.articleUuid, Publication_ID: next.publicationId, Revision_UUID: next.revisionUuid,
                    Revision_Number: next.revisionNumber, Content_Hash: next.contentHash, Object_ID: next.objectId,
                    Published_At: next.publishedAt, Pointer_Version: next.pointerVersion,
                    Serving_Status: next.servingStatus, Retracted_At: next.retractedAt,
                    Retraction_Reason: next.retractionReason, Retraction_Event_ID: next.retractionEventId,
                    Replacement_Path: next.replacementPath
                });
                return true;
            }
            catch (error) {
                // A duplicate insert caused by a real concurrent writer is contention.
                // Do not disguise schema, validation, or permission failures as a CAS
                // race: if no pointer exists after the failed insert, preserve the
                // original Catalyst error so operators see the actionable cause.
                const current = await this.getPointer(next.articleUuid).catch(() => null);
                if (current) {
                    return current.publicationId === next.publicationId
                        && current.pointerVersion === next.pointerVersion;
                }
                throw error;
            }
        }
        await this.update(TABLES.pointers, {
            Publication_ID: next.publicationId, Revision_UUID: next.revisionUuid, Revision_Number: next.revisionNumber,
            Content_Hash: next.contentHash, Object_ID: next.objectId, Published_At: next.publishedAt, Pointer_Version: next.pointerVersion,
            Serving_Status: next.servingStatus, Retracted_At: next.retractedAt,
            Retraction_Reason: next.retractionReason, Retraction_Event_ID: next.retractionEventId,
            Replacement_Path: next.replacementPath
        }, `Article_UUID = ${sql(next.articleUuid)} AND Publication_ID = ${sql(expected.publicationId)} AND Pointer_Version = ${expected.pointerVersion}`);
        const current = await this.getPointer(next.articleUuid);
        return current?.publicationId === next.publicationId && current.pointerVersion === next.pointerVersion;
    }
    async upsertPublicIndex(record) {
        const existing = (await this.query(TABLES.publicIndex, `Article_UUID = ${sql(record.articleUuid)}`))[0];
        if (!existing) {
            try {
                await this.table(TABLES.publicIndex).insertRow(publicIndexRow(record));
                return;
            }
            catch (error) {
                const raced = (await this.query(TABLES.publicIndex, `Article_UUID = ${sql(record.articleUuid)}`).catch(() => []))[0];
                if (!raced)
                    throw error;
            }
        }
        const current = (await this.query(TABLES.publicIndex, `Article_UUID = ${sql(record.articleUuid)}`))[0];
        if (!current)
            throw new errors_1.PublicationError("Public index row disappeared during update", "PUBLIC_INDEX_WRITE_FAILED", true, 503);
        const currentVersion = numeric(current.Pointer_Version);
        if (currentVersion > record.pointerVersion)
            return;
        if (currentVersion === record.pointerVersion && String(current.Publication_ID) !== record.publicationId) {
            throw new errors_1.PublicationError("Public index pointer version contains different content", "PUBLIC_INDEX_CONFLICT", false, 409);
        }
        await this.update(TABLES.publicIndex, publicIndexRow(record), `Article_UUID = ${sql(record.articleUuid)} AND Pointer_Version <= ${record.pointerVersion}`);
    }
    async getPublicIndexBySlug(slug) {
        const rows = await this.query(TABLES.publicIndex, `Slug = ${sql(slug)}`);
        if (rows.length > 1) {
            throw new errors_1.PublicationError("Multiple current articles use the same public slug", "PUBLIC_SLUG_CONFLICT", false, 409);
        }
        return rows[0] ? publicIndexFromRow(rows[0]) : null;
    }
    async listPublicIndex() {
        const rows = [];
        for await (const row of this.table(TABLES.publicIndex).getIterableRows()) {
            rows.push(publicIndexFromRow(row));
        }
        return rows;
    }
    async enqueueCallback(event) {
        try {
            const row = await this.table(TABLES.callbacks).insertRow({
                Event_ID: event.eventId, Request_ID: event.requestId, Creator_Job_ID: event.creatorJobId,
                Idempotency_Key: event.idempotencyKey, Callback_Status: event.status,
                Publication_Attempt_Count: event.attemptCount, Publication_ID: event.publicationId, Object_ID: event.objectId,
                Published_At: event.publishedAt, Publication_Next_Retry_At: event.nextRetryAt, Error_Code: event.errorCode,
                Error_Message: event.errorMessage, Delivery_Status: "Pending", Delivery_Attempt_Count: 0
            });
            return callbackFromRow(row);
        }
        catch (error) {
            const existing = await this.getCallback(event.eventId);
            if (!existing)
                throw error;
            return existing;
        }
    }
    async getCallback(eventId) {
        const row = (await this.query(TABLES.callbacks, `Event_ID = ${sql(eventId)}`))[0];
        return row ? callbackFromRow(row) : null;
    }
    async markCallbackDelivered(eventId) {
        const current = await this.getCallback(eventId);
        await this.update(TABLES.callbacks, { Delivery_Status: "Delivered", Delivery_Attempt_Count: (current?.deliveryAttemptCount ?? 0) + 1, Next_Delivery_At: null, Last_Delivery_Error: null }, `Event_ID = ${sql(eventId)}`);
    }
    async markCallbackRetry(eventId, attemptCount, nextDeliveryAt, message) {
        await this.update(TABLES.callbacks, { Delivery_Status: "RetryScheduled", Delivery_Attempt_Count: attemptCount, Next_Delivery_At: nextDeliveryAt, Last_Delivery_Error: message.slice(0, 9000) }, `Event_ID = ${sql(eventId)}`);
    }
    async markCallbackDeadLetter(eventId, attemptCount, message) {
        await this.update(TABLES.callbacks, { Delivery_Status: "DeadLetter", Delivery_Attempt_Count: attemptCount, Next_Delivery_At: null, Last_Delivery_Error: message.slice(0, 9000) }, `Event_ID = ${sql(eventId)}`);
    }
    async reopenDeadLetterCallback(eventId) {
        await this.update(TABLES.callbacks, { Delivery_Status: "Pending", Delivery_Attempt_Count: 0, Next_Delivery_At: null, Last_Delivery_Error: null }, `Event_ID = ${sql(eventId)} AND Delivery_Status = 'DeadLetter'`);
    }
}
exports.CatalystPublicationStore = CatalystPublicationStore;
async function streamToBuffer(value, maxBytes = 25 * 1024 * 1024) {
    if (Buffer.isBuffer(value))
        return value;
    const chunks = [];
    let total = 0;
    for await (const chunk of value) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        total += buffer.length;
        if (total > maxBytes)
            throw new errors_1.PublicationError("Downloaded object exceeds the configured limit", "OBJECT_TOO_LARGE", false, 422);
        chunks.push(buffer);
    }
    return Buffer.concat(chunks);
}
function publicObjectUrl(baseUrl, objectKey) {
    const encodedKey = objectKey.split("/").map(encodeURIComponent).join("/");
    return `${baseUrl.replace(/\/$/, "")}/${encodedKey}`;
}
class CatalystStratusObjectStore {
    publicBaseUrl;
    privateBucket;
    publicBucket;
    constructor(app, privateBucketName, publicBucketName, publicBaseUrl) {
        this.publicBaseUrl = publicBaseUrl;
        const stratus = app.stratus();
        this.privateBucket = stratus.bucket(privateBucketName);
        this.publicBucket = stratus.bucket(publicBucketName);
    }
    async putPrivateJson(objectKey, value) {
        await this.putImmutable(this.privateBucket, objectKey, Buffer.from(JSON.stringify(value)), "application/json", { visibility: "private" });
        return objectKey;
    }
    async getPrivateJson(objectKey) {
        const buffer = await streamToBuffer(await this.privateBucket.getObject(objectKey));
        return JSON.parse(buffer.toString("utf8"));
    }
    async putPublicJson(objectKey, value) {
        await this.putImmutable(this.publicBucket, objectKey, Buffer.from(JSON.stringify(value)), "application/json", { visibility: "public" });
        return { objectKey, publicUrl: publicObjectUrl(this.publicBaseUrl, objectKey) };
    }
    async getPublicJson(objectKey) {
        const buffer = await streamToBuffer(await this.publicBucket.getObject(objectKey));
        return JSON.parse(buffer.toString("utf8"));
    }
    async putPublicMedia(objectKey, value, contentType, metadata) {
        await this.putImmutable(this.publicBucket, objectKey, value, contentType, metadata);
        return { objectKey, publicUrl: publicObjectUrl(this.publicBaseUrl, objectKey) };
    }
    async putImmutable(bucket, objectKey, value, contentType, metaData) {
        try {
            await bucket.putObject(objectKey, value, { overwrite: false, contentType, metaData });
        }
        catch (error) {
            // A duplicate delivery can race after the existence check. Content-addressed
            // keys are reusable only when the stored bytes are exactly identical.
            const existing = await streamToBuffer(await bucket.getObject(objectKey)).catch(() => null);
            if (!existing || (0, security_1.sha256Hex)(existing) !== (0, security_1.sha256Hex)(value))
                throw error;
        }
    }
}
exports.CatalystStratusObjectStore = CatalystStratusObjectStore;
class ZohoCreatorMediaSource {
    app;
    oauth;
    options;
    constructor(app, oauth, options) {
        this.app = app;
        this.oauth = oauth;
        this.options = options;
    }
    async download(asset) {
        const accessToken = await resolveCreatorAccessToken(this.app, this.oauth);
        const parts = [this.options.accountOwner, this.options.appLinkName, this.options.reportLinkName, asset.creatorRecordId, this.options.fileFieldLinkName]
            .map(encodeURIComponent);
        const url = `${this.options.apiBaseUrl.replace(/\/$/, "")}/creator/v2.1/data/${parts[0]}/${parts[1]}/report/${parts[2]}/${parts[3]}/${parts[4]}/download`;
        const headers = { authorization: `Zoho-oauthtoken ${accessToken}` };
        if (this.options.environment && this.options.environment !== "production")
            headers.environment = this.options.environment;
        const response = await fetch(url, { method: "GET", headers });
        if (!response.ok) {
            const transient = response.status === 429 || response.status >= 500;
            throw new errors_1.PublicationError(`Creator media ${asset.mediaId} download returned HTTP ${response.status}`, transient ? "CREATOR_MEDIA_UNAVAILABLE" : "CREATOR_MEDIA_DOWNLOAD_REJECTED", transient, transient ? 503 : 422);
        }
        const declaredLength = Number(response.headers.get("content-length") ?? 0);
        if (declaredLength > this.options.maxBytes) {
            throw new errors_1.PublicationError(`Creator media ${asset.mediaId} exceeds the configured limit`, "MEDIA_TOO_LARGE", false, 422);
        }
        if (!response.body)
            throw new errors_1.PublicationError(`Creator media ${asset.mediaId} returned an empty body`, "CREATOR_MEDIA_EMPTY", false, 422);
        return streamToBuffer(response.body, this.options.maxBytes);
    }
}
exports.ZohoCreatorMediaSource = ZohoCreatorMediaSource;
const MAX_CRON_NAME_LENGTH = 30;
const MAX_JOB_NAME_LENGTH = 20;
const MIN_SCHEDULING_LEAD_MS = 120_000;
function isAlreadyExistsError(error) {
    const record = error && typeof error === "object" ? error : {};
    const status = Number(record.statusCode);
    const code = String(record.code ?? "").toLowerCase();
    const message = String(record.message ?? "").toLowerCase();
    return status === 409 || code.includes("exist") || code.includes("duplicate") || message.includes("already exists") || message.includes("duplicate");
}
class CatalystScheduler {
    app;
    options;
    now;
    constructor(app, options, now = Date.now) {
        this.app = app;
        this.options = options;
        this.now = now;
    }
    async dispatchPublicationNow(requestId) {
        const body = { requestId };
        const path = this.options.publicationPath;
        const prefix = "gdpub";
        const identityHash = (0, security_1.sha256Hex)(requestId);
        const jobName = `${prefix}${identityHash.slice(0, MAX_JOB_NAME_LENGTH - prefix.length)}`;
        const scheduling = this.app.jobScheduling();
        const jobApi = typeof scheduling.job === "function" ? scheduling.job() : scheduling.JOB;
        try {
            const job = await jobApi.submitJob({
                job_name: jobName,
                target_type: "AppSail",
                target_name: this.options.appSailName,
                jobpool_name: this.options.jobPoolName,
                request_method: "POST",
                url: path,
                headers: { "content-type": "application/json", "x-genedrift-internal-secret": this.options.internalSecret },
                request_body: JSON.stringify(body)
            });
            return String(job.id ?? job.job_id ?? jobName);
        }
        catch (error) {
            if (isAlreadyExistsError(error)) {
                return jobName;
            }
            throw error;
        }
    }
    schedulePublication(requestId, runAt, preserveRequestedTime = false) {
        return this.schedule("pub", this.options.publicationPath, { requestId }, runAt, preserveRequestedTime);
    }
    scheduleCallback(eventId, runAt) {
        return this.schedule("cb", this.options.callbackPath, { eventId }, runAt);
    }
    async schedule(kind, path, body, requestedRunAt, preserveRequestedTime = false) {
        const runAt = preserveRequestedTime
            ? new Date(requestedRunAt)
            : new Date(Math.max(requestedRunAt.getTime(), this.now() + MIN_SCHEDULING_LEAD_MS));
        // The execution time is part of the identity: duplicate scheduling for the
        // same attempt converges, while a later retry receives a new one-time cron.
        const identityHash = (0, security_1.sha256Hex)(`${Object.values(body).join(":")}:${runAt.toISOString()}`);
        const cronPrefix = `gd${kind}`;
        const name = `${cronPrefix}${identityHash.slice(0, MAX_CRON_NAME_LENGTH - cronPrefix.length)}`;
        // Catalyst limits job_name to 20 characters. Use only conservative
        // lowercase alphanumeric characters for both generated identifiers.
        const jobName = `${cronPrefix}${identityHash.slice(0, MAX_JOB_NAME_LENGTH - cronPrefix.length)}`;
        const requestBody = JSON.stringify(body);
        const appAny = this.app;
        try {
            if (typeof appAny.jobScheduling === "function") {
                const scheduling = appAny.jobScheduling();
                const cronApi = typeof scheduling.cron === "function" ? scheduling.cron() : scheduling.CRON;
                const cron = await cronApi.createCron({
                    cron_name: name,
                    cron_status: true,
                    cron_type: "OneTime",
                    cron_detail: { time_of_execution: String(Math.floor(runAt.getTime() / 1000)) },
                    job_meta: {
                        job_name: jobName,
                        target_type: "AppSail",
                        target_name: this.options.appSailName,
                        jobpool_name: this.options.jobPoolName,
                        request_method: "POST",
                        url: path,
                        headers: { "content-type": "application/json", "x-genedrift-internal-secret": this.options.internalSecret },
                        request_body: requestBody
                    }
                });
                return String(cron.id ?? cron.cron_id ?? name);
            }
            const cron = await this.app.cron().createCron({
                cron_name: name,
                cron_type: "OneTime",
                status: true,
                cron_url_details: {
                    url: `${this.options.appSailBaseUrl.replace(/\/$/, "")}${path}`,
                    request_method: "POST",
                    headers: { "content-type": "application/json", "x-genedrift-internal-secret": this.options.internalSecret },
                    request_body: requestBody
                },
                job_detail: { time_of_execution: String(Math.floor(runAt.getTime() / 1000)) }
            });
            return String(cron.id);
        }
        catch (error) {
            if (isAlreadyExistsError(error)) {
                return name;
            }
            const existing = await this.findExistingLegacyCron(name).catch(() => null);
            if (existing)
                return existing;
            throw error;
        }
    }
    async findExistingLegacyCron(name) {
        const all = await this.app.cron().getAllCron();
        const match = all.find((cron) => cron.cron_name === name);
        return match ? String(match.id) : null;
    }
}
exports.CatalystScheduler = CatalystScheduler;
class ZohoCreatorCallbackClient {
    app;
    callbackUrl;
    hmacSecret;
    oauth;
    constructor(app, callbackUrl, hmacSecret, oauth) {
        this.app = app;
        this.callbackUrl = callbackUrl;
        this.hmacSecret = hmacSecret;
        this.oauth = oauth;
    }
    async send(event) {
        const callbackTimestamp = String(Math.floor(Date.now() / 1000));
        const callbackNonce = `${event.eventId}:${(0, node_crypto_1.randomUUID)()}`;
        const signatureFields = { callbackTimestamp, callbackNonce, ...event };
        const callbackSignature = (0, node_crypto_1.createHmac)("sha256", this.hmacSecret).update((0, security_1.callbackSignaturePayload)(signatureFields)).digest("hex");
        // Creator Custom API string arguments are most reliable when optional
        // values are explicit empty strings rather than JSON null. The signature
        // contract already canonicalizes null as empty, so the wire form is equal.
        const wireEvent = {
            ...event,
            publicationId: event.publicationId ?? "",
            objectId: event.objectId ?? "",
            publishedAt: event.publishedAt ?? "",
            nextRetryAt: event.nextRetryAt ?? "",
            errorCode: event.errorCode ?? "",
            errorMessage: event.errorMessage ?? "",
            mediaJson: JSON.stringify(event.media)
        };
        delete wireEvent.media;
        const accessToken = await resolveCreatorAccessToken(this.app, this.oauth);
        const response = await fetch(this.callbackUrl, {
            method: "POST",
            headers: {
                "authorization": `Zoho-oauthtoken ${accessToken}`,
                "content-type": "application/json"
            },
            body: JSON.stringify({ ...wireEvent, callbackTimestamp, callbackNonce, callbackSignature })
        });
        if (!response.ok)
            throw new Error(`Creator callback returned HTTP ${response.status}: ${(await response.text()).slice(0, 1000)}`);
        const body = await response.json().catch(() => null);
        const result = body?.result ?? body;
        if (result?.ok === false)
            throw new Error(`Creator callback rejected the event: ${result.message ?? "unknown error"}`);
    }
}
exports.ZohoCreatorCallbackClient = ZohoCreatorCallbackClient;
async function resolveCreatorAccessToken(app, options) {
    if (options.connectorName && options.clientId && options.clientSecret && options.refreshToken && options.tokenUrl) {
        const connection = app.connection({
            [options.connectorName]: {
                client_id: options.clientId,
                client_secret: options.clientSecret,
                auth_url: options.tokenUrl,
                refresh_url: options.tokenUrl,
                refresh_token: options.refreshToken,
                expires_in: "3600",
                redirect_url: ""
            }
        });
        return connection.getConnector(options.connectorName).getAccessToken();
    }
    if (options.clientId && options.clientSecret && options.refreshToken && options.tokenUrl) {
        const form = new URLSearchParams({
            grant_type: "refresh_token",
            client_id: options.clientId,
            client_secret: options.clientSecret,
            refresh_token: options.refreshToken
        });
        const response = await fetch(options.tokenUrl, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: form
        });
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.access_token) {
            throw new errors_1.PublicationError(`Creator OAuth refresh failed with HTTP ${response.status}`, "CREATOR_OAUTH_REFRESH_FAILED", true, 502);
        }
        return String(body.access_token);
    }
    if (options.staticToken)
        return options.staticToken;
    throw new errors_1.PublicationError("Creator OAuth connection is not configured", "CREATOR_CONNECTION_MISSING", true);
}
class ZohoCreatorPublicationAuthority {
    app;
    validateUrl;
    oauth;
    constructor(app, validateUrl, oauth) {
        this.app = app;
        this.validateUrl = validateUrl;
        this.oauth = oauth;
    }
    async assertPublishable(handoff) {
        const accessToken = await resolveCreatorAccessToken(this.app, this.oauth);
        const response = await fetch(this.validateUrl, {
            method: "POST",
            headers: {
                "authorization": `Zoho-oauthtoken ${accessToken}`,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                creatorJobId: handoff.job.creatorJobId,
                idempotencyKey: handoff.job.idempotencyKey,
                articleRecordId: handoff.article.creatorRecordId,
                articleUuid: handoff.article.uuid,
                revisionRecordId: handoff.revision.creatorRecordId,
                revisionUuid: handoff.revision.uuid,
                documentChecksum: handoff.revision.documentChecksum
            })
        });
        if (!response.ok) {
            const transient = response.status === 429 || response.status >= 500;
            throw new errors_1.PublicationError(`Creator publication preflight returned HTTP ${response.status}`, transient ? "CREATOR_PREFLIGHT_UNAVAILABLE" : "CREATOR_PREFLIGHT_HTTP_REJECTED", transient, transient ? 503 : 409);
        }
        const body = await response.json().catch(() => null);
        const result = body?.result ?? body;
        if (result?.ok !== true) {
            throw new errors_1.PublicationError(result?.message ?? "Creator rejected the publication snapshot", result?.code ?? "CREATOR_PREFLIGHT_REJECTED", false, 409);
        }
    }
}
exports.ZohoCreatorPublicationAuthority = ZohoCreatorPublicationAuthority;
//# sourceMappingURL=catalyst.js.map