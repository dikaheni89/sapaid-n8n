import type { INodeProperties } from 'n8n-workflow';
import { idField, listPagination } from './common';

export const templateOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: { show: { resource: ['template'] } },
  options: [
    {
      name: 'Create',
      value: 'create',
      action: 'Create a template',
      description: 'Save a reusable message with {{placeholders}}',
    },
    {
      name: 'Delete',
      value: 'delete',
      action: 'Delete a template',
      description: 'Remove a template',
    },
    { name: 'Get', value: 'get', action: 'Get a template', description: 'Get one template by ID' },
    { name: 'List', value: 'list', action: 'List templates', description: 'List saved templates' },
    {
      name: 'Render',
      value: 'render',
      action: 'Render a template',
      description: 'Fill in the placeholders and get the final text back without sending it',
    },
    {
      name: 'Update',
      value: 'update',
      action: 'Update a template',
      description: 'Change the name or body of a template',
    },
  ],
  default: 'list',
};

export const templateFields: INodeProperties[] = [
  idField(
    'template',
    ['delete', 'get', 'render', 'update'],
    'templateId',
    'Template ID',
    'The ID of the template',
  ),
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    default: '',
    required: true,
    description: 'Name shown in the panel',
    displayOptions: { show: { resource: ['template'], operation: ['create'] } },
  },
  {
    displayName: 'Body',
    name: 'body',
    type: 'string',
    typeOptions: { rows: 5 },
    default: '',
    required: true,
    description:
      'Message text with placeholders written as {{name}}, e.g. "Halo {{nama}}, pesanan {{order_id}} sudah dikirim."',
    displayOptions: { show: { resource: ['template'], operation: ['create'] } },
  },
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add field',
    default: {},
    displayOptions: { show: { resource: ['template'], operation: ['update'] } },
    options: [
      {
        displayName: 'Body',
        name: 'body',
        type: 'string',
        typeOptions: { rows: 5 },
        default: '',
        description: 'Message text with placeholders written as {{name}}',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'Name shown in the panel',
      },
    ],
  },
  {
    displayName: 'Variables',
    name: 'variables',
    type: 'json',
    default: '{}',
    description: 'Values for the placeholders as a JSON object, e.g. <code>{"nama": "Budi"}</code>',
    displayOptions: { show: { resource: ['template'], operation: ['render'] } },
  },
  ...listPagination('template', ['list']),
];
