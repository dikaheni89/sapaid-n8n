import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class SapaidApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    icon: {
        readonly light: "file:sapaid.svg";
        readonly dark: "file:sapaid.dark.svg";
    };
    properties: INodeProperties[];
    authenticate: IAuthenticateGeneric;
    test: ICredentialTestRequest;
}
