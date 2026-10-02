"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicationError = void 0;
exports.asPublicationError = asPublicationError;
class PublicationError extends Error {
    code;
    transient;
    httpStatus;
    constructor(message, code, transient, httpStatus = 500) {
        super(message);
        this.code = code;
        this.transient = transient;
        this.httpStatus = httpStatus;
        this.name = "PublicationError";
    }
}
exports.PublicationError = PublicationError;
function asPublicationError(error) {
    if (error instanceof PublicationError)
        return error;
    if (error instanceof Error)
        return new PublicationError(error.message, "UNEXPECTED_ERROR", true);
    // The Catalyst Node SDK rejects unsuccessful HTTP responses as plain objects
    // shaped like { statusCode, code, message }, rather than Error instances.
    // Normalize only these non-sensitive scalar fields; never include the SDK's
    // request configuration, headers, or arbitrary response values in logs.
    if (error && typeof error === "object") {
        const record = error;
        const statusCode = Number(record.statusCode);
        const httpStatus = Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599 ? statusCode : 500;
        const rawMessage = typeof record.message === "string" ? record.message.trim() : "";
        const rawCode = typeof record.code === "string" ? record.code.trim() : "";
        const code = rawCode
            ? `CATALYST_${rawCode.toUpperCase().replace(/[^A-Z0-9_]+/g, "_").slice(0, 80)}`
            : "CATALYST_API_ERROR";
        const transient = httpStatus === 429 || httpStatus >= 500;
        return new PublicationError(rawMessage || `Catalyst API returned HTTP ${httpStatus}`, code, transient, httpStatus);
    }
    return new PublicationError("Unexpected publication error", "UNEXPECTED_ERROR", true);
}
//# sourceMappingURL=errors.js.map