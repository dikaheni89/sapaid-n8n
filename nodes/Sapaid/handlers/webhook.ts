import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { WEBHOOK_EVENT_VALUES } from '../../shared/webhookEvents';
import { webhookSecretProblem } from '../../shared/webhookSecret';
import { asText, readListOptions, requirePathId, requireText, toStringList } from './params';
import type { RequestSpec } from './types';

function checkUrl(ctx: IExecuteFunctions, url: string, itemIndex: number): string {
  if (!/^https?:\/\//i.test(url)) {
    throw new NodeOperationError(ctx.getNode(), 'URL must start with http:// or https://', {
      itemIndex,
    });
  }
  return url;
}

function checkEvents(ctx: IExecuteFunctions, raw: unknown, itemIndex: number): string[] {
  const events = toStringList(raw);
  if (events.length === 0) {
    throw new NodeOperationError(ctx.getNode(), 'At least one event must be selected', {
      itemIndex,
    });
  }
  const unknown = events.filter((e) => !WEBHOOK_EVENT_VALUES.includes(e));
  if (unknown.length > 0) {
    throw new NodeOperationError(ctx.getNode(), `Unknown event: ${unknown.join(', ')}`, {
      itemIndex,
    });
  }
  return events;
}

function checkSecret(ctx: IExecuteFunctions, secret: string, itemIndex: number): string {
  const problem = webhookSecretProblem(secret);
  if (problem) {
    throw new NodeOperationError(ctx.getNode(), problem, { itemIndex });
  }
  return secret;
}

export async function buildWebhookRequest(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<RequestSpec | null> {
  switch (operation) {
    case 'list': {
      const { qs, returnAll } = readListOptions(this, itemIndex);
      return { method: 'GET', endpoint: '/v1/webhooks', body: {}, qs, returnAll };
    }
    case 'get': {
      const id = requirePathId(this, 'webhookId', 'Webhook ID', itemIndex);
      return { method: 'GET', endpoint: `/v1/webhooks/${id}`, body: {} };
    }
    case 'test': {
      const id = requirePathId(this, 'webhookId', 'Webhook ID', itemIndex);
      return { method: 'POST', endpoint: `/v1/webhooks/${id}/test`, body: {} };
    }
    case 'delete': {
      const id = requirePathId(this, 'webhookId', 'Webhook ID', itemIndex);
      return { method: 'DELETE', endpoint: `/v1/webhooks/${id}`, body: {} };
    }
    case 'create': {
      const body: Record<string, unknown> = {
        url: checkUrl(this, requireText(this, 'url', 'URL', itemIndex), itemIndex),
        events: checkEvents(this, this.getNodeParameter('events', itemIndex, []), itemIndex),
      };
      const fields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
      const secret = asText(fields.secret, 'Secret');
      if (secret) {
        body.secret = checkSecret(this, secret, itemIndex);
      }
      const numberId = asText(fields.numberId, 'Number ID');
      if (numberId) {
        body.number_id = numberId;
      }
      return { method: 'POST', endpoint: '/v1/webhooks', body };
    }
    case 'update': {
      const id = requirePathId(this, 'webhookId', 'Webhook ID', itemIndex);
      const fields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;
      const body: Record<string, unknown> = {};
      if (fields.url !== undefined) {
        body.url = checkUrl(this, asText(fields.url, 'URL'), itemIndex);
      }
      if (fields.events !== undefined) {
        body.events = checkEvents(this, fields.events, itemIndex);
      }
      if (fields.secret !== undefined) {
        // An empty secret on update means "stop signing": sent as null so the
        // server can tell it apart from "leave it alone".
        const secret = asText(fields.secret, 'Secret');
        body.secret = secret ? checkSecret(this, secret, itemIndex) : null;
      }
      if (fields.numberId !== undefined) {
        body.number_id = asText(fields.numberId, 'Number ID') || null;
      }
      if (fields.active !== undefined) {
        body.active = Boolean(fields.active);
      }
      if (Object.keys(body).length === 0) {
        throw new NodeOperationError(this.getNode(), 'Add at least one field to update', {
          itemIndex,
        });
      }
      return { method: 'PATCH', endpoint: `/v1/webhooks/${id}`, body };
    }
    default:
      return null;
  }
}
