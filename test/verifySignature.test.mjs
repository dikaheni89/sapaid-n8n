import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifySapaidSignature } from '../dist/nodes/SapaidTrigger/verifySignature.js';

const secret = 'test-secret-123456';
const body = JSON.stringify({ id: 'evt_1', event: 'message.received', data: { text: 'hi' } });
const good = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

test('accepts a valid signature over string and Buffer bodies', () => {
  assert.equal(verifySapaidSignature(body, secret, good), true);
  assert.equal(verifySapaidSignature(Buffer.from(body), secret, good), true);
  assert.equal(verifySapaidSignature(body, secret, ` ${good} `), true);
});

test('rejects tampering, wrong secret, missing or bare header', () => {
  assert.equal(verifySapaidSignature(body + ' ', secret, good), false);
  assert.equal(verifySapaidSignature(body, 'wrong-secret-123456', good), false);
  assert.equal(verifySapaidSignature(body, secret, undefined), false);
  assert.equal(verifySapaidSignature(body, secret, ''), false);
  assert.equal(verifySapaidSignature(body, secret, good.slice('sha256='.length)), false);
  assert.equal(verifySapaidSignature(body, '', good), false);
});
