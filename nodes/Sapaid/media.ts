import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { asText } from './handlers/params';

/**
 * Resolves the shared media-source fields of the Send Image/Video/Audio/Document/
 * Sticker operations into the `media` object the API takes. Binary data from a
 * previous node is sent as base64 with the MIME type n8n knows; a URL is passed
 * through for the server to fetch.
 */
export async function resolveMedia(
  this: IExecuteFunctions,
  itemIndex: number,
  fallbackMime: string,
): Promise<Record<string, unknown>> {
  const source = this.getNodeParameter('mediaSource', itemIndex) as string;
  const fileName = asText(this.getNodeParameter('fileName', itemIndex, ''), 'File Name');

  if (source === 'binary') {
    const propertyName = this.getNodeParameter('binaryPropertyName', itemIndex, 'data') as string;
    const binary = this.helpers.assertBinaryData(itemIndex, propertyName);
    const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, propertyName);
    return {
      base64: buffer.toString('base64'),
      mime_type: binary.mimeType || fallbackMime,
      filename: fileName || binary.fileName || undefined,
    };
  }

  if (source === 'url') {
    const url = asText(this.getNodeParameter('mediaUrl', itemIndex), 'Media URL');
    if (!/^https?:\/\//i.test(url)) {
      throw new NodeOperationError(
        this.getNode(),
        'Media URL must start with http:// or https://',
        {
          itemIndex,
        },
      );
    }
    return { url, filename: fileName || undefined };
  }

  const base64 = asText(this.getNodeParameter('mediaBase64', itemIndex), 'Base64 Data');
  if (!base64) {
    throw new NodeOperationError(this.getNode(), 'Base64 Data cannot be empty', { itemIndex });
  }
  const mimeType = asText(this.getNodeParameter('mediaMimeType', itemIndex, ''), 'MIME Type');
  return {
    base64,
    mime_type: mimeType || fallbackMime,
    filename: fileName || undefined,
  };
}
