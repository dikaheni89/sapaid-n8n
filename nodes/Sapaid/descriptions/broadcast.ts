import type { INodeProperties } from 'n8n-workflow';
import { idField, listPagination, numberSelector } from './common';

export const broadcastOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: { show: { resource: ['broadcast'] } },
  options: [
    {
      name: 'Cancel',
      value: 'cancel',
      action: 'Cancel a broadcast',
      description: 'Stop a scheduled or running broadcast; recipients not yet reached are skipped',
    },
    {
      name: 'Create',
      value: 'create',
      action: 'Create a broadcast',
      description: 'Send one message to many recipients, now or at a scheduled time',
    },
    {
      name: 'Get',
      value: 'get',
      action: 'Get a broadcast',
      description: 'Get a broadcast with its progress counters',
    },
    { name: 'List', value: 'list', action: 'List broadcasts', description: 'List broadcasts' },
  ],
  default: 'create',
};

export const broadcastFields: INodeProperties[] = [
  idField('broadcast', ['cancel', 'get'], 'broadcastId', 'Broadcast ID', 'The ID of the broadcast'),
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    default: '',
    required: true,
    description: 'Name shown in the panel, e.g. "Promo Lebaran 2026"',
    displayOptions: { show: { resource: ['broadcast'], operation: ['create'] } },
  },
  numberSelector('broadcast', ['create']),
  {
    displayName: 'Recipients',
    name: 'recipients',
    type: 'string',
    typeOptions: { rows: 4 },
    default: '',
    required: true,
    description:
      'Phone numbers to send to, comma- or newline-separated, or a JSON array from an expression. Each is normalised like the To field of a send.',
    displayOptions: { show: { resource: ['broadcast'], operation: ['create'] } },
  },
  {
    displayName: 'Content',
    name: 'contentType',
    type: 'options',
    options: [
      { name: 'Template', value: 'template' },
      { name: 'Text', value: 'text' },
    ],
    default: 'text',
    description: 'Whether to send plain text or a saved template',
    displayOptions: { show: { resource: ['broadcast'], operation: ['create'] } },
  },
  {
    displayName: 'Text',
    name: 'text',
    type: 'string',
    typeOptions: { rows: 4 },
    default: '',
    required: true,
    description: 'The message text sent to every recipient',
    displayOptions: {
      show: { resource: ['broadcast'], operation: ['create'], contentType: ['text'] },
    },
  },
  {
    displayName: 'Template Name or ID',
    name: 'templateId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getTemplates' },
    default: '',
    required: true,
    description:
      'The template to send. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: { resource: ['broadcast'], operation: ['create'], contentType: ['template'] },
    },
  },
  {
    displayName: 'Variables',
    name: 'variables',
    type: 'json',
    default: '{}',
    description:
      'Placeholder values shared by every recipient as a JSON object. Per-recipient values are filled from the contact (e.g. {{nama}}).',
    displayOptions: {
      show: { resource: ['broadcast'], operation: ['create'], contentType: ['template'] },
    },
  },
  {
    displayName: 'Options',
    name: 'broadcastOptions',
    type: 'collection',
    placeholder: 'Add option',
    default: {},
    displayOptions: { show: { resource: ['broadcast'], operation: ['create'] } },
    options: [
      {
        displayName: 'Schedule At',
        name: 'scheduleAt',
        type: 'dateTime',
        default: '',
        description: 'When to start sending. Leave empty to start right away.',
      },
      {
        displayName: 'Delay Between Messages (Seconds)',
        name: 'delaySeconds',
        type: 'number',
        typeOptions: { minValue: 1, maxValue: 300 },
        default: 5,
        description:
          'Pause between recipients. A slower pace keeps a number safer; the server enforces a floor per plan.',
      },
    ],
  },
  ...listPagination('broadcast', ['list']),
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add filter',
    default: {},
    displayOptions: { show: { resource: ['broadcast'], operation: ['list'] } },
    options: [
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: [
          { name: 'Cancelled', value: 'cancelled' },
          { name: 'Completed', value: 'completed' },
          { name: 'Running', value: 'running' },
          { name: 'Scheduled', value: 'scheduled' },
        ],
        default: 'running',
        description: 'Only broadcasts in this state',
      },
    ],
  },
];
