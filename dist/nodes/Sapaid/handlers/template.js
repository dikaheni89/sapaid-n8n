"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTemplateRequest = buildTemplateRequest;
const n8n_workflow_1 = require("n8n-workflow");
const jsonParam_1 = require("../../shared/jsonParam");
const params_1 = require("./params");
const MAX_BODY_LENGTH = 4096;
async function buildTemplateRequest(operation, itemIndex) {
    switch (operation) {
        case 'list': {
            const { qs, returnAll } = (0, params_1.readListOptions)(this, itemIndex);
            return { method: 'GET', endpoint: '/v1/templates', body: {}, qs, returnAll };
        }
        case 'get': {
            const id = (0, params_1.requirePathId)(this, 'templateId', 'Template ID', itemIndex);
            return { method: 'GET', endpoint: `/v1/templates/${id}`, body: {} };
        }
        case 'create':
            return {
                method: 'POST',
                endpoint: '/v1/templates',
                body: {
                    name: (0, params_1.requireText)(this, 'name', 'Name', itemIndex),
                    body: (0, params_1.requireText)(this, 'body', 'Body', itemIndex, MAX_BODY_LENGTH),
                },
            };
        case 'update': {
            const id = (0, params_1.requirePathId)(this, 'templateId', 'Template ID', itemIndex);
            const fields = this.getNodeParameter('updateFields', itemIndex, {});
            const body = {};
            for (const [key, label] of [
                ['name', 'Name'],
                ['body', 'Body'],
            ]) {
                if (fields[key] !== undefined) {
                    const value = (0, params_1.asText)(fields[key], label);
                    if (!value) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `${label} cannot be blank. Remove it from the fields to leave it unchanged.`, { itemIndex });
                    }
                    body[key] = value;
                }
            }
            if (Object.keys(body).length === 0) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Add at least one field to update', {
                    itemIndex,
                });
            }
            return { method: 'PATCH', endpoint: `/v1/templates/${id}`, body };
        }
        case 'delete': {
            const id = (0, params_1.requirePathId)(this, 'templateId', 'Template ID', itemIndex);
            return { method: 'DELETE', endpoint: `/v1/templates/${id}`, body: {} };
        }
        case 'render': {
            const id = (0, params_1.requirePathId)(this, 'templateId', 'Template ID', itemIndex);
            let variables;
            try {
                variables = (0, jsonParam_1.parseJsonParam)(this.getNodeParameter('variables', itemIndex, ''));
            }
            catch {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Variables must be valid JSON', { itemIndex });
            }
            if (variables !== undefined && (typeof variables !== 'object' || Array.isArray(variables))) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Variables must be a JSON object', {
                    itemIndex,
                });
            }
            return {
                method: 'POST',
                endpoint: `/v1/templates/${id}/render`,
                body: { variables: variables ?? {} },
            };
        }
        default:
            return null;
    }
}
