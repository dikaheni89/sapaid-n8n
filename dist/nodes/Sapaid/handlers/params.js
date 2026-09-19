"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asText = asText;
exports.requireText = requireText;
exports.optionalText = optionalText;
exports.requirePathId = requirePathId;
exports.requireRecipient = requireRecipient;
exports.toQueryParams = toQueryParams;
exports.toStringList = toStringList;
exports.readListOptions = readListOptions;
exports.optionalIsoDate = optionalIsoDate;
const n8n_workflow_1 = require("n8n-workflow");
const phone_1 = require("../../shared/phone");
const sanitizePathParam_1 = require("../../shared/sanitizePathParam");
/** What an object with nothing useful to say stringifies to. */
const OPAQUE_OBJECT = '[object Object]';
/**
 * A node parameter read as text. An expression can resolve to a number, a boolean
 * or an object, and calling .trim() on one throws a TypeError that reaches the
 * user as an opaque error naming no field. A numeric ID keeps working; a bare
 * object is refused with a hint, because "[object Object]" would otherwise be
 * accepted by the server and land in a chat as a real message.
 */
function asText(value, label = 'This field') {
    if (value === undefined || value === null) {
        return '';
    }
    if (typeof value === 'object') {
        let text;
        try {
            text = String(value);
        }
        catch {
            text = OPAQUE_OBJECT;
        }
        if (text === OPAQUE_OBJECT) {
            throw new Error(`${label} must be text. Point the expression at the value itself, e.g. {{ $json.data.text }}.`);
        }
        return text.trim();
    }
    return typeof value === 'string' ? value.trim() : String(value).trim();
}
/**
 * Reads a required free-text parameter, trimmed, optionally length-checked so
 * oversized input fails with a pointed message instead of a generic 400.
 */
function requireText(ctx, paramName, label, itemIndex, maxLength) {
    const value = asText(ctx.getNodeParameter(paramName, itemIndex), label);
    if (!value) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), `${label} cannot be empty`, { itemIndex });
    }
    if (maxLength !== undefined && value.length > maxLength) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), `${label} cannot exceed ${maxLength} characters`, {
            itemIndex,
        });
    }
    return value;
}
/** An optional text parameter: undefined when blank, so the caller omits the key. */
function optionalText(ctx, paramName, label, itemIndex) {
    const value = asText(ctx.getNodeParameter(paramName, itemIndex, ''), label);
    return value || undefined;
}
/**
 * Reads a required ID parameter destined for a URL path segment. The bare Error
 * from sanitizePathParam is rewrapped so the item index survives.
 */
function requirePathId(ctx, paramName, label, itemIndex) {
    try {
        return (0, sanitizePathParam_1.sanitizePathParam)(ctx.getNodeParameter(paramName, itemIndex), label);
    }
    catch (error) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), error.message, { itemIndex });
    }
}
/**
 * Reads the recipient of a send, normalised to the international form the API
 * expects (`0812…` → `62812…`; a value with `@` is a chat or group ID and passes
 * through). Refuses what cannot be a number so the field is named, rather than
 * forwarding text the server will reject.
 */
function requireRecipient(ctx, paramName, label, itemIndex) {
    const raw = asText(ctx.getNodeParameter(paramName, itemIndex), label);
    if (!raw) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), `${label} cannot be empty`, { itemIndex });
    }
    const normalized = (0, phone_1.normalizeRecipient)(raw);
    if (!normalized) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), `${label} is not a valid phone number. Use the international form, e.g. 628123456789.`, { itemIndex });
    }
    return normalized;
}
/**
 * Turns a `collection` parameter into a query object.
 *
 * Only entries the user actually added are present, so anything left undefined,
 * null, or blank is dropped. `0` and `false` are meaningful (offset 0, a disabled
 * flag) and are kept.
 */
function toQueryParams(options) {
    const qs = {};
    for (const [key, value] of Object.entries(options ?? {})) {
        if (value !== undefined && value !== null && value !== '') {
            qs[key] = value;
        }
    }
    return qs;
}
/**
 * Normalises a list parameter into a trimmed, blank-free array of strings.
 *
 * These fields are plain strings rather than `multipleValues` collections so an
 * expression can drive them. Three shapes are accepted: a real array (from an
 * expression), a JSON array string, or a comma/newline-separated string.
 */
function listEntry(value) {
    if (typeof value === 'object' && value !== null) {
        throw new Error('List entries must be text. Map the expression to the values themselves, e.g. {{ $json.items.map((i) => i.id) }}.');
    }
    return String(value ?? '').trim();
}
function toStringList(raw) {
    if (raw === undefined || raw === null || raw === '') {
        return [];
    }
    if (Array.isArray(raw)) {
        return raw.map(listEntry).filter(Boolean);
    }
    if (typeof raw !== 'string') {
        return [listEntry(raw)].filter(Boolean);
    }
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
        let parsed;
        try {
            parsed = JSON.parse(trimmed);
        }
        catch {
            // Not JSON after all: fall through to the separator split.
        }
        if (Array.isArray(parsed)) {
            return parsed.map(listEntry).filter(Boolean);
        }
    }
    return trimmed
        .split(/[,\n]/)
        .map((v) => v.trim())
        .filter(Boolean);
}
/**
 * Reads the shared list options (Return All / Limit / extra filters) into the
 * query and returnAll flag every list operation uses. `limit` is only sent when
 * one page is wanted; with Return All the server default page size is used and
 * the executor follows the cursor.
 */
function readListOptions(ctx, itemIndex, filtersParam = 'filters') {
    const returnAll = ctx.getNodeParameter('returnAll', itemIndex, false);
    const qs = toQueryParams(ctx.getNodeParameter(filtersParam, itemIndex, {}));
    if (!returnAll) {
        const limit = ctx.getNodeParameter('limit', itemIndex, 50);
        qs.limit = limit;
    }
    return { qs, returnAll };
}
/**
 * Reads an ISO date/time parameter and hands back the ISO string the API takes.
 * An expression can supply epoch milliseconds; those are converted so the server
 * sees one shape. Blank means "not set".
 */
function optionalIsoDate(ctx, paramName, label, itemIndex) {
    const raw = ctx.getNodeParameter(paramName, itemIndex, '');
    if (raw === undefined || raw === null || raw === '') {
        return undefined;
    }
    const ms = typeof raw === 'number' ? raw : Date.parse(String(raw));
    if (!Number.isFinite(ms)) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), `${label} is not a valid date`, { itemIndex });
    }
    return new Date(ms).toISOString();
}
