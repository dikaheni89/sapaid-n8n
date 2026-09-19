import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecipient } from '../dist/nodes/shared/phone.js';

test('normalises Indonesian and international forms', () => {
  assert.equal(normalizeRecipient('0812-3456-789'), '628123456789');
  assert.equal(normalizeRecipient('+62 812 3456 789'), '628123456789');
  assert.equal(normalizeRecipient('628123456789'), '628123456789');
  assert.equal(normalizeRecipient('14155552671'), '14155552671');
});

test('passes a chat or group ID through and refuses junk', () => {
  assert.equal(normalizeRecipient('120363@g.us'), '120363@g.us');
  assert.equal(normalizeRecipient(''), null);
  assert.equal(normalizeRecipient('abc'), null);
  assert.equal(normalizeRecipient('1234567'), null);
  assert.equal(normalizeRecipient('1234567890123456'), null);
});
