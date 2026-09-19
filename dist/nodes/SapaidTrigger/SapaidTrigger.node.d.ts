import type { IHookFunctions, IWebhookFunctions, INodeType, INodeTypeDescription, IWebhookResponseData } from 'n8n-workflow';
import { getNumbers } from '../Sapaid/loadOptions';
export declare class SapaidTrigger implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getNumbers: typeof getNumbers;
        };
    };
    webhookMethods: {
        default: {
            checkExists(this: IHookFunctions): Promise<boolean>;
            create(this: IHookFunctions): Promise<boolean>;
            delete(this: IHookFunctions): Promise<boolean>;
        };
    };
    webhook(this: IWebhookFunctions): Promise<IWebhookResponseData>;
}
