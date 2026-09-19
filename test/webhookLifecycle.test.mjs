import test from 'node:test';
import assert from 'node:assert/strict';
import { SapaidTrigger } from '../dist/nodes/SapaidTrigger/SapaidTrigger.node.js';
import { webhookConfigHash } from '../dist/nodes/SapaidTrigger/configHash.js';
import { BASE, NodeApiError, NodeOperationError } from './helpers.mjs';

const URL = 'https://n8n.test/webhook/abc/sapaid';

function makeHookCtx({ params = {}, staticData = {}, responder = null } = {}) {
  const calls = [];
  const ctx = {
    calls,
    staticData,
    getNodeWebhookUrl: () => URL,
    getWorkflowStaticData: () => staticData,
    getNodeParameter: (name, fallback) => (name in params ? params[name] : fallback),
    getCredentials: async () => ({ baseUrl: `${BASE}/`, apiKey: 'k' }),
    getNode: () => ({ id: 'n', name: 'sapaid Trigger', type: 'sapaidTrigger', typeVersion: 1, position: [0, 0], parameters: {} }),
    helpers: {
      httpRequestWithAuthentication: async (_cred, options) => {
        calls.push(options);
        return responder ? responder(options, calls.length) : {};
      },
    },
  };
  return ctx;
}

const hooks = new SapaidTrigger().webhookMethods.default;
const events = ['message.received', 'message.sent'];

test('create registers the webhook and stores id + config hash', async () => {
  const ctx = makeHookCtx({
    params: { events, numberId: 'n1', webhookSecret: 'a-long-enough-secret' },
    responder: () => ({ id: 42 }),
  });
  assert.equal(await hooks.create.call(ctx), true);
  assert.equal(ctx.calls[0].method, 'POST');
  assert.equal(ctx.calls[0].url, `${BASE}/v1/webhooks`);
  assert.deepEqual(ctx.calls[0].body, {
    url: URL,
    events,
    source: 'n8n',
    secret: 'a-long-enough-secret',
    number_id: 'n1',
  });
  assert.equal(ctx.staticData.webhookId, '42');
  assert.equal(
    ctx.staticData.configHash,
    webhookConfigHash({ url: URL, events, secret: 'a-long-enough-secret', numberId: 'n1' }),
  );
});

test('create refuses no events, a short secret, and a response without an id', async () => {
  await assert.rejects(
    hooks.create.call(makeHookCtx({ params: { events: [] } })),
    (e) => e instanceof NodeOperationError && /At least one event/.test(e.message),
  );
  await assert.rejects(
    hooks.create.call(makeHookCtx({ params: { events, webhookSecret: 'short' } })),
    (e) => /at least 16 characters/.test(e.message),
  );
  await assert.rejects(
    hooks.create.call(makeHookCtx({ params: { events }, responder: () => ({}) })),
    (e) => e instanceof NodeApiError && /no ID returned/.test(e.message),
  );
});

test('checkExists is false with nothing stored and makes no request', async () => {
  const ctx = makeHookCtx({ params: { events } });
  assert.equal(await hooks.checkExists.call(ctx), false);
  assert.equal(ctx.calls.length, 0);
});

test('checkExists confirms a healthy registration', async () => {
  const hash = webhookConfigHash({ url: URL, events, secret: '', numberId: '' });
  const ctx = makeHookCtx({
    params: { events },
    staticData: { webhookId: '42', configHash: hash },
    responder: () => ({ id: 42, url: URL, events: [...events].reverse(), active: true }),
  });
  assert.equal(await hooks.checkExists.call(ctx), true);
  assert.equal(ctx.calls.length, 1);
  assert.equal(ctx.calls[0].method, 'GET');
  assert.equal(ctx.calls[0].url, `${BASE}/v1/webhooks/42`);
});

test('checkExists discards a registration whose config changed', async () => {
  const ctx = makeHookCtx({
    params: { events: ['message.read'] },
    staticData: { webhookId: '42', configHash: 'stale' },
  });
  assert.equal(await hooks.checkExists.call(ctx), false);
  assert.equal(ctx.calls[0].method, 'DELETE');
  assert.equal(ctx.calls[0].url, `${BASE}/v1/webhooks/42`);
  assert.equal(ctx.staticData.webhookId, undefined);
  assert.equal(ctx.staticData.configHash, undefined);
});

test('checkExists rebuilds when the server-side registration drifted', async () => {
  const hash = webhookConfigHash({ url: URL, events, secret: '', numberId: '' });
  for (const drift of [{ active: false }, { url: 'https://other' }, { events: ['message.sent'] }]) {
    const ctx = makeHookCtx({
      params: { events },
      staticData: { webhookId: '42', configHash: hash },
      responder: (o) => (o.method === 'GET' ? { id: 42, url: URL, events, active: true, ...drift } : {}),
    });
    assert.equal(await hooks.checkExists.call(ctx), false, JSON.stringify(drift));
    assert.equal(ctx.calls[1].method, 'DELETE');
    assert.equal(ctx.staticData.webhookId, undefined);
  }
});

test('checkExists treats a 404 as gone and any other error as fatal', async () => {
  const hash = webhookConfigHash({ url: URL, events, secret: '', numberId: '' });
  const gone = makeHookCtx({
    params: { events },
    staticData: { webhookId: '42', configHash: hash },
    responder: () => {
      throw Object.assign(new Error('nf'), { httpCode: '404' });
    },
  });
  assert.equal(await hooks.checkExists.call(gone), false);
  assert.equal(gone.staticData.webhookId, undefined);

  const down = makeHookCtx({
    params: { events },
    staticData: { webhookId: '42', configHash: hash },
    responder: () => {
      throw Object.assign(new Error('boom'), { statusCode: 503 });
    },
  });
  await assert.rejects(hooks.checkExists.call(down), (e) => e instanceof NodeApiError);
  assert.equal(down.staticData.webhookId, '42');
});

test('delete removes the registration, tolerates 404, propagates other errors', async () => {
  const ok = makeHookCtx({ staticData: { webhookId: '42', configHash: 'h' } });
  assert.equal(await hooks.delete.call(ok), true);
  assert.equal(ok.calls[0].method, 'DELETE');
  assert.equal(ok.staticData.webhookId, undefined);

  const gone = makeHookCtx({
    staticData: { webhookId: '42' },
    responder: () => {
      throw Object.assign(new Error('nf'), { statusCode: 404 });
    },
  });
  assert.equal(await hooks.delete.call(gone), true);

  const down = makeHookCtx({
    staticData: { webhookId: '42' },
    responder: () => {
      throw Object.assign(new Error('x'), { statusCode: 500 });
    },
  });
  await assert.rejects(hooks.delete.call(down), (e) => e instanceof NodeApiError);
  assert.equal(down.staticData.webhookId, '42');

  const nothing = makeHookCtx({});
  assert.equal(await hooks.delete.call(nothing), true);
  assert.equal(nothing.calls.length, 0);
});
