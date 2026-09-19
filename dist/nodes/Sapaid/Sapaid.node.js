"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sapaid = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const broadcast_1 = require("./descriptions/broadcast");
const chat_1 = require("./descriptions/chat");
const contact_1 = require("./descriptions/contact");
const label_1 = require("./descriptions/label");
const message_1 = require("./descriptions/message");
const number_1 = require("./descriptions/number");
const template_1 = require("./descriptions/template");
const webhook_1 = require("./descriptions/webhook");
const broadcast_2 = require("./handlers/broadcast");
const chat_2 = require("./handlers/chat");
const contact_2 = require("./handlers/contact");
const label_2 = require("./handlers/label");
const message_2 = require("./handlers/message");
const number_2 = require("./handlers/number");
const template_2 = require("./handlers/template");
const webhook_2 = require("./handlers/webhook");
const loadOptions = __importStar(require("./loadOptions"));
/**
 * Maps each resource to the builder that turns an operation into a request. A
 * resource missing here, or a builder returning null, surfaces as an
 * "unsupported resource/operation" error.
 */
const RESOURCE_BUILDERS = {
    broadcast: broadcast_2.buildBroadcastRequest,
    chat: chat_2.buildChatRequest,
    contact: contact_2.buildContactRequest,
    label: label_2.buildLabelRequest,
    message: message_2.buildMessageRequest,
    number: number_2.buildNumberRequest,
    template: template_2.buildTemplateRequest,
    webhook: webhook_2.buildWebhookRequest,
};
// Upper bound on cursor pages followed for Return All, so a server that keeps
// answering a cursor cannot pin an execution forever.
const MAX_PAGES = 1000;
/**
 * The server's own sentence out of an error, when it sent one. sapaid answers
 * `{ error: { code, message } }`; the message is what a user can act on, so it is
 * lifted onto the error's description where n8n shows it.
 */
function describeApiError(error) {
    try {
        const holder = error;
        for (const carrier of [holder?.response, holder?.cause?.response]) {
            const body = (carrier?.body ?? carrier?.data);
            const message = body?.error?.message;
            if (typeof message === 'string' && message.trim()) {
                holder.description = message.trim();
                break;
            }
        }
    }
    catch {
        // Decorating an error must never itself throw.
    }
    return error;
}
class Sapaid {
    constructor() {
        this.description = {
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
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
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
                message_1.messageOperations,
                ...message_1.messageFields,
                chat_1.chatOperations,
                ...chat_1.chatFields,
                contact_1.contactOperations,
                ...contact_1.contactFields,
                number_1.numberOperations,
                ...number_1.numberFields,
                template_1.templateOperations,
                ...template_1.templateFields,
                broadcast_1.broadcastOperations,
                ...broadcast_1.broadcastFields,
                label_1.labelOperations,
                ...label_1.labelFields,
                webhook_1.webhookOperations,
                ...webhook_1.webhookFields,
            ],
        };
        this.methods = {
            loadOptions: {
                getAgents: loadOptions.getAgents,
                getLabels: loadOptions.getLabels,
                getNumbers: loadOptions.getNumbers,
                getTemplates: loadOptions.getTemplates,
            },
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const resource = this.getNodeParameter('resource', 0);
        const operation = this.getNodeParameter('operation', 0);
        const credentials = await this.getCredentials('sapaidApi');
        const baseUrl = String(credentials.baseUrl ?? '').replace(/\/+$/, '');
        const request = async (options, itemIndex) => {
            try {
                return await this.helpers.httpRequestWithAuthentication.call(this, 'sapaidApi', options);
            }
            catch (requestError) {
                // Classified here, the one place a failure is known to have come off the
                // wire; everything else in execute is this node's own validation.
                const apiError = new n8n_workflow_1.NodeApiError(this.getNode(), (describeApiError(requestError) ?? {
                    message: 'The request failed without returning a response',
                }));
                apiError.context.itemIndex = itemIndex;
                throw apiError;
            }
        };
        for (let i = 0; i < items.length; i++) {
            try {
                const builder = RESOURCE_BUILDERS[resource];
                const spec = builder ? await builder.call(this, operation, i) : null;
                if (!spec) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unsupported resource/operation: ${resource}/${operation}`, { itemIndex: i });
                }
                const isBinary = spec.responseFormat === 'binary';
                const options = {
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
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Expected media bytes from the server but received a non-binary body', { itemIndex: i });
                    }
                    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data');
                    const binaryData = await this.helpers.prepareBinaryData(Buffer.isBuffer(media) ? media : Buffer.from(media));
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
                    const page = response;
                    const rows = page && typeof page === 'object' && Array.isArray(page.data) ? page.data : null;
                    if (rows === null) {
                        break;
                    }
                    for (const row of rows) {
                        returnData.push({
                            json: typeof row === 'object' && row !== null && !Array.isArray(row)
                                ? row
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
                if (response &&
                    typeof response === 'object' &&
                    Array.isArray(response.data)) {
                    continue;
                }
                let json;
                if (response === '' || response === undefined || response === null) {
                    // A DELETE answers 204; `{ success: true }` is the useful result there. A
                    // 200 with an empty body is "nothing", and must not be dressed up.
                    json = spec.method === 'DELETE' ? { success: true } : {};
                }
                else if (typeof response !== 'object') {
                    json = { data: response };
                }
                else {
                    json = response;
                }
                returnData.push({ json, pairedItem: { item: i } });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    let message;
                    let description;
                    try {
                        const wrapped = error instanceof n8n_workflow_1.NodeApiError
                            ? error
                            : new n8n_workflow_1.NodeOperationError(this.getNode(), error, { itemIndex: i });
                        message = wrapped.message;
                        const detail = typeof wrapped.description === 'string' ? wrapped.description.trim() : '';
                        description = detail && detail !== wrapped.message ? detail : undefined;
                    }
                    catch {
                        message = String(error?.message ?? error);
                    }
                    returnData.push({
                        json: description === undefined ? { error: message } : { error: message, description },
                        pairedItem: { item: i },
                    });
                    continue;
                }
                throw error instanceof n8n_workflow_1.NodeApiError || error instanceof n8n_workflow_1.NodeOperationError
                    ? error
                    : new n8n_workflow_1.NodeOperationError(this.getNode(), error, { itemIndex: i });
            }
        }
        return [returnData];
    }
}
exports.Sapaid = Sapaid;
