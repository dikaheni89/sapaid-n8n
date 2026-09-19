import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestOptions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { broadcastFields, broadcastOperations } from './descriptions/broadcast';
import { chatFields, chatOperations } from './descriptions/chat';
import { contactFields, contactOperations } from './descriptions/contact';
import { labelFields, labelOperations } from './descriptions/label';
import { messageFields, messageOperations } from './descriptions/message';
import { numberFields, numberOperations } from './descriptions/number';
import { templateFields, templateOperations } from './descriptions/template';
import { webhookFields, webhookOperations } from './descriptions/webhook';
import { buildBroadcastRequest } from './handlers/broadcast';
import { buildChatRequest } from './handlers/chat';
import { buildContactRequest } from './handlers/contact';
import { buildLabelRequest } from './handlers/label';
import { buildMessageRequest } from './handlers/message';
import { buildNumberRequest } from './handlers/number';
import { buildTemplateRequest } from './handlers/template';
import { buildWebhookRequest } from './handlers/webhook';
import type { RequestSpec } from './handlers/types';
import * as loadOptions from './loadOptions';

/**
 * Maps each resource to the builder that turns an operation into a request. A
 * resource missing here, or a builder returning null, surfaces as an
 * "unsupported resource/operation" error.
 */
const RESOURCE_BUILDERS: Record<
  string,
  (this: IExecuteFunctions, operation: string, itemIndex: number) => Promise<RequestSpec | null>
> = {
  broadcast: buildBroadcastRequest,
  chat: buildChatRequest,
  contact: buildContactRequest,
  label: buildLabelRequest,
  message: buildMessageRequest,
  number: buildNumberRequest,
  template: buildTemplateRequest,
  webhook: buildWebhookRequest,
};

// Upper bound on cursor pages followed for Return All, so a server that keeps
// answering a cursor cannot pin an execution forever.
const MAX_PAGES = 1000;

/**
 * The server's own sentence out of an error, when it sent one. sapaid answers
 * `{ error: { code, message } }`; the message is what a user can act on, so it is
 * lifted onto the error's description where n8n shows it.
 */
function describeApiError(error: unknown): unknown {
  try {
    const holder = error as {
      response?: { body?: unknown; data?: unknown };
      cause?: { response?: { body?: unknown; data?: unknown } };
      description?: unknown;
    };
    for (const carrier of [holder?.response, holder?.cause?.response]) {
      const body = (carrier?.body ?? carrier?.data) as
        { error?: { message?: unknown } } | undefined;
      const message = body?.error?.message;
      if (typeof message === 'string' && message.trim()) {
        holder.description = message.trim();
        break;
      }
    }
  } catch {
    // Decorating an error must never itself throw.
  }
  return error;
}

export class Sapaid implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'sapaid',
    name: 'sapaid',
    icon: { light: 'file:sapaid.svg', dark: 'file:sapaid.dark.svg' },
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Send WhatsApp messages and manage your inbox through sapaid',
    defaults: {
      name: 'sapaid',
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    usableAsTool: true,
    credentials: [
      {
        name: 'sapaidApi',
        required: true,
      },
    ],
    requestDefaults: {
      baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "")}}',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Broadcast', value: 'broadcast' },
          { name: 'Chat', value: 'chat' },
          { name: 'Contact', value: 'contact' },
          { name: 'Label', value: 'label' },
          { name: 'Message', value: 'message' },
          { name: 'Number', value: 'number' },
          { name: 'Template', value: 'template' },
          { name: 'Webhook', value: 'webhook' },
        ],
        default: 'message',
      },
      messageOperations,
      ...messageFields,
      chatOperations,
      ...chatFields,
      contactOperations,
      ...contactFields,
      numberOperations,
      ...numberFields,
      templateOperations,
      ...templateFields,
      broadcastOperations,
      ...broadcastFields,
      labelOperations,
      ...labelFields,
      webhookOperations,
      ...webhookFields,
    ],
  };

  methods = {
    loadOptions: {
      getAgents: loadOptions.getAgents,
      getLabels: loadOptions.getLabels,
      getNumbers: loadOptions.getNumbers,
      getTemplates: loadOptions.getTemplates,
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    const credentials = await this.getCredentials('sapaidApi');
    const baseUrl = String(credentials.baseUrl ?? '').replace(/\/+$/, '');

    const request = async (options: IHttpRequestOptions, itemIndex: number): Promise<unknown> => {
      try {
        return await this.helpers.httpRequestWithAuthentication.call(this, 'sapaidApi', options);
      } catch (requestError) {
        // Classified here, the one place a failure is known to have come off the
        // wire; everything else in execute is this node's own validation.
        const apiError = new NodeApiError(
          this.getNode(),
          (describeApiError(requestError) ?? {
            message: 'The request failed without returning a response',
          }) as JsonObject,
        );
        apiError.context.itemIndex = itemIndex;
        throw apiError;
      }
    };

    for (let i = 0; i < items.length; i++) {
      try {
        const builder = RESOURCE_BUILDERS[resource];
        const spec: RequestSpec | null = builder ? await builder.call(this, operation, i) : null;
        if (!spec) {
          throw new NodeOperationError(
            this.getNode(),
            `Unsupported resource/operation: ${resource}/${operation}`,
            { itemIndex: i },
          );
        }

        const isBinary = spec.responseFormat === 'binary';
        const options: IHttpRequestOptions = {
          method: spec.method,
          url: `${baseUrl}${spec.endpoint}`,
          headers: { Accept: isBinary ? '*/*' : 'application/json' },
          json: !isBinary,
        };
        if (isBinary) {
          options.encoding = 'arraybuffer';
        }
        if (spec.method !== 'GET' && Object.keys(spec.body).length > 0) {
          options.body = spec.body;
        }
        if (spec.qs && Object.keys(spec.qs).length > 0) {
          options.qs = { ...spec.qs };
        }

        if (isBinary) {
          const media = await request(options, i);
          if (!Buffer.isBuffer(media) && !(media instanceof ArrayBuffer)) {
            throw new NodeOperationError(
              this.getNode(),
              'Expected media bytes from the server but received a non-binary body',
              { itemIndex: i },
            );
          }
          const binaryPropertyName = this.getNodeParameter(
            'binaryPropertyName',
            i,
            'data',
          ) as string;
          const binaryData = await this.helpers.prepareBinaryData(
            Buffer.isBuffer(media) ? media : Buffer.from(media),
          );
          returnData.push({
            json: {},
            binary: { [binaryPropertyName]: binaryData },
            pairedItem: { item: i },
          });
          continue;
        }

        // A list route answers `{ data: [...], next_cursor }`. n8n's convention is
        // one item per row, so the array is unwrapped; with Return All the cursor is
        // followed until the server answers null.
        let response = await request(options, i);
        let pages = 0;
        for (;;) {
          const page = response as { data?: unknown; next_cursor?: unknown } | null;
          const rows =
            page && typeof page === 'object' && Array.isArray(page.data) ? page.data : null;
          if (rows === null) {
            break;
          }
          for (const row of rows) {
            returnData.push({
              json:
                typeof row === 'object' && row !== null && !Array.isArray(row)
                  ? (row as IDataObject)
                  : { data: row },
              pairedItem: { item: i },
            });
          }
          const cursor = page?.next_cursor;
          if (!spec.returnAll || typeof cursor !== 'string' || !cursor || ++pages >= MAX_PAGES) {
            break;
          }
          response = await request({ ...options, qs: { ...(options.qs ?? {}), cursor } }, i);
        }
        if (
          response &&
          typeof response === 'object' &&
          Array.isArray((response as { data?: unknown }).data)
        ) {
          continue;
        }

        let json: IDataObject;
        if (response === '' || response === undefined || response === null) {
          // A DELETE answers 204; `{ success: true }` is the useful result there. A
          // 200 with an empty body is "nothing", and must not be dressed up.
          json = spec.method === 'DELETE' ? { success: true } : {};
        } else if (typeof response !== 'object') {
          json = { data: response as string | number | boolean };
        } else {
          json = response as IDataObject;
        }
        returnData.push({ json, pairedItem: { item: i } });
      } catch (error) {
        if (this.continueOnFail()) {
          let message: string;
          let description: string | undefined;
          try {
            const wrapped =
              error instanceof NodeApiError
                ? error
                : new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
            message = wrapped.message;
            const detail =
              typeof wrapped.description === 'string' ? wrapped.description.trim() : '';
            description = detail && detail !== wrapped.message ? detail : undefined;
          } catch {
            message = String((error as Error | undefined)?.message ?? error);
          }
          returnData.push({
            json: description === undefined ? { error: message } : { error: message, description },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error instanceof NodeApiError || error instanceof NodeOperationError
          ? error
          : new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
      }
    }

    return [returnData];
  }
}
