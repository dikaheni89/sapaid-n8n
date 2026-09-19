"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildNumberRequest = buildNumberRequest;
const params_1 = require("./params");
async function buildNumberRequest(operation, itemIndex) {
    switch (operation) {
        case 'list':
            return { method: 'GET', endpoint: '/v1/numbers', body: {} };
        case 'get': {
            const id = (0, params_1.requirePathId)(this, 'numberId', 'Number ID', itemIndex);
            return { method: 'GET', endpoint: `/v1/numbers/${id}`, body: {} };
        }
        case 'getStatus': {
            const id = (0, params_1.requirePathId)(this, 'numberId', 'Number ID', itemIndex);
            return { method: 'GET', endpoint: `/v1/numbers/${id}/status`, body: {} };
        }
        default:
            return null;
    }
}
