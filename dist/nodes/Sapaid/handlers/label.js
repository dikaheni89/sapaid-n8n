"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLabelRequest = buildLabelRequest;
const n8n_workflow_1 = require("n8n-workflow");
const params_1 = require("./params");
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
function checkColor(ctx, value, itemIndex) {
    if (!HEX_COLOR.test(value)) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), 'Color must be a hex colour like #E8A33D', {
            itemIndex,
        });
    }
    return value.toUpperCase();
}
async function buildLabelRequest(operation, itemIndex) {
    switch (operation) {
        case 'list': {
            const { qs, returnAll } = (0, params_1.readListOptions)(this, itemIndex);
            return { method: 'GET', endpoint: '/v1/labels', body: {}, qs, returnAll };
        }
        case 'get': {
            const id = (0, params_1.requirePathId)(this, 'labelId', 'Label ID', itemIndex);
            return { method: 'GET', endpoint: `/v1/labels/${id}`, body: {} };
        }
        case 'create': {
            const body = { name: (0, params_1.requireText)(this, 'name', 'Name', itemIndex) };
            const color = (0, params_1.asText)(this.getNodeParameter('color', itemIndex, ''), 'Color');
            if (color) {
                body.color = checkColor(this, color, itemIndex);
            }
            return { method: 'POST', endpoint: '/v1/labels', body };
        }
        case 'update': {
            const id = (0, params_1.requirePathId)(this, 'labelId', 'Label ID', itemIndex);
            const fields = this.getNodeParameter('updateFields', itemIndex, {});
            const body = {};
            if (fields.name !== undefined) {
                const name = (0, params_1.asText)(fields.name, 'Name');
                if (!name) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Name cannot be blank. Remove it from the fields to leave it unchanged.', { itemIndex });
                }
                body.name = name;
            }
            if (fields.color !== undefined) {
                const color = (0, params_1.asText)(fields.color, 'Color');
                if (color) {
                    body.color = checkColor(this, color, itemIndex);
                }
            }
            if (Object.keys(body).length === 0) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Add at least one field to update', {
                    itemIndex,
                });
            }
            return { method: 'PATCH', endpoint: `/v1/labels/${id}`, body };
        }
        case 'delete': {
            const id = (0, params_1.requirePathId)(this, 'labelId', 'Label ID', itemIndex);
            return { method: 'DELETE', endpoint: `/v1/labels/${id}`, body: {} };
        }
        default:
            return null;
    }
}
