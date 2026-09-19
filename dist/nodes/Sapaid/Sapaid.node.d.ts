import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import * as loadOptions from './loadOptions';
export declare class Sapaid implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getAgents: typeof loadOptions.getAgents;
            getLabels: typeof loadOptions.getLabels;
            getNumbers: typeof loadOptions.getNumbers;
            getTemplates: typeof loadOptions.getTemplates;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
