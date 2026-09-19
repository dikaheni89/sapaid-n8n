"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWebhookRequest = buildWebhookRequest;
const n8n_workflow_1 = require("n8n-workflow");
const webhookEvents_1 = require("../../shared/webhookEvents");
const webhookSecret_1 = require("../../shared/webhookSecret");
const params_1 = require("./params");
function checkUrl(ctx, url, itemIndex) {
    if (!/^https?:\/\//i.test(url)) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), 'URL must start with http:// or https://', {
            itemIndex,
        });
    }
    return url;
}
function checkEvents(ctx, raw, itemIndex) {
    const events = (0, params_1.toStringList)(raw);
    if (events.length === 0) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), 'At least one event must be selected', {
            itemIndex,
        });
    }
    const unknown = events.filter((e) => !webhookEvents_1.WEBHOOK_EVENT_VALUES.includes(e));
    if (unknown.length > 0) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), `Unknown event: ${unknown.join(', ')}`, {
            itemIndex,
        });
    }
    return events;
}
function checkSecret(ctx, secret, itemIndex) {
    const problem = (0, webhookSecret_1.webhookSecretProblem)(secret);
    if (problem) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), problem, { itemIndex });
    }
    return secret;
}
async function buildWebhookRequest(operation, itemIndex) {
    switch (operation) {
        case 'list': {
            const { qs, returnAll } = (0, params_1.readListOptions)(this, itemIndex);
            return { method: 'GET', endpoint: '/v1/webhooks', body: {}, qs, returnAll };
        }
        case 'get': {
            const id = (0, params_1.requirePathId)(this, 'webhookId', 'Webhook ID', itemIndex);
            return { method: 'GET', endpoint: `/v1/webhooks/${id}`, body: {} };
        }
        case 'test': {
            const id = (0, params_1.requirePathId)(this, 'webhookId', 'Webhook ID', itemIndex);
            return { method: 'POST', endpoint: `/v1/webhooks/${id}/test`, body: {} };
        }
        case 'delete': {
            const id = (0, params_1.requirePathId)(this, 'webhookId', 'Webhook ID', itemIndex);
            return { method: 'DELETE', endpoint: `/v1/webhooks/${id}`, body: {} };
        }
        case 'create': {
            const body = {
                url: checkUrl(this, (0, params_1.requireText)(this, 'url', 'URL', itemIndex), itemIndex),
                events: checkEvents(this, this.getNodeParameter('events', itemIndex, []), itemIndex),
            };
            const fields = this.getNodeParameter('additionalFields', itemIndex, {});
            const secret = (0, params_1.asText)(fields.secret, 'Secret');
            if (secret) {
                body.secret = checkSecret(this, secret, itemIndex);
            }
            const numberId = (0, params_1.asText)(fields.numberId, 'Number ID');
            if (numberId) {
                body.number_id = numberId;
            }
            return { method: 'POST', endpoint: '/v1/webhooks', body };
        }
        case 'update': {
            const id = (0, params_1.requirePathId)(this, 'webhookId', 'Webhook ID', itemIndex);
            const fields = this.getNodeParameter('updateFields', itemIndex, {});
            const body = {};
            if (fields.url !== undefined) {
                body.url = checkUrl(this, (0, params_1.asText)(fields.url, 'URL'), itemIndex);
            }
            if (fields.events !== undefined) {
                body.events = checkEvents(this, fields.events, itemIndex);
            }
            if (fields.secret !== undefined) {
                // An empty secret on update means "stop signing": sent as null so the
                // server can tell it apart from "leave it alone".
                const secret = (0, params_1.asText)(fields.secret, 'Secret');
                body.secret = secret ? checkSecret(this, secret, itemIndex) : null;
            }
            if (fields.numberId !== undefined) {
                body.number_id = (0, params_1.asText)(fields.numberId, 'Number ID') || null;
            }
            if (fields.active !== undefined) {
                body.active = Boolean(fields.active);
            }
            if (Object.keys(body).length === 0) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Add at least one field to update', {
                    itemIndex,
                });
            }
            return { method: 'PATCH', endpoint: `/v1/webhooks/${id}`, body };
        }
        default:
            return null;
    }
}
