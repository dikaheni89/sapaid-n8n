import type { INodeProperties } from 'n8n-workflow';

/**
 * Property fragments shared by several resources. Each is a factory so the
 * displayOptions can be scoped to the resource/operations that use it.
 */

/** Return All + Limit, the pair every list operation carries. */
export function listPagination(resource: string, operations: string[]): INodeProperties[] {
  return [
    {
      displayName: 'Return All',
      name: 'returnAll',
      type: 'boolean',
      default: false,
      description: 'Whether to return all results or only up to a given limit',
      displayOptions: { show: { resource: [resource], operation: operations } },
    },
    {
      displayName: 'Limit',
      name: 'limit',
      type: 'number',
      typeOptions: { minValue: 1, maxValue: 200 },
      default: 50,
      description: 'Max number of results to return',
      displayOptions: { show: { resource: [resource], operation: operations, returnAll: [false] } },
    },
  ];
}

/**
 * The sending number. Optional: an account with one linked number never needs
 * it, and the server picks the account default when it is blank.
 */
export function numberSelector(resource: string, operations: string[]): INodeProperties {
  return {
    displayName: 'Number Name or ID',
    name: 'numberId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getNumbers' },
    default: '',
    description:
      'The linked WhatsApp number to use. Leave empty to use the account default. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: { show: { resource: [resource], operation: operations } },
  };
}

/** A required ID field for a path segment. */
export function idField(
  resource: string,
  operations: string[],
  name: string,
  displayName: string,
  description: string,
): INodeProperties {
  return {
    displayName,
    name,
    type: 'string',
    default: '',
    required: true,
    description,
    displayOptions: { show: { resource: [resource], operation: operations } },
  };
}
