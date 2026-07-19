#!/usr/bin/env node
// Entrypoint for the scheduled idea-audit Action (issue #100). Wires the real
// adapters into the pure orchestrator and runs one pass over the pending queue.
//
// Env:
//   IDEAS_ENDPOINT     base URL of #14's intake Worker (default prod)
//   INTERNAL_SECRET    shared bearer for /internal/* (required)
//   ACCEPTANCE_QUOTA   max accepts per UTC day (default 3)
//   AUDIT_MAX_ITEMS    safety cap on items judged per run (default 25)
//   ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN   read by the `claude` CLI itself
//   GH_TOKEN / GITHUB_TOKEN                    read by the `gh` CLI itself

import { fetchPending, writeVerdict } from './lib/ideas.mjs';
import { judge } from './lib/claude.mjs';
import { mintIssue, countAcceptsToday } from './lib/github.mjs';
import { runAudit } from './lib/orchestrate.mjs';

async function main() {
  const endpoint = (process.env.IDEAS_ENDPOINT || 'https://ideas.shukelabs.com').replace(/\/$/, '');
  const secret = process.env.INTERNAL_SECRET;
  const quota = Number(process.env.ACCEPTANCE_QUOTA || 3);
  const maxItems = Number(process.env.AUDIT_MAX_ITEMS || 25);

  if (!secret) throw new Error('INTERNAL_SECRET is required');

  const today = new Date().toISOString().slice(0, 10);
  const pending = await fetchPending(endpoint, secret);
  console.log(`[audit] ${pending.length} pending submission(s); date ${today}`);
  if (pending.length === 0) return;

  const acceptsToday = await countAcceptsToday(today);
  console.log(`[audit] ${acceptsToday}/${quota} accepts already today`);

  const summary = await runAudit(pending, {
    judge,
    writeVerdict: (v) => writeVerdict(endpoint, secret, v),
    mintIssue: (item, verdict) => mintIssue(item, verdict, `${endpoint}/idea/${item.id}`),
    quota,
    acceptsToday,
    maxItems,
    log: (m) => console.log(`[audit] ${m}`),
  });

  console.log(
    `[audit] done — accepted ${summary.accepted}, rejected ${summary.rejected}, ` +
      `deferred ${summary.deferred}, skipped ${summary.skipped}`,
  );
}

main().catch((err) => {
  console.error(`[audit] fatal: ${err?.stack || err}`);
  process.exit(1);
});
