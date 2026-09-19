"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SapaidApi = void 0;
class SapaidApi {
    constructor() {
        this.name = 'sapaidApi';
        this.displayName = 'Sapaid API';
        this.documentationUrl = 'https://sapaid.id/docs';
        this.icon = { light: 'file:sapaid.svg', dark: 'file:sapaid.dark.svg' };
        this.properties = [
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
                description: 'Leave the default unless sapaid support gave you another address (staging or a dedicated deployment). No trailing slash, no /v1.',
                required: true,
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '=Bearer {{$credentials.apiKey}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "")}}',
                // Authenticated and side-effect free, so a wrong key fails the test instead
                // of passing against a public route.
                url: '/v1/me',
                method: 'GET',
            },
        };
    }
}
exports.SapaidApi = SapaidApi;
