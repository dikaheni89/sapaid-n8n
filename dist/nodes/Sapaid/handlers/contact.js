"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContactRequest = buildContactRequest;
const n8n_workflow_1 = require("n8n-workflow");
const jsonParam_1 = require("../../shared/jsonParam");
const phone_1 = require("../../shared/phone");
const params_1 = require("./params");
/** Reads the optional contact fields shared by Create and Update into the body. */
function applyContactFields(ctx, body, fields, itemIndex) {
    if (fields.name !== undefined) {
        const name = (0, params_1.asText)(fields.name, 'Name');
        if (!name) {
            throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), 'Name cannot be blank. Remove it from the fields to leave it unchanged.', { itemIndex });
        }
        body.name = name;
    }
    if (fields.email !== undefined) {
        body.email = (0, params_1.asText)(fields.email, 'Email') || null;
    }
    if (fields.notes !== undefined) {
        body.notes = (0, params_1.asText)(fields.notes, 'Notes') || null;
    }
    if (fields.labelIds !== undefined) {
        body.label_ids = (0, params_1.toStringList)(fields.labelIds);
    }
    if (fields.metadata !== undefined) {
        let metadata;
        try {
            metadata = (0, jsonParam_1.parseJsonParam)(fields.metadata);
        }
        catch {
            throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), 'Metadata must be valid JSON', { itemIndex });
        }
        if (metadata !== undefined) {
            if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
                throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), 'Metadata must be a JSON object', {
                    itemIndex,
                });
            }
            body.metadata = metadata;
        }
    }
}
function requirePhone(ctx, itemIndex) {
    const raw = (0, params_1.requireText)(ctx, 'phone', 'Phone', itemIndex);
    const phone = (0, phone_1.normalizeRecipient)(raw);
    if (!phone || phone.includes('@')) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), 'Phone is not a valid phone number. Use the international form, e.g. 628123456789.', { itemIndex });
    }
    return phone;
}
async function buildContactRequest(operation, itemIndex) {
    switch (operation) {
        case 'list': {
            const { qs, returnAll } = (0, params_1.readListOptions)(this, itemIndex);
            return { method: 'GET', endpoint: '/v1/contacts', body: {}, qs, returnAll };
        }
        case 'get': {
            const id = (0, params_1.requirePathId)(this, 'contactId', 'Contact ID', itemIndex);
            return { method: 'GET', endpoint: `/v1/contacts/${id}`, body: {} };
        }
        case 'check':
            return {
                method: 'POST',
                endpoint: '/v1/contacts/check',
                body: { phone: requirePhone(this, itemIndex) },
            };
        case 'create': {
            const body = {
                phone: requirePhone(this, itemIndex),
                name: (0, params_1.requireText)(this, 'name', 'Name', itemIndex),
            };
            applyContactFields(this, body, this.getNodeParameter('additionalFields', itemIndex, {}), itemIndex);
            return { method: 'POST', endpoint: '/v1/contacts', body };
        }
        case 'update': {
            const id = (0, params_1.requirePathId)(this, 'contactId', 'Contact ID', itemIndex);
            const body = {};
            applyContactFields(this, body, this.getNodeParameter('updateFields', itemIndex, {}), itemIndex);
            if (Object.keys(body).length === 0) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Add at least one field to update', {
                    itemIndex,
                });
            }
            return { method: 'PATCH', endpoint: `/v1/contacts/${id}`, body };
        }
        case 'delete': {
            const id = (0, params_1.requirePathId)(this, 'contactId', 'Contact ID', itemIndex);
            return { method: 'DELETE', endpoint: `/v1/contacts/${id}`, body: {} };
        }
        default:
            return null;
    }
}
