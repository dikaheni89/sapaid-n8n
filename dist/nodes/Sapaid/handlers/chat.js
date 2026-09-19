"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildChatRequest = buildChatRequest;
const params_1 = require("./params");
async function buildChatRequest(operation, itemIndex) {
    const chatPath = () => `/v1/chats/${(0, params_1.requirePathId)(this, 'chatId', 'Chat ID', itemIndex)}`;
    switch (operation) {
        case 'list': {
            const { qs, returnAll } = (0, params_1.readListOptions)(this, itemIndex);
            return { method: 'GET', endpoint: '/v1/chats', body: {}, qs, returnAll };
        }
        case 'get':
            return { method: 'GET', endpoint: chatPath(), body: {} };
        case 'listMessages': {
            const { qs, returnAll } = (0, params_1.readListOptions)(this, itemIndex);
            return { method: 'GET', endpoint: `${chatPath()}/messages`, body: {}, qs, returnAll };
        }
        case 'markRead':
            return { method: 'POST', endpoint: `${chatPath()}/read`, body: {} };
        case 'close':
            return { method: 'POST', endpoint: `${chatPath()}/close`, body: {} };
        case 'reopen':
            return { method: 'POST', endpoint: `${chatPath()}/reopen`, body: {} };
        case 'assign': {
            // null unassigns; the field being optional is what makes that reachable.
            const agentId = (0, params_1.optionalText)(this, 'agentId', 'Agent ID', itemIndex) ?? null;
            return { method: 'POST', endpoint: `${chatPath()}/assign`, body: { agent_id: agentId } };
        }
        case 'setLabels': {
            const labelIds = (0, params_1.toStringList)(this.getNodeParameter('labelIds', itemIndex, []));
            return { method: 'PUT', endpoint: `${chatPath()}/labels`, body: { label_ids: labelIds } };
        }
        default:
            return null;
    }
}
