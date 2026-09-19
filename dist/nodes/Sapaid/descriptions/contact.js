"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactFields = exports.contactOperations = void 0;
const common_1 = require("./common");
exports.contactOperations = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['contact'] } },
    options: [
        {
            name: 'Check Number',
            value: 'check',
            action: 'Check whether a number is on whats app',
            description: 'Find out whether a phone number has a WhatsApp account before messaging it',
        },
        {
            name: 'Create',
            value: 'create',
            action: 'Create a contact',
            description: 'Add a contact to the address book',
        },
        {
            name: 'Delete',
            value: 'delete',
            action: 'Delete a contact',
            description: 'Remove a contact',
        },
        { name: 'Get', value: 'get', action: 'Get a contact', description: 'Get one contact by ID' },
        { name: 'List', value: 'list', action: 'List contacts', description: 'List contacts' },
        {
            name: 'Update',
            value: 'update',
            action: 'Update a contact',
            description: 'Change the name, notes or labels of a contact',
        },
    ],
    default: 'list',
};
const contactEditableFields = [
    {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        placeholder: 'name@email.com',
        default: '',
        description: 'Email address kept on the contact',
    },
    {
        displayName: 'Label IDs',
        name: 'labelIds',
        type: 'string',
        default: '',
        description: 'Labels for the contact, comma-separated or a JSON array of IDs',
    },
    {
        displayName: 'Metadata',
        name: 'metadata',
        type: 'json',
        default: '{}',
        description: 'Free-form JSON stored with the contact, e.g. an ID from your own system',
    },
    {
        displayName: 'Notes',
        name: 'notes',
        type: 'string',
        typeOptions: { rows: 3 },
        default: '',
        description: 'Internal notes shown to the team in the inbox',
    },
];
exports.contactFields = [
    (0, common_1.idField)('contact', ['delete', 'get', 'update'], 'contactId', 'Contact ID', 'The ID of the contact'),
    {
        displayName: 'Phone',
        name: 'phone',
        type: 'string',
        default: '',
        required: true,
        placeholder: '628123456789',
        description: 'Phone number in international form without + (a leading 0 is read as Indonesia)',
        displayOptions: { show: { resource: ['contact'], operation: ['check', 'create'] } },
    },
    {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        required: true,
        description: 'Display name of the contact',
        displayOptions: { show: { resource: ['contact'], operation: ['create'] } },
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add field',
        default: {},
        displayOptions: { show: { resource: ['contact'], operation: ['create'] } },
        options: contactEditableFields,
    },
    {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add field',
        default: {},
        displayOptions: { show: { resource: ['contact'], operation: ['update'] } },
        options: [
            {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: '',
                description: 'Display name of the contact',
            },
            ...contactEditableFields,
        ],
    },
    ...(0, common_1.listPagination)('contact', ['list']),
    {
        displayName: 'Filters',
        name: 'filters',
        type: 'collection',
        placeholder: 'Add filter',
        default: {},
        displayOptions: { show: { resource: ['contact'], operation: ['list'] } },
        options: [
            {
                displayName: 'Label ID',
                name: 'label_id',
                type: 'string',
                default: '',
                description: 'Only contacts carrying this label',
            },
            {
                displayName: 'Search',
                name: 'q',
                type: 'string',
                default: '',
                description: 'Match against the name or phone number',
            },
        ],
    },
];
