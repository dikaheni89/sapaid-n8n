import test from 'node:test';
import assert from 'node:assert/strict';
import { Sapaid } from '../dist/nodes/Sapaid/Sapaid.node.js';
import { BASE, NodeApiError, NodeOperationError, makeCtx } from './helpers.mjs';

async function run(params, opts = {}) {
  const ctx = makeCtx({ ...opts, params });
  const output = await new Sapaid().execute.call(ctx);
  return { ctx, output, call: ctx.calls[0], calls: ctx.calls };
}

// ---------- message ----------

test('sendText posts the text envelope with a normalised recipient', async () => {
  const { call } = await run({
    resource: 'message',
    operation: 'sendText',
    to: '0812-3456-789',
    text: '  Halo  ',
  });
  assert.equal(call.credName, 'sapaidApi');
  assert.equal(call.options.method, 'POST');
  assert.equal(call.options.url, `${BASE}/v1/messages`);
  assert.deepEqual(call.options.body, { to: '628123456789', type: 'text', text: 'Halo' });
});

test('sendText passes a chat/group ID through and applies send options', async () => {
  const { call } = await run({
    resource: 'message',
    operation: 'sendText',
    to: '120363012345@g.us',
    text: 'hi',
    numberId: 'num_1',
    sendOptions: { replyTo: 'msg_9', idempotencyKey: 'abc', typingSeconds: 3 },
  });
  assert.deepEqual(call.options.body, {
    to: '120363012345@g.us',
    number_id: 'num_1',
    type: 'text',
    text: 'hi',
    reply_to: 'msg_9',
    idempotency_key: 'abc',
    typing_seconds: 3,
  });
});

test('sendText refuses an empty recipient and a bad phone', async () => {
  await assert.rejects(
    run({ resource: 'message', operation: 'sendText', to: '', text: 'x' }),
    (e) => e instanceof NodeOperationError && /To cannot be empty/.test(e.message),
  );
  await assert.rejects(
    run({ resource: 'message', operation: 'sendText', to: '123', text: 'x' }),
    (e) => /not a valid phone number/.test(e.message),
  );
});

test('sendText refuses an object where text is expected', async () => {
  await assert.rejects(
    run({ resource: 'message', operation: 'sendText', to: '628123456789', text: { a: 1 } }),
    (e) => /Text must be text/.test(e.message),
  );
});

test('sendImage from binary sends base64 with the MIME type n8n knows', async () => {
  const { call } = await run({
    resource: 'message',
    operation: 'sendImage',
    to: '628123456789',
    mediaSource: 'binary',
    binaryPropertyName: 'data',
    caption: 'lihat',
  });
  assert.deepEqual(call.options.body, {
    to: '628123456789',
    type: 'image',
    media: { base64: 'SU1HREFUQQ==', mime_type: 'image/png', filename: 'shot.png' },
    caption: 'lihat',
  });
});

test('sendDocument from URL forwards the URL and file name', async () => {
  const { call } = await run({
    resource: 'message',
    operation: 'sendDocument',
    to: '628123456789',
    mediaSource: 'url',
    mediaUrl: 'https://x.test/a.pdf',
    fileName: 'invoice.pdf',
  });
  assert.deepEqual(call.options.body.media, { url: 'https://x.test/a.pdf', filename: 'invoice.pdf' });
  assert.equal(call.options.body.type, 'document');
});

test('media URL must be http(s)', async () => {
  await assert.rejects(
    run({
      resource: 'message',
      operation: 'sendImage',
      to: '628123456789',
      mediaSource: 'url',
      mediaUrl: 'ftp://x',
    }),
    (e) => /Media URL must start with/.test(e.message),
  );
});

test('sendAudio base64 falls back to audio/ogg and honours voice note', async () => {
  const { call } = await run({
    resource: 'message',
    operation: 'sendAudio',
    to: '628123456789',
    mediaSource: 'base64',
    mediaBase64: 'AAAA',
    voiceNote: true,
  });
  assert.deepEqual(call.options.body.media, { base64: 'AAAA', mime_type: 'audio/ogg', filename: undefined });
  assert.equal(call.options.body.voice_note, true);
});

test('sendLocation validates the range and includes optional labels', async () => {
  const { call } = await run({
    resource: 'message',
    operation: 'sendLocation',
    to: '628123456789',
    latitude: -6.2,
    longitude: 106.8,
    locationName: 'Kantor',
  });
  assert.deepEqual(call.options.body.location, { latitude: -6.2, longitude: 106.8, name: 'Kantor' });
  await assert.rejects(
    run({ resource: 'message', operation: 'sendLocation', to: '628123456789', latitude: 95, longitude: 0 }),
    (e) => /Latitude/.test(e.message),
  );
});

test('sendContact normalises the card phone', async () => {
  const { call } = await run({
    resource: 'message',
    operation: 'sendContact',
    to: '628123456789',
    contactName: 'Budi',
    contactPhone: '0811122233',
  });
  assert.deepEqual(call.options.body.contact, { name: 'Budi', phone: '62811122233' });
});

test('sendTemplate parses variables text and refuses malformed JSON', async () => {
  const { call } = await run({
    resource: 'message',
    operation: 'sendTemplate',
    to: '628123456789',
    templateId: 'tpl_1',
    variables: '{"nama":"Budi"}',
  });
  assert.deepEqual(call.options.body.template, { id: 'tpl_1', variables: { nama: 'Budi' } });
  await assert.rejects(
    run({ resource: 'message', operation: 'sendTemplate', to: '628123456789', templateId: 'tpl_1', variables: '{bad' }),
    (e) => /Variables must be valid JSON/.test(e.message),
  );
});

test('message get encodes the ID and refuses path traversal', async () => {
  const { call } = await run({ resource: 'message', operation: 'get', messageId: 'a b' });
  assert.equal(call.options.method, 'GET');
  assert.equal(call.options.url, `${BASE}/v1/messages/a%20b`);
  await assert.rejects(
    run({ resource: 'message', operation: 'get', messageId: '../x' }),
    (e) => /invalid characters/.test(e.message),
  );
});

test('downloadMedia attaches the bytes as binary', async () => {
  const { ctx, output, call } = await run(
    { resource: 'message', operation: 'downloadMedia', messageId: 'm1', binaryPropertyName: 'file' },
    { response: Buffer.from('PDFBYTES') },
  );
  assert.equal(call.options.url, `${BASE}/v1/messages/m1/media`);
  assert.equal(call.options.encoding, 'arraybuffer');
  assert.equal(call.options.json, false);
  assert.equal(ctx.prepared[0].buffer, 'PDFBYTES');
  assert.ok(output[0][0].binary.file);
});

test('message list sends limit and ISO dates, and unwraps rows', async () => {
  const { call, output } = await run(
    {
      resource: 'message',
      operation: 'list',
      returnAll: false,
      limit: 10,
      filters: { chat_id: 'c1', since: '2026-09-01T00:00:00+07:00' },
    },
    { response: { data: [{ id: 'a' }, { id: 'b' }], next_cursor: 'zzz' } },
  );
  assert.equal(call.options.url, `${BASE}/v1/messages`);
  assert.deepEqual(call.options.qs, { chat_id: 'c1', since: '2026-08-31T17:00:00.000Z', limit: 10 });
  assert.deepEqual(output[0].map((i) => i.json), [{ id: 'a' }, { id: 'b' }]);
});

test('returnAll follows next_cursor until null', async () => {
  const { calls, output } = await run(
    { resource: 'contact', operation: 'list', returnAll: true },
    {
      responses: [
        { data: [{ id: 1 }], next_cursor: 'p2' },
        { data: [{ id: 2 }], next_cursor: 'p3' },
        { data: [{ id: 3 }], next_cursor: null },
      ],
    },
  );
  assert.equal(calls.length, 3);
  assert.equal(calls[0].options.qs, undefined);
  assert.equal(calls[1].options.qs.cursor, 'p2');
  assert.equal(calls[2].options.qs.cursor, 'p3');
  assert.deepEqual(output[0].map((i) => i.json.id), [1, 2, 3]);
});

// ---------- chat ----------

test('chat operations hit the right routes', async () => {
  const cases = [
    [{ operation: 'get', chatId: 'c1' }, 'GET', '/v1/chats/c1', undefined],
    [{ operation: 'markRead', chatId: 'c1' }, 'POST', '/v1/chats/c1/read', undefined],
    [{ operation: 'close', chatId: 'c1' }, 'POST', '/v1/chats/c1/close', undefined],
    [{ operation: 'reopen', chatId: 'c1' }, 'POST', '/v1/chats/c1/reopen', undefined],
    [{ operation: 'assign', chatId: 'c1', agentId: 'u1' }, 'POST', '/v1/chats/c1/assign', { agent_id: 'u1' }],
    [{ operation: 'assign', chatId: 'c1', agentId: '' }, 'POST', '/v1/chats/c1/assign', { agent_id: null }],
    [{ operation: 'setLabels', chatId: 'c1', labelIds: ['l1', 'l2'] }, 'PUT', '/v1/chats/c1/labels', { label_ids: ['l1', 'l2'] }],
  ];
  for (const [params, method, path, body] of cases) {
    const { call } = await run({ resource: 'chat', ...params });
    assert.equal(call.options.method, method, path);
    assert.equal(call.options.url, `${BASE}${path}`);
    assert.deepEqual(call.options.body, body, path);
  }
});

test('chat list forwards filters and drops blanks', async () => {
  const { call } = await run(
    { resource: 'chat', operation: 'list', returnAll: false, limit: 5, filters: { status: 'open', q: '', unread: false } },
    { response: { data: [] } },
  );
  assert.deepEqual(call.options.qs, { status: 'open', unread: false, limit: 5 });
});

// ---------- contact ----------

test('contact create builds the body with optional fields', async () => {
  const { call } = await run({
    resource: 'contact',
    operation: 'create',
    phone: '0812 3456 789',
    name: 'Budi',
    additionalFields: { email: 'b@x.id', labelIds: 'l1, l2', metadata: '{"crm":"7"}', notes: '' },
  });
  assert.equal(call.options.url, `${BASE}/v1/contacts`);
  assert.deepEqual(call.options.body, {
    phone: '628123456789',
    name: 'Budi',
    email: 'b@x.id',
    notes: null,
    label_ids: ['l1', 'l2'],
    metadata: { crm: '7' },
  });
});

test('contact update refuses an empty change set and a blank name', async () => {
  await assert.rejects(
    run({ resource: 'contact', operation: 'update', contactId: 'c1', updateFields: {} }),
    (e) => /at least one field/.test(e.message),
  );
  await assert.rejects(
    run({ resource: 'contact', operation: 'update', contactId: 'c1', updateFields: { name: ' ' } }),
    (e) => /Name cannot be blank/.test(e.message),
  );
  const { call } = await run({ resource: 'contact', operation: 'update', contactId: 'c1', updateFields: { name: 'Ani' } });
  assert.equal(call.options.method, 'PATCH');
  assert.deepEqual(call.options.body, { name: 'Ani' });
});

test('contact check and delete', async () => {
  const { call } = await run({ resource: 'contact', operation: 'check', phone: '08123456789' });
  assert.equal(call.options.url, `${BASE}/v1/contacts/check`);
  assert.deepEqual(call.options.body, { phone: '628123456789' });
  const del = await run({ resource: 'contact', operation: 'delete', contactId: 'c1' }, { response: '' });
  assert.equal(del.call.options.method, 'DELETE');
  assert.deepEqual(del.output[0][0].json, { success: true });
});

// ---------- number / template / label / broadcast / webhook ----------

test('number routes', async () => {
  assert.equal((await run({ resource: 'number', operation: 'list' })).call.options.url, `${BASE}/v1/numbers`);
  assert.equal(
    (await run({ resource: 'number', operation: 'getStatus', numberId: 'n1' })).call.options.url,
    `${BASE}/v1/numbers/n1/status`,
  );
});

test('template create, update, render', async () => {
  const c = await run({ resource: 'template', operation: 'create', name: 'Promo', body: 'Halo {{nama}}' });
  assert.deepEqual(c.call.options.body, { name: 'Promo', body: 'Halo {{nama}}' });
  const u = await run({ resource: 'template', operation: 'update', templateId: 't1', updateFields: { body: 'x' } });
  assert.equal(u.call.options.method, 'PATCH');
  assert.deepEqual(u.call.options.body, { body: 'x' });
  const r = await run({ resource: 'template', operation: 'render', templateId: 't1', variables: { nama: 'A' } });
  assert.equal(r.call.options.url, `${BASE}/v1/templates/t1/render`);
  assert.deepEqual(r.call.options.body, { variables: { nama: 'A' } });
});

test('label create validates colour', async () => {
  const { call } = await run({ resource: 'label', operation: 'create', name: 'VIP', color: '#e8a33d' });
  assert.deepEqual(call.options.body, { name: 'VIP', color: '#E8A33D' });
  await assert.rejects(
    run({ resource: 'label', operation: 'create', name: 'VIP', color: 'red' }),
    (e) => /hex colour/.test(e.message),
  );
});

test('broadcast create normalises, de-duplicates and schedules', async () => {
  const { call } = await run({
    resource: 'broadcast',
    operation: 'create',
    name: 'Promo',
    recipients: '0812111, 62812111\n0813222',
    contentType: 'text',
    text: 'Diskon!',
    broadcastOptions: { scheduleAt: '2026-10-01T09:00:00+07:00', delaySeconds: 8 },
  });
  assert.equal(call.options.url, `${BASE}/v1/broadcasts`);
  assert.deepEqual(call.options.body, {
    name: 'Promo',
    recipients: ['62812111', '62813222'],
    text: 'Diskon!',
    schedule_at: '2026-10-01T02:00:00.000Z',
    delay_seconds: 8,
  });
});

test('broadcast create with template and a bad recipient', async () => {
  const { call } = await run({
    resource: 'broadcast',
    operation: 'create',
    name: 'P',
    recipients: ['62811122233'],
    contentType: 'template',
    templateId: 't1',
    variables: '',
  });
  assert.deepEqual(call.options.body.template, { id: 't1', variables: {} });
  await assert.rejects(
    run({ resource: 'broadcast', operation: 'create', name: 'P', recipients: 'abc', contentType: 'text', text: 'x' }),
    (e) => /Recipient "abc" is not a valid/.test(e.message),
  );
});

test('webhook create validates URL, events and secret', async () => {
  const { call } = await run({
    resource: 'webhook',
    operation: 'create',
    url: 'https://x.test/h',
    events: ['message.received'],
    additionalFields: { secret: 'sixteen-chars-ok!', numberId: 'n1' },
  });
  assert.deepEqual(call.options.body, {
    url: 'https://x.test/h',
    events: ['message.received'],
    secret: 'sixteen-chars-ok!',
    number_id: 'n1',
  });
  await assert.rejects(
    run({ resource: 'webhook', operation: 'create', url: 'https://x', events: ['nope'] }),
    (e) => /Unknown event: nope/.test(e.message),
  );
  await assert.rejects(
    run({ resource: 'webhook', operation: 'create', url: 'https://x', events: ['message.sent'], additionalFields: { secret: 'short' } }),
    (e) => /at least 16 characters/.test(e.message),
  );
});

test('webhook update sends null to clear the secret', async () => {
  const { call } = await run({
    resource: 'webhook',
    operation: 'update',
    webhookId: 'w1',
    updateFields: { secret: '', active: false },
  });
  assert.equal(call.options.method, 'PATCH');
  assert.deepEqual(call.options.body, { secret: null, active: false });
});

// ---------- executor behaviour ----------

test('unsupported resource/operation fails with the item index', async () => {
  await assert.rejects(
    run({ resource: 'message', operation: 'nope' }),
    (e) => e instanceof NodeOperationError && /Unsupported resource\/operation: message\/nope/.test(e.message),
  );
});

test('a request failure becomes a NodeApiError carrying the server message', async () => {
  const err = Object.assign(new Error('Request failed'), {
    response: { body: { error: { code: 'quota_exceeded', message: 'Kuota pesan habis' } } },
  });
  await assert.rejects(
    run({ resource: 'number', operation: 'list' }, { throwErr: err }),
    (e) => e instanceof NodeApiError && e.description === 'Kuota pesan habis' && e.context.itemIndex === 0,
  );
});

test('continue on fail records the error per item and keeps going', async () => {
  const err = Object.assign(new Error('boom'), { response: { body: { error: { message: 'nope' } } } });
  const { output } = await run(
    { resource: 'number', operation: 'list' },
    { throwErr: err, items: 2, continueOnFail: true },
  );
  assert.equal(output[0].length, 2);
  assert.equal(output[0][1].json.description, 'nope');
  assert.deepEqual(output[0][1].pairedItem, { item: 1 });
});

test('a scalar response is wrapped under data', async () => {
  const { output } = await run({ resource: 'number', operation: 'list' }, { response: 'ok' });
  assert.deepEqual(output[0][0].json, { data: 'ok' });
});
