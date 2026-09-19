import type { INodeProperties } from 'n8n-workflow';
/**
 * Property fragments shared by several resources. Each is a factory so the
 * displayOptions can be scoped to the resource/operations that use it.
 */
/** Return All + Limit, the pair every list operation carries. */
export declare function listPagination(resource: string, operations: string[]): INodeProperties[];
/**
 * The sending number. Optional: an account with one linked number never needs
 * it, and the server picks the account default when it is blank.
 */
export declare function numberSelector(resource: string, operations: string[]): INodeProperties;
/** A required ID field for a path segment. */
export declare function idField(resource: string, operations: string[], name: string, displayName: string, description: string): INodeProperties;
