import type { INodeProperties } from 'n8n-workflow';
import { idField, listPagination, numberSelector } from './common';

export const MEDIA_SEND_OPERATIONS = [
  'sendAudio',
  'sendDocument',
  'sendImage',
  'sendSticker',
  'sendVideo',
];

const SEND_OPERATIONS = [
  ...MEDIA_SEND_OPERATIONS,
  'sendContact',
  'sendLocation',
  'sendTemplate',
  'sendText',
];

export const messageOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: { show: { resource: ['message'] } },
  options: [
    {
      name: 'Download Media',
      value: 'downloadMedia',
      action: 'Download the media of a message',
      description: 'Fetch the file attached to a message as binary data',
    },
    { name: 'Get', value: 'get', action: 'Get a message', description: 'Get one message by ID' },
    {
      name: 'List',
      value: 'list',
      action: 'List messages',
      description: 'List messages across chats, newest first',
    },
    {
      name: 'Send Audio',
      value: 'sendAudio',
      action: 'Send an audio message',
      description: 'Send an audio file or voice note',
    },
    {
      name: 'Send Contact',
      value: 'sendContact',
      action: 'Send a contact card',
      description: 'Send a contact card (vCard)',
    },
    {
      name: 'Send Document',
      value: 'sendDocument',
      action: 'Send a document',
      description: 'Send a file as a document',
    },
    {
      name: 'Send Image',
      value: 'sendImage',
      action: 'Send an image',
      description: 'Send an image',
    },
    {
      name: 'Send Location',
      value: 'sendLocation',
      action: 'Send a location',
      description: 'Send a map pin',
    },
    {
      name: 'Send Sticker',
      value: 'sendSticker',
      action: 'Send a sticker',
      description: 'Send a WebP sticker',
    },
    {
      name: 'Send Template',
      value: 'sendTemplate',
      action: 'Send a template message',
      description: 'Send a saved template with its variables filled in',
    },
    {
      name: 'Send Text',
      value: 'sendText',
      action: 'Send a text message',
      description: 'Send a plain text message',
    },
    { name: 'Send Video', value: 'sendVideo', action: 'Send a video', description: 'Send a video' },
  ],
  default: 'sendText',
};

export const messageFields: INodeProperties[] = [
  // ---- shared by every send ----
  {
    displayName: 'To',
    name: 'to',
    type: 'string',
    default: '',
    required: true,
    placeholder: '628123456789',
    description:
      'Recipient phone number in international form without + (a leading 0 is read as Indonesia, so 0812… becomes 62812…), or a chat/group ID from a previous node',
    displayOptions: { show: { resource: ['message'], operation: SEND_OPERATIONS } },
  },
  numberSelector('message', SEND_OPERATIONS),

  // ---- sendText ----
  {
    displayName: 'Text',
    name: 'text',
    type: 'string',
    typeOptions: { rows: 4 },
    default: '',
    required: true,
    description:
      'The message text. WhatsApp formatting works: *bold*, _italic_, ~strike~, ```mono```.',
    displayOptions: { show: { resource: ['message'], operation: ['sendText'] } },
  },

  // ---- media sends ----
  {
    displayName: 'Media Source',
    name: 'mediaSource',
    type: 'options',
    options: [
      { name: 'Base64', value: 'base64' },
      { name: 'Binary Data', value: 'binary' },
      { name: 'URL', value: 'url' },
    ],
    default: 'url',
    description: 'Where the file comes from',
    displayOptions: { show: { resource: ['message'], operation: MEDIA_SEND_OPERATIONS } },
  },
  {
    displayName: 'Input Binary Field',
    name: 'binaryPropertyName',
    type: 'string',
    default: 'data',
    required: true,
    description: 'The name of the input field containing the binary data to send',
    displayOptions: {
      show: { resource: ['message'], operation: MEDIA_SEND_OPERATIONS, mediaSource: ['binary'] },
    },
  },
  {
    displayName: 'Media URL',
    name: 'mediaUrl',
    type: 'string',
    default: '',
    required: true,
    placeholder: 'https://example.com/file.pdf',
    description: 'Public URL of the file. sapaid downloads it server-side.',
    displayOptions: {
      show: { resource: ['message'], operation: MEDIA_SEND_OPERATIONS, mediaSource: ['url'] },
    },
  },
  {
    displayName: 'Base64 Data',
    name: 'mediaBase64',
    type: 'string',
    default: '',
    required: true,
    description: 'The file content encoded as base64, without a data: prefix',
    displayOptions: {
      show: { resource: ['message'], operation: MEDIA_SEND_OPERATIONS, mediaSource: ['base64'] },
    },
  },
  {
    displayName: 'MIME Type',
    name: 'mediaMimeType',
    type: 'string',
    default: '',
    placeholder: 'image/jpeg',
    description:
      'MIME type of the base64 data. Leave empty to use the default for this kind of media.',
    displayOptions: {
      show: { resource: ['message'], operation: MEDIA_SEND_OPERATIONS, mediaSource: ['base64'] },
    },
  },
  {
    displayName: 'File Name',
    name: 'fileName',
    type: 'string',
    default: '',
    description: 'File name shown to the recipient. Documents use it as the download name.',
    displayOptions: { show: { resource: ['message'], operation: MEDIA_SEND_OPERATIONS } },
  },
  {
    displayName: 'Caption',
    name: 'caption',
    type: 'string',
    typeOptions: { rows: 2 },
    default: '',
    description: 'Text shown under the media',
    displayOptions: {
      show: { resource: ['message'], operation: ['sendImage', 'sendVideo', 'sendDocument'] },
    },
  },
  {
    displayName: 'Send as Voice Note',
    name: 'voiceNote',
    type: 'boolean',
    default: false,
    description:
      'Whether to deliver the audio as a push-to-talk voice note instead of an audio file. Voice notes should be OGG/Opus.',
    displayOptions: { show: { resource: ['message'], operation: ['sendAudio'] } },
  },

  // ---- sendLocation ----
  {
    displayName: 'Latitude',
    name: 'latitude',
    type: 'number',
    default: 0,
    required: true,
    typeOptions: { numberPrecision: 6 },
    description: 'Latitude in decimal degrees',
    displayOptions: { show: { resource: ['message'], operation: ['sendLocation'] } },
  },
  {
    displayName: 'Longitude',
    name: 'longitude',
    type: 'number',
    default: 0,
    required: true,
    typeOptions: { numberPrecision: 6 },
    description: 'Longitude in decimal degrees',
    displayOptions: { show: { resource: ['message'], operation: ['sendLocation'] } },
  },
  {
    displayName: 'Location Name',
    name: 'locationName',
    type: 'string',
    default: '',
    description: 'Label shown above the map pin',
    displayOptions: { show: { resource: ['message'], operation: ['sendLocation'] } },
  },
  {
    displayName: 'Address',
    name: 'locationAddress',
    type: 'string',
    default: '',
    description: 'Address line shown under the pin',
    displayOptions: { show: { resource: ['message'], operation: ['sendLocation'] } },
  },

  // ---- sendContact ----
  {
    displayName: 'Contact Name',
    name: 'contactName',
    type: 'string',
    default: '',
    required: true,
    description: 'Full name on the contact card',
    displayOptions: { show: { resource: ['message'], operation: ['sendContact'] } },
  },
  {
    displayName: 'Contact Phone',
    name: 'contactPhone',
    type: 'string',
    default: '',
    required: true,
    placeholder: '628123456789',
    description: 'Phone number on the contact card, international form without +',
    displayOptions: { show: { resource: ['message'], operation: ['sendContact'] } },
  },

  // ---- sendTemplate ----
  {
    displayName: 'Template Name or ID',
    name: 'templateId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getTemplates' },
    default: '',
    required: true,
    description:
      'The saved template to send. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: { show: { resource: ['message'], operation: ['sendTemplate'] } },
  },
  {
    displayName: 'Variables',
    name: 'variables',
    type: 'json',
    default: '{}',
    description:
      'Values for the template placeholders as a JSON object, e.g. <code>{"nama": "Budi", "order_id": "A123"}</code>',
    displayOptions: { show: { resource: ['message'], operation: ['sendTemplate'] } },
  },

  // ---- send options ----
  {
    displayName: 'Options',
    name: 'sendOptions',
    type: 'collection',
    placeholder: 'Add option',
    default: {},
    displayOptions: { show: { resource: ['message'], operation: SEND_OPERATIONS } },
    options: [
      {
        displayName: 'Reply To Message ID',
        name: 'replyTo',
        type: 'string',
        default: '',
        description: 'ID of a message to quote in the reply',
      },
      {
        displayName: 'Idempotency Key',
        name: 'idempotencyKey',
        type: 'string',
        default: '',
        description:
          'A unique key for this send. Repeating a request with the same key within 24 hours returns the first result instead of sending twice, which makes a retried workflow safe.',
      },
      {
        displayName: 'Typing Delay (Seconds)',
        name: 'typingSeconds',
        type: 'number',
        typeOptions: { minValue: 0, maxValue: 30 },
        default: 0,
        description:
          'Show a typing indicator for this long before the message goes out. Helps a bot look less like a bot.',
      },
    ],
  },

  // ---- get / downloadMedia ----
  idField('message', ['get', 'downloadMedia'], 'messageId', 'Message ID', 'The ID of the message'),
  {
    displayName: 'Put Output File in Field',
    name: 'binaryPropertyName',
    type: 'string',
    default: 'data',
    description: 'The name of the output binary field to put the file in',
    displayOptions: { show: { resource: ['message'], operation: ['downloadMedia'] } },
  },

  // ---- list ----
  ...listPagination('message', ['list']),
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add filter',
    default: {},
    displayOptions: { show: { resource: ['message'], operation: ['list'] } },
    options: [
      {
        displayName: 'Chat ID',
        name: 'chat_id',
        type: 'string',
        default: '',
        description: 'Only messages in this chat',
      },
      {
        displayName: 'Direction',
        name: 'direction',
        type: 'options',
        options: [
          { name: 'Inbound', value: 'inbound' },
          { name: 'Outbound', value: 'outbound' },
        ],
        default: 'inbound',
        description: 'Only messages received (inbound) or sent (outbound)',
      },
      {
        displayName: 'Number ID',
        name: 'number_id',
        type: 'string',
        default: '',
        description: 'Only messages on this linked number',
      },
      {
        displayName: 'Since',
        name: 'since',
        type: 'dateTime',
        default: '',
        description: 'Only messages at or after this time',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: [
          { name: 'Delivered', value: 'delivered' },
          { name: 'Failed', value: 'failed' },
          { name: 'Pending', value: 'pending' },
          { name: 'Read', value: 'read' },
          { name: 'Sent', value: 'sent' },
        ],
        default: 'sent',
        description: 'Only outbound messages in this delivery state',
      },
      {
        displayName: 'Until',
        name: 'until',
        type: 'dateTime',
        default: '',
        description: 'Only messages before this time',
      },
    ],
  },
];
