// Thin GitHub adapter for the audit (issue #100). Uses the `gh` CLI (matching
// this repo's automation idiom, e.g. .github/workflows/weekly-blog-cadence.yml)
// authed by the Action's built-in GITHUB_TOKEN — no long-lived PAT anywhere.
//
// Two calls: count today's accepts (the durable acceptance-quota state — the
// minted issues ARE the state, no extra store), and mint one delivery-ready
// issue on accept.

import { execFile } from 'node:child_process';

const ACCEPT_LABEL = 'external-request';
const READY_LABEL = 'ready';

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
  return `An accepted submission from the public idea inbox. Audited autonomously; **queued for the team, not merged** — the permanent human merge gate still applies.

**Audit reason**

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
 * Mint a delivery-ready public issue for an accepted idea.
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
    '--label', READY_LABEL,
    '--body', issueBody(item, verdict, receiptUrl),
  ]);
  return { url };
}

export { ACCEPT_LABEL, READY_LABEL, titleFrom, issueBody };
