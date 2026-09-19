"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatFields = exports.chatOperations = void 0;
const common_1 = require("./common");
exports.chatOperations = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['chat'] } },
    options: [
        {
            name: 'Assign',
            value: 'assign',
            action: 'Assign a chat to an agent',
            description: 'Hand a chat to a team member in the inbox',
        },
        {
            name: 'Close',
            value: 'close',
            action: 'Close a chat',
            description: 'Mark a chat as resolved',
        },
        { name: 'Get', value: 'get', action: 'Get a chat', description: 'Get one chat by ID' },
        { name: 'List', value: 'list', action: 'List chats', description: 'List chats in the inbox' },
        {
            name: 'List Messages',
            value: 'listMessages',
            action: 'List the messages of a chat',
            description: 'Get the message history of one chat, newest first',
        },
        {
            name: 'Mark as Read',
            value: 'markRead',
            action: 'Mark a chat as read',
            description: 'Send read receipts for every unread message in the chat',
        },
        {
            name: 'Reopen',
            value: 'reopen',
            action: 'Reopen a chat',
            description: 'Put a closed chat back in the open queue',
        },
        {
            name: 'Set Labels',
            value: 'setLabels',
            action: 'Set the labels of a chat',
            description: 'Replace the labels on a chat',
        },
    ],
    default: 'list',
};
exports.chatFields = [
    (0, common_1.idField)('chat', ['assign', 'close', 'get', 'listMessages', 'markRead', 'reopen', 'setLabels'], 'chatId', 'Chat ID', 'The ID of the chat'),
    {
        displayName: 'Agent Name or ID',
        name: 'agentId',
        type: 'options',
        typeOptions: { loadOptionsMethod: 'getAgents' },
        default: '',
        description: 'The team member to assign. Leave empty to unassign. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
        displayOptions: { show: { resource: ['chat'], operation: ['assign'] } },
    },
    {
        displayName: 'Label Names or IDs',
        name: 'labelIds',
        type: 'multiOptions',
        typeOptions: { loadOptionsMethod: 'getLabels' },
        default: [],
        description: 'The labels the chat should carry; any label not listed is removed. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
        displayOptions: { show: { resource: ['chat'], operation: ['setLabels'] } },
    },
    ...(0, common_1.listPagination)('chat', ['list', 'listMessages']),
    {
        displayName: 'Filters',
        name: 'filters',
        type: 'collection',
        placeholder: 'Add filter',
        default: {},
        displayOptions: { show: { resource: ['chat'], operation: ['list'] } },
        options: [
            {
                displayName: 'Agent ID',
                name: 'agent_id',
                type: 'string',
                default: '',
                description: 'Only chats assigned to this team member',
            },
            {
                displayName: 'Label ID',
                name: 'label_id',
                type: 'string',
                default: '',
                description: 'Only chats carrying this label',
            },
            {
                displayName: 'Number ID',
                name: 'number_id',
                type: 'string',
                default: '',
                description: 'Only chats on this linked number',
            },
            {
                displayName: 'Search',
                name: 'q',
                type: 'string',
                default: '',
                description: 'Match against the contact name or phone number',
            },
            {
                displayName: 'Status',
                name: 'status',
                type: 'options',
                options: [
                    { name: 'Closed', value: 'closed' },
                    { name: 'Open', value: 'open' },
                ],
                default: 'open',
                description: 'Only chats in this state',
            },
            {
                displayName: 'Unread Only',
                name: 'unread',
                type: 'boolean',
                default: true,
                description: 'Whether to return only chats with unread messages',
            },
        ],
    },
];
