"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookFields = exports.webhookOperations = void 0;
const webhookEvents_1 = require("../../shared/webhookEvents");
const common_1 = require("./common");
exports.webhookOperations = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['webhook'] } },
    options: [
        {
            name: 'Create',
            value: 'create',
            action: 'Create a webhook',
            description: 'Register a URL to receive events. For n8n itself, use the sapaid Trigger node instead.',
        },
        {
            name: 'Delete',
            value: 'delete',
            action: 'Delete a webhook',
            description: 'Remove a webhook',
        },
        { name: 'Get', value: 'get', action: 'Get a webhook', description: 'Get one webhook by ID' },
        {
            name: 'List',
            value: 'list',
            action: 'List webhooks',
            description: 'List registered webhooks',
        },
        {
            name: 'Test',
            value: 'test',
            action: 'Send a test delivery',
            description: 'Ask sapaid to POST a sample event to the webhook URL',
        },
        {
            name: 'Update',
            value: 'update',
            action: 'Update a webhook',
            description: 'Change the URL, events, secret or active flag',
        },
    ],
    default: 'list',
};
const SECRET_DESCRIPTION = 'Shared secret of 16 to 255 characters. When set, every delivery carries an X-Sapaid-Signature header (HMAC-SHA256 of the raw body) the receiver can verify.';
exports.webhookFields = [
    (0, common_1.idField)('webhook', ['delete', 'get', 'test', 'update'], 'webhookId', 'Webhook ID', 'The ID of the webhook'),
    {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
        required: true,
        placeholder: 'https://example.com/hooks/sapaid',
        description: 'HTTPS address sapaid will POST events to',
        displayOptions: { show: { resource: ['webhook'], operation: ['create'] } },
    },
    {
        displayName: 'Events',
        name: 'events',
        type: 'multiOptions',
        options: webhookEvents_1.WEBHOOK_EVENT_OPTIONS,
        default: ['message.received'],
        required: true,
        description: 'The events to deliver',
        displayOptions: { show: { resource: ['webhook'], operation: ['create'] } },
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add field',
        default: {},
        displayOptions: { show: { resource: ['webhook'], operation: ['create'] } },
        options: [
            {
                displayName: 'Number ID',
                name: 'numberId',
                type: 'string',
                default: '',
                description: 'Only deliver events from this linked number. Empty means every number.',
            },
            {
                displayName: 'Secret',
                name: 'secret',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                description: SECRET_DESCRIPTION,
            },
        ],
    },
    {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add field',
        default: {},
        displayOptions: { show: { resource: ['webhook'], operation: ['update'] } },
        options: [
            {
                displayName: 'Active',
                name: 'active',
                type: 'boolean',
                default: true,
                description: 'Whether the webhook receives deliveries',
            },
            {
                displayName: 'Events',
                name: 'events',
                type: 'multiOptions',
                options: webhookEvents_1.WEBHOOK_EVENT_OPTIONS,
                default: [],
                description: 'The events to deliver; replaces the current list',
            },
            {
                displayName: 'Number ID',
                name: 'numberId',
                type: 'string',
                default: '',
                description: 'Only deliver events from this linked number. Empty means every number.',
            },
            {
                displayName: 'Secret',
                name: 'secret',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                description: SECRET_DESCRIPTION,
            },
            {
                displayName: 'URL',
                name: 'url',
                type: 'string',
                default: '',
                description: 'HTTPS address sapaid will POST events to',
            },
        ],
    },
    ...(0, common_1.listPagination)('webhook', ['list']),
];
