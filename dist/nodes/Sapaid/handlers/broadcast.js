"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBroadcastRequest = buildBroadcastRequest;
const n8n_workflow_1 = require("n8n-workflow");
const jsonParam_1 = require("../../shared/jsonParam");
const phone_1 = require("../../shared/phone");
const params_1 = require("./params");
// One broadcast request is capped so a runaway expression cannot enqueue a whole
// database in one call; larger lists are split by the workflow.
const MAX_RECIPIENTS = 5000;
async function buildBroadcastRequest(operation, itemIndex) {
    switch (operation) {
        case 'list': {
            const { qs, returnAll } = (0, params_1.readListOptions)(this, itemIndex);
            return { method: 'GET', endpoint: '/v1/broadcasts', body: {}, qs, returnAll };
        }
        case 'get': {
            const id = (0, params_1.requirePathId)(this, 'broadcastId', 'Broadcast ID', itemIndex);
            return { method: 'GET', endpoint: `/v1/broadcasts/${id}`, body: {} };
        }
        case 'cancel': {
            const id = (0, params_1.requirePathId)(this, 'broadcastId', 'Broadcast ID', itemIndex);
            return { method: 'POST', endpoint: `/v1/broadcasts/${id}/cancel`, body: {} };
        }
        case 'create': {
            let rawRecipients;
            try {
                rawRecipients = (0, params_1.toStringList)(this.getNodeParameter('recipients', itemIndex));
            }
            catch (error) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), error.message, { itemIndex });
            }
            if (rawRecipients.length === 0) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Recipients cannot be empty', { itemIndex });
            }
            if (rawRecipients.length > MAX_RECIPIENTS) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Recipients cannot exceed ${MAX_RECIPIENTS} per broadcast`, { itemIndex });
            }
            const recipients = [];
            for (const raw of rawRecipients) {
                const normalized = (0, phone_1.normalizeRecipient)(raw);
                if (!normalized) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Recipient "${raw}" is not a valid phone number`, { itemIndex });
                }
                recipients.push(normalized);
            }
            const body = {
                name: (0, params_1.requireText)(this, 'name', 'Name', itemIndex),
                recipients: Array.from(new Set(recipients)),
            };
            const numberId = (0, params_1.optionalText)(this, 'numberId', 'Number ID', itemIndex);
            if (numberId) {
                body.number_id = numberId;
            }
            const contentType = this.getNodeParameter('contentType', itemIndex, 'text');
            if (contentType === 'template') {
                let variables;
                try {
                    variables = (0, jsonParam_1.parseJsonParam)(this.getNodeParameter('variables', itemIndex, ''));
                }
                catch {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Variables must be valid JSON', {
                        itemIndex,
                    });
                }
                body.template = {
                    id: (0, params_1.requireText)(this, 'templateId', 'Template ID', itemIndex),
                    variables: variables ?? {},
                };
            }
            else {
                body.text = (0, params_1.requireText)(this, 'text', 'Text', itemIndex);
            }
            const options = this.getNodeParameter('broadcastOptions', itemIndex, {});
            const scheduleAt = (0, params_1.asText)(options.scheduleAt, 'Schedule At');
            if (scheduleAt) {
                const ms = Date.parse(scheduleAt);
                if (!Number.isFinite(ms)) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Schedule At is not a valid date', {
                        itemIndex,
                    });
                }
                body.schedule_at = new Date(ms).toISOString();
            }
            const delay = Number(options.delaySeconds);
            if (Number.isFinite(delay) && delay > 0) {
                body.delay_seconds = delay;
            }
            return { method: 'POST', endpoint: '/v1/broadcasts', body };
        }
        default:
            return null;
    }
}
