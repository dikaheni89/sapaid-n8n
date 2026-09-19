import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { parseJsonParam } from '../../shared/jsonParam';
import { normalizeRecipient } from '../../shared/phone';
import { asText, readListOptions, requirePathId, requireText, toStringList } from './params';
import type { RequestSpec } from './types';

/** Reads the optional contact fields shared by Create and Update into the body. */
function applyContactFields(
  ctx: IExecuteFunctions,
  body: Record<string, unknown>,
  fields: IDataObject,
  itemIndex: number,
): void {
  if (fields.name !== undefined) {
    const name = asText(fields.name, 'Name');
    if (!name) {
      throw new NodeOperationError(
        ctx.getNode(),
        'Name cannot be blank. Remove it from the fields to leave it unchanged.',
        { itemIndex },
      );
    }
    body.name = name;
  }
  if (fields.email !== undefined) {
    body.email = asText(fields.email, 'Email') || null;
  }
  if (fields.notes !== undefined) {
    body.notes = asText(fields.notes, 'Notes') || null;
  }
  if (fields.labelIds !== undefined) {
    body.label_ids = toStringList(fields.labelIds);
  }
  if (fields.metadata !== undefined) {
    let metadata: unknown;
    try {
      metadata = parseJsonParam(fields.metadata);
    } catch {
      throw new NodeOperationError(ctx.getNode(), 'Metadata must be valid JSON', { itemIndex });
    }
    if (metadata !== undefined) {
      if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
        throw new NodeOperationError(ctx.getNode(), 'Metadata must be a JSON object', {
          itemIndex,
        });
      }
      body.metadata = metadata;
    }
  }
}

function requirePhone(ctx: IExecuteFunctions, itemIndex: number): string {
  const raw = requireText(ctx, 'phone', 'Phone', itemIndex);
  const phone = normalizeRecipient(raw);
  if (!phone || phone.includes('@')) {
    throw new NodeOperationError(
      ctx.getNode(),
      'Phone is not a valid phone number. Use the international form, e.g. 628123456789.',
      { itemIndex },
    );
  }
  return phone;
}

export async function buildContactRequest(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<RequestSpec | null> {
  switch (operation) {
    case 'list': {
      const { qs, returnAll } = readListOptions(this, itemIndex);
      return { method: 'GET', endpoint: '/v1/contacts', body: {}, qs, returnAll };
    }
    case 'get': {
      const id = requirePathId(this, 'contactId', 'Contact ID', itemIndex);
      return { method: 'GET', endpoint: `/v1/contacts/${id}`, body: {} };
    }
    case 'check':
      return {
        method: 'POST',
        endpoint: '/v1/contacts/check',
        body: { phone: requirePhone(this, itemIndex) },
      };
    case 'create': {
      const body: Record<string, unknown> = {
        phone: requirePhone(this, itemIndex),
        name: requireText(this, 'name', 'Name', itemIndex),
      };
      applyContactFields(
        this,
        body,
        this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject,
        itemIndex,
      );
      return { method: 'POST', endpoint: '/v1/contacts', body };
    }
    case 'update': {
      const id = requirePathId(this, 'contactId', 'Contact ID', itemIndex);
      const body: Record<string, unknown> = {};
      applyContactFields(
        this,
        body,
        this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject,
        itemIndex,
      );
      if (Object.keys(body).length === 0) {
        throw new NodeOperationError(this.getNode(), 'Add at least one field to update', {
          itemIndex,
        });
      }
      return { method: 'PATCH', endpoint: `/v1/contacts/${id}`, body };
    }
    case 'delete': {
      const id = requirePathId(this, 'contactId', 'Contact ID', itemIndex);
      return { method: 'DELETE', endpoint: `/v1/contacts/${id}`, body: {} };
    }
    default:
      return null;
  }
}
