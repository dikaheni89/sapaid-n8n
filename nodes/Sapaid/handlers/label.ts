import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { asText, readListOptions, requirePathId, requireText } from './params';
import type { RequestSpec } from './types';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function checkColor(ctx: IExecuteFunctions, value: string, itemIndex: number): string {
  if (!HEX_COLOR.test(value)) {
    throw new NodeOperationError(ctx.getNode(), 'Color must be a hex colour like #E8A33D', {
      itemIndex,
    });
  }
  return value.toUpperCase();
}

export async function buildLabelRequest(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<RequestSpec | null> {
  switch (operation) {
    case 'list': {
      const { qs, returnAll } = readListOptions(this, itemIndex);
      return { method: 'GET', endpoint: '/v1/labels', body: {}, qs, returnAll };
    }
    case 'get': {
      const id = requirePathId(this, 'labelId', 'Label ID', itemIndex);
      return { method: 'GET', endpoint: `/v1/labels/${id}`, body: {} };
    }
    case 'create': {
      const body: Record<string, unknown> = { name: requireText(this, 'name', 'Name', itemIndex) };
      const color = asText(this.getNodeParameter('color', itemIndex, ''), 'Color');
      if (color) {
        body.color = checkColor(this, color, itemIndex);
      }
      return { method: 'POST', endpoint: '/v1/labels', body };
    }
    case 'update': {
      const id = requirePathId(this, 'labelId', 'Label ID', itemIndex);
      const fields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;
      const body: Record<string, unknown> = {};
      if (fields.name !== undefined) {
        const name = asText(fields.name, 'Name');
        if (!name) {
          throw new NodeOperationError(
            this.getNode(),
            'Name cannot be blank. Remove it from the fields to leave it unchanged.',
            { itemIndex },
          );
        }
        body.name = name;
      }
      if (fields.color !== undefined) {
        const color = asText(fields.color, 'Color');
        if (color) {
          body.color = checkColor(this, color, itemIndex);
        }
      }
      if (Object.keys(body).length === 0) {
        throw new NodeOperationError(this.getNode(), 'Add at least one field to update', {
          itemIndex,
        });
      }
      return { method: 'PATCH', endpoint: `/v1/labels/${id}`, body };
    }
    case 'delete': {
      const id = requirePathId(this, 'labelId', 'Label ID', itemIndex);
      return { method: 'DELETE', endpoint: `/v1/labels/${id}`, body: {} };
    }
    default:
      return null;
  }
}
