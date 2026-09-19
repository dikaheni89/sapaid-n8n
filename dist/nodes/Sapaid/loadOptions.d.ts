import type { IDataObject, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
interface ListEntry {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    status?: string;
    [key: string]: unknown;
}
export declare function fetchList(ctx: ILoadOptionsFunctions, endpoint: string, qs?: IDataObject): Promise<ListEntry[]>;
export declare function getNumbers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
export declare function getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
export declare function getLabels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
export declare function getAgents(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
export {};
