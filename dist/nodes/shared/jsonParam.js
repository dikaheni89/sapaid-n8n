"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJsonParam = parseJsonParam;
exports.stableStringify = stableStringify;
/**
 * Reads a node parameter declared as `type: 'json'`, which reaches the handler as
 * either the text the user typed or, when the field is driven by a single
 * expression, an already-resolved object. Both shapes are accepted.
 *
 * Returns undefined when nothing was supplied, so a caller can omit the key rather
 * than send a blank one. Throws SyntaxError on malformed text; callers wrap that in
 * a NodeOperationError naming the field.
 */
function parseJsonParam(raw) {
    if (raw === undefined || raw === null) {
        return undefined;
    }
    if (typeof raw !== 'string') {
        return raw;
    }
    const trimmed = raw.trim();
    if (!trimmed) {
        return undefined;
    }
    return JSON.parse(trimmed);
}
/**
 * Key-order-insensitive serialisation, for comparing a value the node sent against
 * the same value read back from the server, where a JSON column may not preserve
 * key order. Total by construction: it never throws, because it decides whether a
 * webhook re-registers and must answer rather than crash activation.
 */
function stableStringify(value, seen = new Set()) {
    let current = value;
    if (current !== null && typeof current === 'object') {
        const withToJson = current;
        if (typeof withToJson.toJSON === 'function') {
            current = withToJson.toJSON();
        }
    }
    if (current === null || typeof current !== 'object') {
        if (typeof current === 'bigint') {
            return JSON.stringify(String(current));
        }
        return JSON.stringify(current ?? null) ?? 'null';
    }
    const container = current;
    if (seen.has(container)) {
        return '"[Circular]"';
    }
    seen.add(container);
    try {
        if (Array.isArray(current)) {
            return `[${current.map((item) => stableStringify(item, seen)).join(',')}]`;
        }
        const entries = Object.entries(current)
            .filter(([, v]) => v !== undefined && typeof v !== 'function')
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
        return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v, seen)}`).join(',')}}`;
    }
    finally {
        seen.delete(container);
    }
}
