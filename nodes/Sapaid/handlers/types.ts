import type { IDataObject, IHttpRequestMethods } from 'n8n-workflow';

/**
 * A fully-resolved sapaid API request for one input item. Builders return null
 * for an operation they do not handle; the executor turns that into an
 * "unsupported resource/operation" error.
 */
export interface RequestSpec {
  /** Path under the API base, starting with `/v1/`. */
  endpoint: string;
  method: IHttpRequestMethods;
  body: Record<string, unknown>;
  /** Query string; omitted entirely when empty. */
  qs?: IDataObject;
  /**
   * Set by list operations when the user asked for every page. The executor then
   * follows `next_cursor` until the server answers null and emits one item per row.
   */
  returnAll?: boolean;
  /**
   * Set for the routes that answer with raw bytes (media download). The executor
   * requests an arraybuffer and attaches it as a binary property rather than
   * putting it on `json`.
   */
  responseFormat?: 'binary';
}
