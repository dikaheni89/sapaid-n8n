import test from 'node:test';
import assert from 'node:assert/strict';
import { WEBHOOK_EVENT_OPTIONS, WEBHOOK_EVENT_VALUES } from '../dist/nodes/shared/webhookEvents.js';
import { Sapaid } from '../dist/nodes/Sapaid/Sapaid.node.js';
import { SapaidTrigger } from '../dist/nodes/SapaidTrigger/SapaidTrigger.node.js';

test('every event has a name, a value and a description, sorted by value', () => {
  for (const o of WEBHOOK_EVENT_OPTIONS) {
    assert.ok(o.name && o.value && o.description, JSON.stringify(o));
    assert.match(o.value, /^[a-z]+\.[a-z_]+$/);
  }
  assert.deepEqual(WEBHOOK_EVENT_VALUES, [...WEBHOOK_EVENT_VALUES].sort());
  assert.equal(new Set(WEBHOOK_EVENT_VALUES).size, WEBHOOK_EVENT_VALUES.length);
});

test('the trigger and the action node read the same event list', () => {
  const trigger = new SapaidTrigger().description.properties.find((p) => p.name === 'events');
  const action = new Sapaid().description.properties.find(
    (p) => p.name === 'events' && p.displayOptions?.show?.resource?.includes('webhook'),
  );
  assert.deepEqual(trigger.options, WEBHOOK_EVENT_OPTIONS);
  assert.deepEqual(action.options, WEBHOOK_EVENT_OPTIONS);
});
