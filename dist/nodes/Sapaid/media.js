"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMedia = resolveMedia;
const n8n_workflow_1 = require("n8n-workflow");
const params_1 = require("./handlers/params");
/**
 * Resolves the shared media-source fields of the Send Image/Video/Audio/Document/
 * Sticker operations into the `media` object the API takes. Binary data from a
 * previous node is sent as base64 with the MIME type n8n knows; a URL is passed
 * through for the server to fetch.
 */
async function resolveMedia(itemIndex, fallbackMime) {
    const source = this.getNodeParameter('mediaSource', itemIndex);
    const fileName = (0, params_1.asText)(this.getNodeParameter('fileName', itemIndex, ''), 'File Name');
    if (source === 'binary') {
        const propertyName = this.getNodeParameter('binaryPropertyName', itemIndex, 'data');
        const binary = this.helpers.assertBinaryData(itemIndex, propertyName);
        const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, propertyName);
        return {
            base64: buffer.toString('base64'),
            mime_type: binary.mimeType || fallbackMime,
            filename: fileName || binary.fileName || undefined,
        };
    }
    if (source === 'url') {
        const url = (0, params_1.asText)(this.getNodeParameter('mediaUrl', itemIndex), 'Media URL');
        if (!/^https?:\/\//i.test(url)) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Media URL must start with http:// or https://', {
                itemIndex,
            });
        }
        return { url, filename: fileName || undefined };
    }
    const base64 = (0, params_1.asText)(this.getNodeParameter('mediaBase64', itemIndex), 'Base64 Data');
    if (!base64) {
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Base64 Data cannot be empty', { itemIndex });
    }
    const mimeType = (0, params_1.asText)(this.getNodeParameter('mediaMimeType', itemIndex, ''), 'MIME Type');
    return {
        base64,
        mime_type: mimeType || fallbackMime,
        filename: fileName || undefined,
    };
}
