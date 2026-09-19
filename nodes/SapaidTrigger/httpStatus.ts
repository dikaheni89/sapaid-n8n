/**
 * Reads the HTTP status from an error thrown by httpRequestWithAuthentication.
 * It may appear as a numeric `statusCode`, a string `httpCode` (once wrapped in a
 * NodeApiError), or under `response.status`. Returns undefined when none can be
 * read (network/DNS errors, timeouts), which callers treat as "not a definitive
 * status" rather than matching it against 404.
 */
export function httpStatusFromError(error: unknown): number | undefined {
  const err = error as Record<string, unknown>;
  const raw =
    err?.httpCode ?? err?.statusCode ?? (err?.response as Record<string, unknown>)?.status;
  const status = Number(raw);
  return Number.isFinite(status) ? status : undefined;
}
