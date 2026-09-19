import type { IExecuteFunctions } from 'n8n-workflow';
/**
 * Resolves the shared media-source fields of the Send Image/Video/Audio/Document/
 * Sticker operations into the `media` object the API takes. Binary data from a
 * previous node is sent as base64 with the MIME type n8n knows; a URL is passed
 * through for the server to fetch.
 */
export declare function resolveMedia(this: IExecuteFunctions, itemIndex: number, fallbackMime: string): Promise<Record<string, unknown>>;
