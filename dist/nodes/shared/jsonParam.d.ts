/**
 * Reads a node parameter declared as `type: 'json'`, which reaches the handler as
 * either the text the user typed or, when the field is driven by a single
 * expression, an already-resolved object. Both shapes are accepted.
 *
 * Returns undefined when nothing was supplied, so a caller can omit the key rather
 * than send a blank one. Throws SyntaxError on malformed text; callers wrap that in
 * a NodeOperationError naming the field.
 */
export declare function parseJsonParam(raw: unknown): unknown;
/**
 * Key-order-insensitive serialisation, for comparing a value the node sent against
 * the same value read back from the server, where a JSON column may not preserve
 * key order. Total by construction: it never throws, because it decides whether a
 * webhook re-registers and must answer rather than crash activation.
 */
export declare function stableStringify(value: unknown, seen?: Set<object>): string;
