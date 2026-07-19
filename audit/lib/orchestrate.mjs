// Per-item audit orchestration (issue #100). Pure of I/O: every side effect is
// an injected dependency, so the accept/reject/defer flow and the acceptance-
// quota accounting are unit-testable with fakes and no network/CLI/GitHub.
//
// The mint/relabel decision is driven SOLELY by the parsed verdict + the quota
// counter here — never by the raw submission text. That is the structural half
// of the injection guarantee: a submission cannot talk its way to a public
// issue, and there is no path from submission text to the human merge gate.

// On-voice deferral reason. Deferred submissions keep status='pending' on the
// Worker (see worker-ideas/src/index.js), so they are honestly re-judged on the
// next run — the submitter does not need to resubmit.
export const DEFER_REASON =
  "Your idea cleared review, but today's acceptance quota is already full. It stays in the queue and gets picked up on the next run — no need to resubmit.";

function scopePhrase(verdict) {
  if (verdict.security === 'abuse') return 'flagged as an abuse/injection attempt';
  if (verdict.scope === 'out-of-scope') return 'out of my-ai-team scope';
  if (verdict.value === 'thin') return 'in scope but too thin to queue';
  return 'in my-ai-team scope';
}

/**
 * Run the audit over a batch of pending submissions.
 *
 * @param {Array<{id:string,input:string,created_at?:string,input_hash?:string}>} pending
 * @param {object} deps
 * @param {(s:object)=>Promise<{security,scope,value,decision,reason,valid}>} deps.judge
 * @param {(v:object)=>Promise<any>} deps.writeVerdict  - POST /internal/verdict shape
 * @param {(item:object,verdict:object)=>Promise<{url?:string,number?:number}>} deps.mintIssue
 * @param {number} deps.quota        - max accepts allowed today
 * @param {number} deps.acceptsToday - accepts already minted today (seeds the counter)
 * @param {number} [deps.maxItems]   - safety cap on items judged this run
 * @param {(msg:string)=>void} [deps.log]
 * @returns {Promise<{accepted:number,rejected:number,deferred:number,skipped:number,results:Array}>}
 */
export async function runAudit(pending, deps) {
  const {
    judge,
    writeVerdict,
    mintIssue,
    quota,
    acceptsToday,
    maxItems = Infinity,
    log = () => {},
  } = deps;

  const summary = { accepted: 0, rejected: 0, deferred: 0, skipped: 0, results: [] };
  let acceptsSoFar = acceptsToday;

  const batch = pending.slice(0, maxItems);
  summary.skipped = pending.length - batch.length;
  if (summary.skipped > 0) {
    // Never a silent truncation: say what was left for the next run.
    log(`AUDIT_MAX_ITEMS cap hit — judging ${batch.length}/${pending.length}, ${summary.skipped} deferred to next run`);
  }

  for (const item of batch) {
    const verdict = await judge(item);
    const base = {
      id: item.id,
      security_verdict: verdict.security === 'abuse' ? 'abuse' : 'benign',
      scope_reason: scopePhrase(verdict),
      authored_reason: verdict.reason,
    };

    if (verdict.decision === 'reject') {
      await writeVerdict({ ...base, decision: 'rejected' });
      summary.rejected += 1;
      summary.results.push({ id: item.id, outcome: 'rejected' });
      log(`reject ${item.id} — ${base.scope_reason}`);
      continue;
    }

    // accept-worthy
    if (acceptsSoFar < quota) {
      let issue;
      try {
        issue = await mintIssue(item, verdict);
      } catch (err) {
        // If minting fails, do NOT write an accept verdict — leave the row
        // pending so the next run retries. Surface the failure loudly.
        log(`ERROR minting issue for ${item.id}: ${err?.message || err} — left pending`);
        summary.results.push({ id: item.id, outcome: 'mint-failed' });
        continue;
      }
      await writeVerdict({ ...base, decision: 'accepted' });
      acceptsSoFar += 1;
      summary.accepted += 1;
      summary.results.push({ id: item.id, outcome: 'accepted', issue });
      log(`accept ${item.id} — issue ${issue?.url || issue?.number || '?'} (${acceptsSoFar}/${quota} today)`);
    } else {
      await writeVerdict({ ...base, decision: 'deferred', authored_reason: DEFER_REASON });
      summary.deferred += 1;
      summary.results.push({ id: item.id, outcome: 'deferred' });
      log(`defer ${item.id} — acceptance quota full (${acceptsSoFar}/${quota})`);
    }
  }

  return summary;
}
