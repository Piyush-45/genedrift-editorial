"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256Hex = sha256Hex;
exports.signatureBase = signatureBase;
exports.signRequest = signRequest;
exports.verifyRequestSignature = verifyRequestSignature;
exports.stableJson = stableJson;
exports.deterministicId = deterministicId;
exports.newLeaseToken = newLeaseToken;
exports.callbackSignaturePayload = callbackSignaturePayload;
const node_crypto_1 = require("node:crypto");
const errors_1 = require("./errors");
function sha256Hex(value) {
    return (0, node_crypto_1.createHash)("sha256").update(value).digest("hex");
}
function signatureBase(method, path, timestamp, nonce, rawBody) {
    return [method.toUpperCase(), path, timestamp, nonce, sha256Hex(rawBody)].join("\n");
}
function signRequest(secret, method, path, timestamp, nonce, rawBody) {
    return (0, node_crypto_1.createHmac)("sha256", secret).update(signatureBase(method, path, timestamp, nonce, rawBody)).digest("hex");
}
function verifyRequestSignature(secret, method, path, rawBody, headers, now, maxClockSkewSeconds) {
    if (!headers.timestamp || !headers.nonce || !headers.signature) {
        throw new errors_1.PublicationError("Missing request authentication headers", "AUTH_HEADERS_MISSING", false, 401);
    }
    if (!/^[A-Za-z0-9._:-]{8,200}$/.test(headers.nonce)) {
        throw new errors_1.PublicationError("Invalid request nonce", "AUTH_NONCE_INVALID", false, 401);
    }
    const timestampSeconds = Number(headers.timestamp);
    if (!Number.isFinite(timestampSeconds)) {
        throw new errors_1.PublicationError("Invalid request timestamp", "AUTH_TIMESTAMP_INVALID", false, 401);
    }
    const skew = Math.abs(Math.floor(now.getTime() / 1000) - timestampSeconds);
    if (skew > maxClockSkewSeconds) {
        throw new errors_1.PublicationError("Request timestamp is outside the allowed clock skew", "AUTH_TIMESTAMP_EXPIRED", false, 401);
    }
    const expected = Buffer.from(signRequest(secret, method, path, headers.timestamp, headers.nonce, rawBody), "hex");
    const actual = Buffer.from(headers.signature, "hex");
    if (expected.length !== actual.length || !(0, node_crypto_1.timingSafeEqual)(expected, actual)) {
        throw new errors_1.PublicationError("Invalid request signature", "AUTH_SIGNATURE_INVALID", false, 401);
    }
}
function stableJson(value) {
    if (value === null || typeof value !== "object")
        return JSON.stringify(value);
    if (Array.isArray(value))
        return `[${value.map(stableJson).join(",")}]`;
    const record = value;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
}
function deterministicId(prefix, ...parts) {
    return `${prefix}_${sha256Hex(parts.join("\n")).slice(0, 40)}`;
}
function newLeaseToken() {
    return (0, node_crypto_1.randomUUID)();
}
function callbackSignaturePayload(event) {
    return [
        event.callbackTimestamp,
        event.callbackNonce,
        event.eventId,
        event.creatorJobId,
        event.idempotencyKey,
        event.status,
        String(event.attemptCount),
        event.publicationId ?? "",
        event.objectId ?? "",
        event.publishedAt ?? "",
        event.nextRetryAt ?? "",
        event.errorCode ?? "",
        event.errorMessage ?? "",
        JSON.stringify(event.media)
    ].join("\n");
}
//# sourceMappingURL=security.js.map