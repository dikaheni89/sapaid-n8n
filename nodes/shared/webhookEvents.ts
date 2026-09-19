/**
 * The webhook events sapaid dispatches, as n8n `multiOptions` entries.
 *
 * Single source of truth for the Trigger node's `events` parameter and the action
 * node's Webhook Create/Update `events` parameters, so the lists cannot drift.
 * Mirrors `docs/API-CONTRACT.md` § Webhook events. Ordered alphabetically by value.
 */
import type { INodeProperties } from 'n8n-workflow';

export const WEBHOOK_EVENT_OPTIONS: INodeProperties['options'] = [
  {
    name: 'Broadcast Completed',
    value: 'broadcast.completed',
    description: 'Triggers when every recipient of a broadcast has been processed',
  },
  {
    name: 'Chat Assigned',
    value: 'chat.assigned',
    description: 'Triggers when a chat is assigned to (or unassigned from) an agent',
  },
  {
    name: 'Chat Closed',
    value: 'chat.closed',
    description: 'Triggers when a chat is closed in the inbox',
  },
  {
    name: 'Chat Opened',
    value: 'chat.opened',
    description: 'Triggers when a new chat starts or a closed chat is reopened',
  },
  {
    name: 'Contact Created',
    value: 'contact.created',
    description:
      'Triggers when a contact is created, whether by hand, by the API or by an incoming chat',
  },
  {
    name: 'Message Delivered',
    value: 'message.delivered',
    description: 'Triggers when a message you sent reaches the recipient',
  },
  {
    name: 'Message Failed',
    value: 'message.failed',
    description: 'Triggers when a message fails to send',
  },
  {
    name: 'Message Read',
    value: 'message.read',
    description: 'Triggers when a message you sent is read',
  },
  {
    name: 'Message Received',
    value: 'message.received',
    description: 'Triggers when a new message arrives on one of your numbers',
  },
  {
    name: 'Message Sent',
    value: 'message.sent',
    description: 'Triggers when a message is sent, from the API, a broadcast or the inbox',
  },
  {
    name: 'Number Connected',
    value: 'number.connected',
    description: 'Triggers when a WhatsApp number finishes linking or reconnects',
  },
  {
    name: 'Number Disconnected',
    value: 'number.disconnected',
    description: 'Triggers when a WhatsApp number loses its connection or is unlinked',
  },
  {
    name: 'Number QR',
    value: 'number.qr',
    description: 'Triggers when a number waiting to be linked gets a new QR code',
  },
];

/** The event values only, for tests and validation. */
export const WEBHOOK_EVENT_VALUES: string[] = WEBHOOK_EVENT_OPTIONS.map(
  (o) => (o as { value: string }).value,
);
