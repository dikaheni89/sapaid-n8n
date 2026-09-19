// Plain fake `this` for the action node. Captures every outgoing request so a
// test can assert method + URL + body, and answers `response` (or a list of
// responses, one per call) to each.
import { createRequire } from 'node:module';

// n8n-workflow ships a broken ESM build, so the CJS entry is the only one that
// loads here; the nodes are compiled to CJS and resolve it the same way.
export const { NodeApiError, NodeOperationError } = createRequire(import.meta.url)('n8n-workflow');

export const BASE = 'https://api.sapaid.id';

export function makeCtx({
  params = {},
  response = {},
  responses = null,
  throwErr = null,
  items = 1,
  continueOnFail = false,
  binary = null,
} = {}) {
  const calls = [];
  const prepared = [];
  const ctx = {
    calls,
    prepared,
    getInputData: () => Array.from({ length: items }, () => ({ json: {} })),
    getNodeParameter: (name, _i, fallback) => (name in params ? params[name] : fallback),
    getCredentials: async () => ({ baseUrl: BASE, apiKey: 'k' }),
    continueOnFail: () => continueOnFail,
    getNode: () => ({
      id: 'node-1',
      name: 'sapaid',
      type: 'n8n-nodes-sapaid.sapaid',
      typeVersion: 1,
      position: [0, 0],
      parameters: {},
    }),
    helpers: {
      httpRequestWithAuthentication: async (credName, options) => {
        calls.push({ credName, options });
        if (throwErr) throw throwErr;
        if (responses) return responses[calls.length - 1];
        return response;
      },
      assertBinaryData: () => binary ?? { mimeType: 'image/png', fileName: 'shot.png' },
      getBinaryDataBuffer: async () => Buffer.from('IMGDATA'),
      prepareBinaryData: async (buffer, _filePath, mimeType) => {
        prepared.push({ buffer: buffer.toString('utf8'), mimeType });
        return { data: buffer.toString('base64'), mimeType: mimeType ?? 'application/octet-stream' };
      },
    },
  };
  return ctx;
}
