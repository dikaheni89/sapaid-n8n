/**
 * Reads the HTTP status from an error thrown by httpRequestWithAuthentication.
 * It may appear as a numeric `statusCode`, a string `httpCode` (once wrapped in a
 * NodeApiError), or under `response.status`. Returns undefined when none can be
 * read (network/DNS errors, timeouts), which callers treat as "not a definitive
 * status" rather than matching it against 404.
 */
export declare function httpStatusFromError(error: unknown): number | undefined;
