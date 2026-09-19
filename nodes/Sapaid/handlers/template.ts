import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { parseJsonParam } from '../../shared/jsonParam';
import { asText, readListOptions, requirePathId, requireText } from './params';
import type { RequestSpec } from './types';

const MAX_BODY_LENGTH = 4096;

export async function buildTemplateRequest(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<RequestSpec | null> {
  switch (operation) {
    case 'list': {
      const { qs, returnAll } = readListOptions(this, itemIndex);
      return { method: 'GET', endpoint: '/v1/templates', body: {}, qs, returnAll };
    }
    case 'get': {
      const id = requirePathId(this, 'templateId', 'Template ID', itemIndex);
      return { method: 'GET', endpoint: `/v1/templates/${id}`, body: {} };
    }
    case 'create':
      return {
        method: 'POST',
        endpoint: '/v1/templates',
        body: {
          name: requireText(this, 'name', 'Name', itemIndex),
          body: requireText(this, 'body', 'Body', itemIndex, MAX_BODY_LENGTH),
        },
      };
    case 'update': {
      const id = requirePathId(this, 'templateId', 'Template ID', itemIndex);
      const fields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;
      const body: Record<string, unknown> = {};
      for (const [key, label] of [
        ['name', 'Name'],
        ['body', 'Body'],
      ] as const) {
        if (fields[key] !== undefined) {
          const value = asText(fields[key], label);
          if (!value) {
            throw new NodeOperationError(
              this.getNode(),
              `${label} cannot be blank. Remove it from the fields to leave it unchanged.`,
              { itemIndex },
            );
          }
          body[key] = value;
        }
      }
      if (Object.keys(body).length === 0) {
        throw new NodeOperationError(this.getNode(), 'Add at least one field to update', {
          itemIndex,
        });
      }
      return { method: 'PATCH', endpoint: `/v1/templates/${id}`, body };
    }
    case 'delete': {
      const id = requirePathId(this, 'templateId', 'Template ID', itemIndex);
      return { method: 'DELETE', endpoint: `/v1/templates/${id}`, body: {} };
    }
    case 'render': {
      const id = requirePathId(this, 'templateId', 'Template ID', itemIndex);
      let variables: unknown;
      try {
        variables = parseJsonParam(this.getNodeParameter('variables', itemIndex, ''));
      } catch {
        throw new NodeOperationError(this.getNode(), 'Variables must be valid JSON', { itemIndex });
      }
      if (variables !== undefined && (typeof variables !== 'object' || Array.isArray(variables))) {
        throw new NodeOperationError(this.getNode(), 'Variables must be a JSON object', {
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
