import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { SapaidTrigger } from '../dist/nodes/SapaidTrigger/SapaidTrigger.node.js';

const SECRET = 'a-long-enough-secret';

function makeWebhookCtx({ params = {}, body, rawBody, headers = {}, staticData = {} } = {}) {
  const raw = rawBody ?? (body === undefined ? undefined : Buffer.from(JSON.stringify(body)));
  const parsed = body ?? (raw ? JSON.parse(raw.toString()) : undefined);
  const res = { status: null, sent: null };
  const ctx = {
    res,
    staticData,
    logs: [],
    getRequestObject: () => ({ body: parsed, rawBody: raw, headers }),
    getResponseObject: () => ({
      status(code) {
        res.status = code;
        return { send: (t) => (res.sent = t) };
      },
    }),
    getNodeParameter: (name, fallback) => (name in params ? params[name] : fallback),
    getWorkflowStaticData: () => staticData,
    logger: { warn: (m) => ctx.logs.push(m), debug: () => {} },
    helpers: { returnJsonArray: (d) => (Array.isArray(d) ? d : [d]).map((json) => ({ json })) },
  };
  return ctx;
}

const trigger = new SapaidTrigger();
const envelope = { id: 'evt_1', event: 'message.received', data: { text: 'halo' } };
const sign = (raw) => 'sha256=' + createHmac('sha256', SECRET).update(raw).digest('hex');

test('unsigned mode passes the envelope through as one item', async () => {
  const ctx = makeWebhookCtx({ body: envelope });
  const out = await trigger.webhook.call(ctx);
  assert.deepEqual(out.workflowData, [[{ json: envelope }]]);
});

test('a non-object body yields no run', async () => {
  const ctx = makeWebhookCtx({ rawBody: Buffer.from('"str"') });
  assert.deepEqual(await trigger.webhook.call(ctx), {});
});

test('signed mode accepts a valid signature over the raw bytes', async () => {
  const raw = Buffer.from(JSON.stringify(envelope) + '\n'); // whitespace a re-serialise would lose
  const ctx = makeWebhookCtx({
    params: { webhookSecret: SECRET },
    rawBody: raw,
    headers: { 'x-sapaid-signature': sign(raw) },
  });
  const out = await trigger.webhook.call(ctx);
  assert.equal(out.workflowData[0][0].json.id, 'evt_1');
  assert.equal(ctx.res.status, null);
});

test('signed mode refuses a bad or missing signature with 401 and no run', async () => {
  for (const headers of [{}, { 'x-sapaid-signature': 'sha256=deadbeef' }]) {
    const ctx = makeWebhookCtx({ params: { webhookSecret: SECRET }, body: envelope, headers });
    const out = await trigger.webhook.call(ctx);
    assert.deepEqual(out, { noWebhookResponse: true });
    assert.equal(ctx.res.status, 401);
  }
});

test('signed mode refuses when the raw body is unavailable', async () => {
  const ctx = makeWebhookCtx({ params: { webhookSecret: SECRET }, body: envelope });
  ctx.getRequestObject = () => ({ body: envelope, headers: { 'x-sapaid-signature': 'x' } });
  const out = await trigger.webhook.call(ctx);
  assert.deepEqual(out, { noWebhookResponse: true });
  assert.equal(ctx.res.status, 401);
  assert.match(ctx.logs[0], /raw request body is unavailable/);
});

test('deduplicate drops a replayed envelope id but never a test delivery', async () => {
  const staticData = {};
  const first = makeWebhookCtx({ params: { deduplicateDeliveries: true }, body: envelope, staticData });
  assert.equal((await trigger.webhook.call(first)).workflowData.length, 1);
  const replay = makeWebhookCtx({ params: { deduplicateDeliveries: true }, body: envelope, staticData });
  assert.deepEqual(await trigger.webhook.call(replay), {});
  assert.deepEqual(staticData.recentEventIds, ['evt_1']);

  const probe = { id: 'evt_test', event: 'test' };
  for (let i = 0; i < 2; i++) {
    const ctx = makeWebhookCtx({ params: { deduplicateDeliveries: true }, body: probe, staticData });
    assert.equal((await trigger.webhook.call(ctx)).workflowData.length, 1);
  }
});

test('deduplicate ring is bounded to 500 ids', async () => {
  const staticData = {};
  for (let i = 0; i < 520; i++) {
    const ctx = makeWebhookCtx({
      params: { deduplicateDeliveries: true },
      body: { id: `evt_${i}`, event: 'message.sent' },
      staticData,
    });
    await trigger.webhook.call(ctx);
  }
  assert.equal(staticData.recentEventIds.length, 500);
  assert.equal(staticData.recentEventIds[0], 'evt_20');
});
