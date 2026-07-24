import { test } from 'node:test';
import assert from 'node:assert/strict';
import { titleFrom, issueBody, ACCEPT_LABEL, RAW_REPORT_LABEL } from '../lib/github.mjs';

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

test('issueBody carries the receipt trail and the queued-for-consideration note', () => {
  const item = { id: 'abc', input: 'let agents pick topics', input_hash: 'deadbeef', created_at: '2026-07-19T00:00:00Z' };
  const verdict = { security: 'benign', scope: 'in-scope', value: 'worth', reason: 'Good fit for the team.' };
  const body = issueBody(item, verdict, 'https://ideas.shukelabs.com/idea/abc');
  assert.match(body, /Queued for consideration, not a commitment to ship/);
  assert.doesNotMatch(body, /human merge gate/);
  assert.match(body, /Good fit for the team\./);
  assert.match(body, /https:\/\/ideas\.shukelabs\.com\/idea\/abc/);
  assert.match(body, /deadbeef/);
  assert.match(body, /> let agents pick topics/); // original submission quoted
});

test('issueBody renders the raw-report ticket sections and keeps reason distinct', () => {
  const item = { id: 'abc', input: 'let agents pick topics', input_hash: 'deadbeef', created_at: '2026-07-19T00:00:00Z' };
  const verdict = {
    security: 'benign', scope: 'in-scope', value: 'worth',
    reason: 'Good fit for the team.',
    problem: 'Agents have no say in what they work on.',
    outOfScope: 'Not changing the merge gate.',
    acceptance: ['Agents can propose topics', 'Proposals are auditable'],
  };
  const body = issueBody(item, verdict, 'https://ideas.shukelabs.com/idea/abc');
  // raw-report framing, not "delivery-ready"
  assert.match(body, /raw report/i);
  assert.doesNotMatch(body, /delivery-ready/i);
  // authored ticket fields render as their own sections
  assert.match(body, /\*\*Problem\*\*/);
  assert.match(body, /Agents have no say in what they work on\./);
  assert.match(body, /\*\*Out of scope\*\*/);
  assert.match(body, /Not changing the merge gate\./);
  assert.match(body, /\*\*Acceptance criteria\*\*/);
  assert.match(body, /- \[ \] Agents can propose topics/);
  assert.match(body, /- \[ \] Proposals are auditable/);
  // submitter-facing reason stays present but labelled as the receipt
  assert.match(body, /Audit reason.*receipt/i);
  assert.match(body, /Good fit for the team\./);
});

test('mint uses external-request + raw-report, never ready', () => {
  assert.equal(ACCEPT_LABEL, 'external-request');
  assert.equal(RAW_REPORT_LABEL, 'raw-report');
});
