"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.labelFields = exports.labelOperations = void 0;
const common_1 = require("./common");
exports.labelOperations = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['label'] } },
    options: [
        { name: 'Create', value: 'create', action: 'Create a label', description: 'Create a label' },
        {
            name: 'Delete',
            value: 'delete',
            action: 'Delete a label',
            description: 'Remove a label from every chat and contact',
        },
        { name: 'Get', value: 'get', action: 'Get a label', description: 'Get one label by ID' },
        { name: 'List', value: 'list', action: 'List labels', description: 'List labels' },
        {
            name: 'Update',
            value: 'update',
            action: 'Update a label',
            description: 'Rename or recolour a label',
        },
    ],
    default: 'list',
};
const COLOR_DESCRIPTION = 'Hex colour shown in the inbox, e.g. #E8A33D';
exports.labelFields = [
    (0, common_1.idField)('label', ['delete', 'get', 'update'], 'labelId', 'Label ID', 'The ID of the label'),
    {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        required: true,
        description: 'Label text',
        displayOptions: { show: { resource: ['label'], operation: ['create'] } },
    },
    {
        displayName: 'Color',
        name: 'color',
        type: 'color',
        default: '',
        description: COLOR_DESCRIPTION,
        displayOptions: { show: { resource: ['label'], operation: ['create'] } },
    },
    {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add field',
        default: {},
        displayOptions: { show: { resource: ['label'], operation: ['update'] } },
        options: [
            {
                displayName: 'Color',
                name: 'color',
                type: 'color',
                default: '',
                description: COLOR_DESCRIPTION,
            },
            { displayName: 'Name', name: 'name', type: 'string', default: '', description: 'Label text' },
        ],
    },
    ...(0, common_1.listPagination)('label', ['list']),
];
