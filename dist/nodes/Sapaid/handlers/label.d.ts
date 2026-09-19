import type { IExecuteFunctions } from 'n8n-workflow';
import type { RequestSpec } from './types';
export declare function buildLabelRequest(this: IExecuteFunctions, operation: string, itemIndex: number): Promise<RequestSpec | null>;
