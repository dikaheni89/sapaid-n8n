import type {
  IDataObject,
  IHookFunctions,
  IWebhookFunctions,
  INodeType,
  INodeTypeDescription,
  IWebhookResponseData,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { verifySapaidSignature } from './verifySignature';
import { httpStatusFromError } from './httpStatus';
import { webhookConfigHash } from './configHash';
import { webhookSecretProblem } from '../shared/webhookSecret';
import { WEBHOOK_EVENT_OPTIONS } from '../shared/webhookEvents';
import { getNumbers } from '../Sapaid/loadOptions';

const SIGNATURE_HEADER = 'x-sapaid-signature';
// How many recent event IDs the de-duplication ring remembers.
const DEDUP_WINDOW = 500;

async function apiBase(ctx: IHookFunctions): Promise<string> {
  const credentials = await ctx.getCredentials('sapaidApi');
  return String(credentials.baseUrl ?? '').replace(/\/+$/, '');
}

export class SapaidTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'sapaid Trigger',
    name: 'sapaidTrigger',
    icon: { light: 'file:sapaid.svg', dark: 'file:sapaid.dark.svg' },
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["events"].join(", ")}}',
    description: 'Starts the workflow when something happens on your sapaid account',
    defaults: {
      name: 'sapaid Trigger',
    },
    inputs: [],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: 'sapaidApi',
        required: true,
      },
    ],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        // n8n already makes the delivery URL unique per node instance (it prefixes
        // this path with the node's webhookId), so a fixed path is enough.
        path: 'sapaid',
      },
    ],
    properties: [
      {
        displayName: 'Events',
        name: 'events',
        type: 'multiOptions',
        options: WEBHOOK_EVENT_OPTIONS,
        default: ['message.received'],
        required: true,
        description: 'The events to listen to',
      },
      {
        displayName: 'Number Name or ID',
        name: 'numberId',
        type: 'options',
        typeOptions: { loadOptionsMethod: 'getNumbers' },
        default: '',
        description:
          'Only receive events from this linked number. Leave empty for every number on the account. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
      {
        displayName: 'Webhook Secret',
        name: 'webhookSecret',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        description:
          'Optional shared secret of 16 to 255 characters. When set, it is registered with sapaid and every delivery is verified against its X-Sapaid-Signature header (HMAC-SHA256 of the raw body); deliveries that fail verification are refused with 401. Changing it, the events or the number re-registers the webhook on the next activation.',
      },
      {
        displayName: 'Deduplicate Deliveries',
        name: 'deduplicateDeliveries',
        type: 'boolean',
        default: false,
        description:
          "Whether to drop a repeated delivery of the same event, keyed on the envelope's ID. sapaid delivers at least once and retries a failed POST under the same ID, which can otherwise run this workflow twice. Best-effort: two deliveries arriving at the same moment can both pass.",
      },
      {
        displayName:
          'Each event arrives as an envelope: an event ID, <code>event</code>, <code>timestamp</code>, <code>number_id</code>, and the payload under <code>data</code>. Read message fields from <code>data</code>, e.g. <code>{{ $json.data.text }}</code>. A message envelope also carries <code>data.from</code>, <code>data.chat_id</code>, <code>data.type</code> and, for media, <code>data.media</code>.',
        name: 'outputShapeNotice',
        type: 'notice',
        default: '',
      },
    ],
  };

  // Shares the action node's loader so both nodes offer the same list.
  methods = {
    loadOptions: { getNumbers },
  };

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        const webhookData = this.getWorkflowStaticData('node');
        if (webhookData.webhookId === undefined) {
          return false;
        }

        const baseUrl = await apiBase(this);
        const webhookUrl = this.getNodeWebhookUrl('default') ?? '';
        const events = this.getNodeParameter('events') as string[];
        const numberId = String(this.getNodeParameter('numberId', '') ?? '').trim();
        const webhookId = encodeURIComponent(String(webhookData.webhookId));

        // Drop the stored registration from the server and forget it locally, so
        // the caller can report absent and let n8n create a fresh one.
        const discardRegistration = async (): Promise<false> => {
          try {
            await this.helpers.httpRequestWithAuthentication.call(this, 'sapaidApi', {
              method: 'DELETE',
              url: `${baseUrl}/v1/webhooks/${webhookId}`,
              json: true,
            });
          } catch (error) {
            // Already gone remotely is fine. Anything else must fail loud and let
            // n8n's activation retry complete the cleanup: silently proceeding
            // would orphan the old registration, which would keep delivering.
            if (httpStatusFromError(error) !== 404) {
              throw new NodeApiError(this.getNode(), error as JsonObject);
            }
          }
          delete webhookData.webhookId;
          delete webhookData.configHash;
          return false;
        };

        // A changed secret, event list, number or delivery URL makes the stored
        // registration stale: remove it and let n8n re-create it.
        const currentHash = webhookConfigHash({
          url: webhookUrl,
          events,
          secret: this.getNodeParameter('webhookSecret', '') as string,
          numberId,
        });
        if ((webhookData.configHash as string | undefined) !== currentHash) {
          return discardRegistration();
        }

        let registration: IDataObject;
        try {
          registration = (await this.helpers.httpRequestWithAuthentication.call(this, 'sapaidApi', {
            method: 'GET',
            url: `${baseUrl}/v1/webhooks/${webhookId}`,
            json: true,
          })) as IDataObject;
        } catch (error) {
          // 404 means it is genuinely gone; report absent so n8n recreates it. Any
          // other error is inconclusive: rethrow so activation fails loudly rather
          // than registering a duplicate.
          if (httpStatusFromError(error) === 404) {
            delete webhookData.webhookId;
            delete webhookData.configHash;
            return false;
          }
          throw new NodeApiError(this.getNode(), error as JsonObject);
        }

        // Existing is not the same as delivering: the URL, events and active flag
        // can be edited out from under this node in the panel, which leaves the
        // trigger reporting healthy while nothing reaches it. Rebuild on drift.
        const sameEvents = (a: unknown, b: string[]): boolean => {
          if (!Array.isArray(a) || a.length !== b.length) {
            return false;
          }
          const left = [...(a as string[])].sort();
          const right = [...b].sort();
          return left.every((value, index) => value === right[index]);
        };
        if (
          registration.active === false ||
          (typeof registration.url === 'string' && registration.url !== webhookUrl) ||
          !sameEvents(registration.events, events)
        ) {
          return discardRegistration();
        }
        return true;
      },

      async create(this: IHookFunctions): Promise<boolean> {
        const webhookUrl = this.getNodeWebhookUrl('default');
        const baseUrl = await apiBase(this);
        const events = this.getNodeParameter('events') as string[];
        const numberId = String(this.getNodeParameter('numberId', '') ?? '').trim();
        const webhookSecret = this.getNodeParameter('webhookSecret', '') as string;

        if (!events || events.length === 0) {
          throw new NodeOperationError(this.getNode(), 'At least one event must be selected');
        }
        const secretProblem = webhookSecretProblem(webhookSecret);
        if (secretProblem) {
          throw new NodeOperationError(this.getNode(), secretProblem);
        }

        const body: Record<string, unknown> = {
          url: webhookUrl,
          events,
          source: 'n8n',
        };
        if (webhookSecret) {
          body.secret = webhookSecret;
        }
        if (numberId) {
          body.number_id = numberId;
        }

        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'sapaidApi', {
          method: 'POST',
          url: `${baseUrl}/v1/webhooks`,
          body,
          json: true,
        });

        const webhookId = (response as Record<string, unknown> | undefined)?.id;
        if (!webhookId) {
          throw new NodeApiError(this.getNode(), {
            message: 'Webhook created but no ID returned in response',
          } as unknown as JsonObject);
        }

        const webhookData = this.getWorkflowStaticData('node');
        webhookData.webhookId = String(webhookId);
        webhookData.configHash = webhookConfigHash({
          url: webhookUrl ?? '',
          events,
          secret: webhookSecret,
          numberId,
        });
        return true;
      },

      async delete(this: IHookFunctions): Promise<boolean> {
        const webhookData = this.getWorkflowStaticData('node');
        if (webhookData.webhookId === undefined) {
          return true;
        }
        const baseUrl = await apiBase(this);
        try {
          await this.helpers.httpRequestWithAuthentication.call(this, 'sapaidApi', {
            method: 'DELETE',
            url: `${baseUrl}/v1/webhooks/${encodeURIComponent(String(webhookData.webhookId))}`,
            json: true,
          });
        } catch (error) {
          if (httpStatusFromError(error) !== 404) {
            throw new NodeApiError(this.getNode(), error as JsonObject);
          }
        }
        delete webhookData.webhookId;
        delete webhookData.configHash;
        return true;
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject();

    const webhookSecret = this.getNodeParameter('webhookSecret', '') as string;
    if (webhookSecret) {
      if (typeof req.readRawBody === 'function' && !req.rawBody) {
        await req.readRawBody();
      }
      // The raw bytes are the only reliable source: sapaid signs exactly what it
      // transmits. Without them the delivery cannot be verified, so refuse loudly
      // instead of re-serialising (which would drop valid deliveries at random).
      if (!req.rawBody) {
        this.logger.warn(
          'sapaid Trigger cannot verify the delivery signature: the raw request body is unavailable on this n8n version. Upgrade n8n, or clear the Webhook Secret to receive unsigned deliveries.',
        );
        this.getResponseObject().status(401).send('Unauthorized');
        // No `workflowData` at all: n8n skips the run only when the field is
        // absent. An empty run would still create an execution per refused
        // delivery, and anyone who learned the URL could mint them.
        return { noWebhookResponse: true };
      }
      const header = req.headers[SIGNATURE_HEADER];
      const signature = typeof header === 'string' ? header : undefined;
      if (!verifySapaidSignature(req.rawBody, webhookSecret, signature)) {
        this.getResponseObject().status(401).send('Unauthorized');
        return { noWebhookResponse: true };
      }
    }

    const body = req.body;
    if (!body || typeof body !== 'object') {
      return {};
    }
    const envelope = body as Record<string, unknown>;

    // Optional de-duplication, keyed on the envelope ID sapaid reuses across
    // retries. A Webhook > Test delivery is exempt: a manual probe must always run.
    if (this.getNodeParameter('deduplicateDeliveries', false) as boolean) {
      if (envelope.event !== 'test' && typeof envelope.id === 'string' && envelope.id) {
        const staticData = this.getWorkflowStaticData('node');
        const seen = (staticData.recentEventIds as string[] | undefined) ?? [];
        if (seen.includes(envelope.id)) {
          this.logger.debug(`sapaid Trigger: dropping duplicate delivery ${envelope.id}`);
          // Dropping means not running; an empty item set would still register an
          // execution for every replay this option exists to absorb.
          return {};
        }
        seen.push(envelope.id);
        if (seen.length > DEDUP_WINDOW) {
          seen.splice(0, seen.length - DEDUP_WINDOW);
        }
        staticData.recentEventIds = seen;
      }
    }

    return {
      workflowData: [this.helpers.returnJsonArray(envelope as IDataObject)],
    };
  }
}
