import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { PublicationError } from "./errors";

export interface SignedRequestHeaders {
  timestamp: string;
  nonce: string;
  signature: string;
}

export function sha256Hex(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function signatureBase(method: string, path: string, timestamp: string, nonce: string, rawBody: Buffer): string {
  return [method.toUpperCase(), path, timestamp, nonce, sha256Hex(rawBody)].join("\n");
}

export function signRequest(secret: string, method: string, path: string, timestamp: string, nonce: string, rawBody: Buffer): string {
  return createHmac("sha256", secret).update(signatureBase(method, path, timestamp, nonce, rawBody)).digest("hex");
}

export function verifyRequestSignature(
  secret: string,
  method: string,
  path: string,
  rawBody: Buffer,
  headers: SignedRequestHeaders,
  now: Date,
  maxClockSkewSeconds: number
): void {
  if (!headers.timestamp || !headers.nonce || !headers.signature) {
    throw new PublicationError("Missing request authentication headers", "AUTH_HEADERS_MISSING", false, 401);
  }
  if (!/^[A-Za-z0-9._:-]{8,200}$/.test(headers.nonce)) {
    throw new PublicationError("Invalid request nonce", "AUTH_NONCE_INVALID", false, 401);
  }
  const timestampSeconds = Number(headers.timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    throw new PublicationError("Invalid request timestamp", "AUTH_TIMESTAMP_INVALID", false, 401);
  }
  const skew = Math.abs(Math.floor(now.getTime() / 1000) - timestampSeconds);
  if (skew > maxClockSkewSeconds) {
    throw new PublicationError("Request timestamp is outside the allowed clock skew", "AUTH_TIMESTAMP_EXPIRED", false, 401);
  }
  const expected = Buffer.from(signRequest(secret, method, path, headers.timestamp, headers.nonce, rawBody), "hex");
  const actual = Buffer.from(headers.signature, "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new PublicationError("Invalid request signature", "AUTH_SIGNATURE_INVALID", false, 401);
  }
}

export function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
}

export function deterministicId(prefix: string, ...parts: string[]): string {
  return `${prefix}_${sha256Hex(parts.join("\n")).slice(0, 40)}`;
}

export function newLeaseToken(): string {
  return randomUUID();
}

export function callbackSignaturePayload(event: {
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
}): string {
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
