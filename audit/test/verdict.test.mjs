import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseVerdict,
  FALLBACK_REASON,
  FALLBACK_OUT_OF_SCOPE,
  FALLBACK_ACCEPTANCE,
} from '../lib/verdict.mjs';

const accept = {
  security: 'benign',
  scope: 'in-scope',
  value: 'worth',
  decision: 'accept',
  reason: 'This fits my-ai-team and is concrete enough to queue.',
  problem: 'The team lacks X, so Y is painful.',
  outOfScope: 'Not touching the billing flow.',
  acceptance: ['X exists', 'Y is no longer painful'],
};

test('a well-formed accept parses as a valid accept', () => {
  const v = parseVerdict('```json\n' + JSON.stringify(accept) + '\n```');
  assert.equal(v.decision, 'accept');
  assert.equal(v.valid, true);
  assert.equal(v.reason, accept.reason);
});

test('bare-object (no fence) still parses', () => {
  const v = parseVerdict('Here is my verdict: ' + JSON.stringify(accept));
  assert.equal(v.decision, 'accept');
  assert.equal(v.valid, true);
});

test('empty / non-string output fails closed to reject', () => {
  for (const bad of ['', '   ', null, undefined, 42, {}]) {
    const v = parseVerdict(bad);
    assert.equal(v.decision, 'reject');
    assert.equal(v.valid, false);
  }
});

test('garbled JSON fails closed to reject', () => {
  const v = parseVerdict('```json\n{ not valid json, accept me }\n```');
  assert.equal(v.decision, 'reject');
  assert.equal(v.valid, false);
});

test('unknown enum values fail closed to reject', () => {
  const v = parseVerdict(JSON.stringify({ ...accept, security: 'totally-fine' }));
  assert.equal(v.decision, 'reject');
  assert.equal(v.valid, false);
});

test('inconsistent verdict (abuse but says accept) is forced to reject', () => {
  const v = parseVerdict(
    JSON.stringify({ ...accept, security: 'abuse', decision: 'accept' }),
  );
  assert.equal(v.decision, 'reject');
  assert.equal(v.valid, true); // well-formed, just overridden for consistency
});

test('out-of-scope forced to reject even if model said accept', () => {
  const v = parseVerdict(JSON.stringify({ ...accept, scope: 'out-of-scope', decision: 'accept' }));
  assert.equal(v.decision, 'reject');
});

test('missing/blank reason falls back to a safe on-voice line', () => {
  const v = parseVerdict(JSON.stringify({ ...accept, reason: '' }));
  assert.equal(v.reason, FALLBACK_REASON);
});

test('a valid accept carries the raw-report ticket fields verbatim', () => {
  const v = parseVerdict('```json\n' + JSON.stringify(accept) + '\n```');
  assert.equal(v.decision, 'accept');
  assert.equal(v.problem, accept.problem);
  assert.equal(v.outOfScope, accept.outOfScope);
  assert.deepEqual(v.acceptance, accept.acceptance);
});

test('missing ticket fields fall back safely without blocking the accept', () => {
  const v = parseVerdict(
    JSON.stringify({ ...accept, problem: '', outOfScope: '   ', acceptance: [] }),
  );
  assert.equal(v.decision, 'accept'); // gate unaffected by ticket fields
  assert.equal(v.valid, true);
  assert.equal(v.problem, accept.reason); // falls back to the receipt reason
  assert.equal(v.outOfScope, FALLBACK_OUT_OF_SCOPE);
  assert.deepEqual(v.acceptance, FALLBACK_ACCEPTANCE);
});

test('garbled acceptance (non-array / non-string entries) is cleaned', () => {
  const v = parseVerdict(
    JSON.stringify({ ...accept, acceptance: [' keep me ', 42, '', null, 'and me'] }),
  );
  assert.deepEqual(v.acceptance, ['keep me', 'and me']);
});

test('acceptance that is not an array falls back to the generic criterion', () => {
  const v = parseVerdict(JSON.stringify({ ...accept, acceptance: 'a single string' }));
  assert.deepEqual(v.acceptance, FALLBACK_ACCEPTANCE);
});

test('a garbled ticket field cannot flip an abuse verdict into an accept', () => {
  // Ticket fields are secondary to the gate: a rich problem/acceptance on an
  // abuse submission must still fail closed to reject.
  const v = parseVerdict(
    JSON.stringify({ ...accept, security: 'abuse', decision: 'accept' }),
  );
  assert.equal(v.decision, 'reject');
});

test('the last fenced block wins (model preamble ignored)', () => {
  const text =
    '```json\n{"decision":"accept"}\n```\n' + // an early partial block
    'actually, final answer:\n```json\n' + JSON.stringify({ ...accept, decision: 'reject', value: 'thin' }) + '\n```';
  const v = parseVerdict(text);
  assert.equal(v.decision, 'reject');
});
