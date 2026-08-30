export class PublicationError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly transient: boolean,
    readonly httpStatus = 500
  ) {
    super(message);
    this.name = "PublicationError";
  }
}

export function asPublicationError(error: unknown): PublicationError {
  if (error instanceof PublicationError) return error;
  if (error instanceof Error) return new PublicationError(error.message, "UNEXPECTED_ERROR", true);

  // The Catalyst Node SDK rejects unsuccessful HTTP responses as plain objects
  // shaped like { statusCode, code, message }, rather than Error instances.
  // Normalize only these non-sensitive scalar fields; never include the SDK's
  // request configuration, headers, or arbitrary response values in logs.
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
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
