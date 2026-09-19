import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { parseJsonParam } from '../../shared/jsonParam';
import { normalizeRecipient } from '../../shared/phone';
import {
  asText,
  optionalText,
  readListOptions,
  requirePathId,
  requireText,
  toStringList,
} from './params';
import type { RequestSpec } from './types';

// One broadcast request is capped so a runaway expression cannot enqueue a whole
// database in one call; larger lists are split by the workflow.
const MAX_RECIPIENTS = 5000;

export async function buildBroadcastRequest(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<RequestSpec | null> {
  switch (operation) {
    case 'list': {
      const { qs, returnAll } = readListOptions(this, itemIndex);
      return { method: 'GET', endpoint: '/v1/broadcasts', body: {}, qs, returnAll };
    }
    case 'get': {
      const id = requirePathId(this, 'broadcastId', 'Broadcast ID', itemIndex);
      return { method: 'GET', endpoint: `/v1/broadcasts/${id}`, body: {} };
    }
    case 'cancel': {
      const id = requirePathId(this, 'broadcastId', 'Broadcast ID', itemIndex);
      return { method: 'POST', endpoint: `/v1/broadcasts/${id}/cancel`, body: {} };
    }
    case 'create': {
      let rawRecipients: string[];
      try {
        rawRecipients = toStringList(this.getNodeParameter('recipients', itemIndex));
      } catch (error) {
        throw new NodeOperationError(this.getNode(), (error as Error).message, { itemIndex });
      }
      if (rawRecipients.length === 0) {
        throw new NodeOperationError(this.getNode(), 'Recipients cannot be empty', { itemIndex });
      }
      if (rawRecipients.length > MAX_RECIPIENTS) {
        throw new NodeOperationError(
          this.getNode(),
          `Recipients cannot exceed ${MAX_RECIPIENTS} per broadcast`,
          { itemIndex },
        );
      }
      const recipients: string[] = [];
      for (const raw of rawRecipients) {
        const normalized = normalizeRecipient(raw);
        if (!normalized) {
          throw new NodeOperationError(
            this.getNode(),
            `Recipient "${raw}" is not a valid phone number`,
            { itemIndex },
          );
        }
        recipients.push(normalized);
      }

      const body: Record<string, unknown> = {
        name: requireText(this, 'name', 'Name', itemIndex),
        recipients: Array.from(new Set(recipients)),
      };
      const numberId = optionalText(this, 'numberId', 'Number ID', itemIndex);
      if (numberId) {
        body.number_id = numberId;
      }

      const contentType = this.getNodeParameter('contentType', itemIndex, 'text') as string;
      if (contentType === 'template') {
        let variables: unknown;
        try {
          variables = parseJsonParam(this.getNodeParameter('variables', itemIndex, ''));
        } catch {
          throw new NodeOperationError(this.getNode(), 'Variables must be valid JSON', {
            itemIndex,
          });
        }
        body.template = {
          id: requireText(this, 'templateId', 'Template ID', itemIndex),
          variables: variables ?? {},
        };
      } else {
        body.text = requireText(this, 'text', 'Text', itemIndex);
      }

      const options = this.getNodeParameter('broadcastOptions', itemIndex, {}) as IDataObject;
      const scheduleAt = asText(options.scheduleAt, 'Schedule At');
      if (scheduleAt) {
        const ms = Date.parse(scheduleAt);
        if (!Number.isFinite(ms)) {
          throw new NodeOperationError(this.getNode(), 'Schedule At is not a valid date', {
            itemIndex,
          });
        }
        body.schedule_at = new Date(ms).toISOString();
      }
      const delay = Number(options.delaySeconds);
      if (Number.isFinite(delay) && delay > 0) {
        body.delay_seconds = delay;
      }
      return { method: 'POST', endpoint: '/v1/broadcasts', body };
    }
    default:
      return null;
  }
}
