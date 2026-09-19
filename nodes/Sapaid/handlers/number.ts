import type { IExecuteFunctions } from 'n8n-workflow';
import { requirePathId } from './params';
import type { RequestSpec } from './types';

export async function buildNumberRequest(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<RequestSpec | null> {
  switch (operation) {
    case 'list':
      return { method: 'GET', endpoint: '/v1/numbers', body: {} };
    case 'get': {
      const id = requirePathId(this, 'numberId', 'Number ID', itemIndex);
      return { method: 'GET', endpoint: `/v1/numbers/${id}`, body: {} };
    }
    case 'getStatus': {
      const id = requirePathId(this, 'numberId', 'Number ID', itemIndex);
      return { method: 'GET', endpoint: `/v1/numbers/${id}/status`, body: {} };
    }
    default:
      return null;
  }
}
