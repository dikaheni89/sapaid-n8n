import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
/**
 * A node parameter read as text. An expression can resolve to a number, a boolean
 * or an object, and calling .trim() on one throws a TypeError that reaches the
 * user as an opaque error naming no field. A numeric ID keeps working; a bare
 * object is refused with a hint, because "[object Object]" would otherwise be
 * accepted by the server and land in a chat as a real message.
 */
export declare function asText(value: unknown, label?: string): string;
/**
 * Reads a required free-text parameter, trimmed, optionally length-checked so
 * oversized input fails with a pointed message instead of a generic 400.
 */
export declare function requireText(ctx: IExecuteFunctions, paramName: string, label: string, itemIndex: number, maxLength?: number): string;
/** An optional text parameter: undefined when blank, so the caller omits the key. */
export declare function optionalText(ctx: IExecuteFunctions, paramName: string, label: string, itemIndex: number): string | undefined;
/**
 * Reads a required ID parameter destined for a URL path segment. The bare Error
 * from sanitizePathParam is rewrapped so the item index survives.
 */
export declare function requirePathId(ctx: IExecuteFunctions, paramName: string, label: string, itemIndex: number): string;
/**
 * Reads the recipient of a send, normalised to the international form the API
 * expects (`0812…` → `62812…`; a value with `@` is a chat or group ID and passes
 * through). Refuses what cannot be a number so the field is named, rather than
 * forwarding text the server will reject.
 */
export declare function requireRecipient(ctx: IExecuteFunctions, paramName: string, label: string, itemIndex: number): string;
/**
 * Turns a `collection` parameter into a query object.
 *
 * Only entries the user actually added are present, so anything left undefined,
 * null, or blank is dropped. `0` and `false` are meaningful (offset 0, a disabled
 * flag) and are kept.
 */
export declare function toQueryParams(options: IDataObject | undefined): IDataObject;
export declare function toStringList(raw: unknown): string[];
/**
 * Reads the shared list options (Return All / Limit / extra filters) into the
 * query and returnAll flag every list operation uses. `limit` is only sent when
 * one page is wanted; with Return All the server default page size is used and
 * the executor follows the cursor.
 */
export declare function readListOptions(ctx: IExecuteFunctions, itemIndex: number, filtersParam?: string): {
    qs: IDataObject;
    returnAll: boolean;
};
/**
 * Reads an ISO date/time parameter and hands back the ISO string the API takes.
 * An expression can supply epoch milliseconds; those are converted so the server
 * sees one shape. Blank means "not set".
 */
export declare function optionalIsoDate(ctx: IExecuteFunctions, paramName: string, label: string, itemIndex: number): string | undefined;
