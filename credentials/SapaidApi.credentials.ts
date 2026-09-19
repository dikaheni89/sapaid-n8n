import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class SapaidApi implements ICredentialType {
  name = 'sapaidApi';
  displayName = 'Sapaid API';
  documentationUrl = 'https://sapaid.id/docs';
  icon = { light: 'file:sapaid.svg', dark: 'file:sapaid.dark.svg' } as const;

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'An API key from the Developer page of your sapaid panel',
      required: true,
    },
    {
      displayName: 'API Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://api.sapaid.id',
      placeholder: 'https://api.sapaid.id',
      description:
        'Leave the default unless sapaid support gave you another address (staging or a dedicated deployment). No trailing slash, no /v1.',
      required: true,
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "")}}',
      // Authenticated and side-effect free, so a wrong key fails the test instead
      // of passing against a public route.
      url: '/v1/me',
      method: 'GET',
    },
  };
}
