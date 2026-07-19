import { test } from 'node:test';
import assert from 'node:assert/strict';
import { titleFrom, issueBody } from '../lib/github.mjs';

test('titleFrom collapses whitespace and clips long input', () => {
  assert.equal(titleFrom('Add dark mode'), '[idea] Add dark mode');
  assert.equal(titleFrom('  multi\n  line\tinput '), '[idea] multi line input');
  const long = 'x'.repeat(200);
  const t = titleFrom(long);
  assert.ok(t.length <= '[idea] '.length + 72);
  assert.ok(t.endsWith('…'));
});

test('titleFrom degrades to a placeholder on empty input', () => {
  assert.equal(titleFrom('   '), '[idea] submission');
});

test('issueBody carries the receipt trail and the human-gate note', () => {
  const item = { id: 'abc', input: 'let agents pick topics', input_hash: 'deadbeef', created_at: '2026-07-19T00:00:00Z' };
  const verdict = { security: 'benign', scope: 'in-scope', value: 'worth', reason: 'Good fit for the team.' };
  const body = issueBody(item, verdict, 'https://ideas.shukelabs.com/idea/abc');
  assert.match(body, /human merge gate/);
  assert.match(body, /Good fit for the team\./);
  assert.match(body, /https:\/\/ideas\.shukelabs\.com\/idea\/abc/);
  assert.match(body, /deadbeef/);
  assert.match(body, /> let agents pick topics/); // original submission quoted
});
