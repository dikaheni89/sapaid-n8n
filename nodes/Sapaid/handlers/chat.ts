import type { IExecuteFunctions } from 'n8n-workflow';
import { optionalText, readListOptions, requirePathId, toStringList } from './params';
import type { RequestSpec } from './types';

export async function buildChatRequest(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<RequestSpec | null> {
  const chatPath = (): string => `/v1/chats/${requirePathId(this, 'chatId', 'Chat ID', itemIndex)}`;

  switch (operation) {
    case 'list': {
      const { qs, returnAll } = readListOptions(this, itemIndex);
      return { method: 'GET', endpoint: '/v1/chats', body: {}, qs, returnAll };
    }
    case 'get':
      return { method: 'GET', endpoint: chatPath(), body: {} };
    case 'listMessages': {
      const { qs, returnAll } = readListOptions(this, itemIndex);
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
      const agentId = optionalText(this, 'agentId', 'Agent ID', itemIndex) ?? null;
      return { method: 'POST', endpoint: `${chatPath()}/assign`, body: { agent_id: agentId } };
    }
    case 'setLabels': {
      const labelIds = toStringList(this.getNodeParameter('labelIds', itemIndex, []));
      return { method: 'PUT', endpoint: `${chatPath()}/labels`, body: { label_ids: labelIds } };
    }
    default:
      return null;
  }
}
