// Thin GitHub adapter for the audit (issue #100). Uses the `gh` CLI (matching
// this repo's automation idiom, e.g. .github/workflows/weekly-blog-cadence.yml)
// authed by the Action's built-in GITHUB_TOKEN — no long-lived PAT anywhere.
//
// Two calls: count today's accepts (the durable acceptance-quota state — the
// minted issues ARE the state, no extra store), and mint one raw-report issue
// on accept. The audit authors BLIND (no repo access), so an accept is an
// honest raw report — problem + acceptance boundary, no grounded approach — not
// a delivery-ready ticket. It is minted `external-request` + `raw-report` and
// deliberately NOT `ready`: the delivery agent refines it, then promotes to
// `ready` and implements. See docs/idea-audit.md.

import { execFile } from 'node:child_process';

const ACCEPT_LABEL = 'external-request';
const RAW_REPORT_LABEL = 'raw-report';

function gh(args, { input } = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile('gh', args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`gh ${args[0]} failed: ${stderr || err.message}`));
      resolve(stdout.trim());
    });
    if (input != null) {
      child.stdin.write(input);
      child.stdin.end();
    }
  });
}

/**
 * Count `external-request` issues created since today's UTC midnight. This is
 * the running acceptance-quota total across all runs in the day.
 * @param {string} todayUtc - YYYY-MM-DD (UTC), injected so this stays testable
 */
export async function countAcceptsToday(todayUtc) {
  const out = await gh([
    'issue', 'list',
    '--label', ACCEPT_LABEL,
    '--state', 'all',
    '--limit', '200',
    '--json', 'createdAt',
  ]);
  let rows = [];
  try {
    rows = JSON.parse(out || '[]');
  } catch {
    rows = [];
  }
  return rows.filter((r) => (r.createdAt || '').slice(0, 10) === todayUtc).length;
}

function titleFrom(input) {
  const firstLine = String(input).replace(/\s+/g, ' ').trim();
  const clipped = firstLine.length > 72 ? `${firstLine.slice(0, 69)}…` : firstLine;
  return `[idea] ${clipped || 'submission'}`;
}

function issueBody(item, verdict, receiptUrl) {
  const acceptance = Array.isArray(verdict.acceptance) ? verdict.acceptance : [];
  const criteria = acceptance.length
    ? acceptance.map((c) => `- [ ] ${c}`).join('\n')
    : '- [ ] _(none authored — the delivery agent sets these when grounding)_';

  return `A **raw report** from the public idea inbox, accepted by the autonomous audit. Authored blind (the audit cannot read the repo), so this states the *what* and *why*, not a grounded plan — the delivery agent refines it, promotes it to \`ready\`, and implements. **Queued for consideration, not a commitment to ship** — from here the pipeline merges autonomously, gated by an independent review and a green test suite; whether an accepted idea endures is decided jointly by humans and agents as the roadmap evolves.

**Problem**

${verdict.problem || verdict.reason}

**Out of scope**

${verdict.outOfScope || '_(not specified)_'}

**Acceptance criteria**

${criteria}

**Audit reason** (submitter-facing receipt)

${verdict.reason}

**Trail**

- Receipt: ${receiptUrl}
- Input hash: \`${item.input_hash || 'n/a'}\`
- Submitted: ${item.created_at || 'n/a'}
- Scope: ${verdict.scope} · Security: ${verdict.security} · Value: ${verdict.value}

**Original submission** (user-supplied)

> ${String(item.input).replace(/\n/g, '\n> ')}
`;
}

/**
 * Mint a raw-report public issue for an accepted idea. Labelled
 * `external-request` + `raw-report`, deliberately NOT `ready` — the audit
 * authors blind, so the delivery agent grounds and promotes it.
 * @param {object} item    - the pending submission row
 * @param {object} verdict - the parsed verdict
 * @param {string} receiptUrl - the public /idea/:id URL
 * @returns {Promise<{url:string}>}
 */
export async function mintIssue(item, verdict, receiptUrl) {
  const url = await gh([
    'issue', 'create',
    '--title', titleFrom(item.input),
    '--label', ACCEPT_LABEL,
    '--label', RAW_REPORT_LABEL,
    '--body', issueBody(item, verdict, receiptUrl),
  ]);
  return { url };
}

export { ACCEPT_LABEL, RAW_REPORT_LABEL, titleFrom, issueBody };
