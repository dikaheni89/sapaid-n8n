import test from 'node:test';
import assert from 'node:assert/strict';
import { Sapaid } from '../dist/nodes/Sapaid/Sapaid.node.js';
import { makeCtx } from './helpers.mjs';

// Every operation offered in the UI must reach a handler: a dropdown entry with
// no builder behind it would fail at run time with "unsupported operation".
const node = new Sapaid();
const resources = node.description.properties.find((p) => p.name === 'resource').options;
const opProps = node.description.properties.filter((p) => p.name === 'operation');

// Parameters that let every builder get as far as producing a request.
const FILLER = {
  to: '628123456789',
  text: 'x',
  mediaSource: 'url',
  mediaUrl: 'https://x.test/f',
  latitude: 0,
  longitude: 0,
  contactName: 'A',
  contactPhone: '62811122233',
  templateId: 't',
  messageId: 'm',
  chatId: 'c',
  contactId: 'c',
  numberId: 'n',
  broadcastId: 'b',
  labelId: 'l',
  webhookId: 'w',
  phone: '62811122233',
  name: 'N',
  body: 'B',
  url: 'https://x.test/h',
  events: ['message.received'],
  recipients: '62811122233',
  contentType: 'text',
  updateFields: { name: 'N', active: true },
};

test('every resource has an operations dropdown', () => {
  for (const r of resources) {
    const prop = opProps.find((p) => p.displayOptions.show.resource.includes(r.value));
    assert.ok(prop, `resource ${r.value} has no operation dropdown`);
    assert.ok(prop.options.length > 0);
    const names = prop.options.map((o) => o.name);
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)), `${r.value} operations not sorted`);
    for (const o of prop.options) {
      assert.ok(o.action, `${r.value}/${o.value} has no action`);
    }
  }
});

test('every UI operation reaches a handler', async () => {
  for (const r of resources) {
    const prop = opProps.find((p) => p.displayOptions.show.resource.includes(r.value));
    for (const o of prop.options) {
      const ctx = makeCtx({
        params: { ...FILLER, resource: r.value, operation: o.value },
        response: o.value === 'downloadMedia' ? Buffer.from('X') : { data: [] },
      });
      await node.execute.call(ctx);
      assert.equal(ctx.calls.length >= 1, true, `${r.value}/${o.value} made no request`);
      assert.match(ctx.calls[0].options.url, /\/v1\//, `${r.value}/${o.value}`);
    }
  }
});

test('every property has a description unless it is a notice or dropdown root', () => {
  for (const p of node.description.properties) {
    if (['notice', 'collection'].includes(p.type) || p.name === 'resource' || p.name === 'operation') continue;
    assert.ok(p.description, `${p.name} lacks a description`);
    if (p.type === 'boolean') assert.match(p.description, /^Whether /, p.name);
  }
});
