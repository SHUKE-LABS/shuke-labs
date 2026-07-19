# Public idea audit (back half)

The **back half** of the public idea pipeline (front half: [`idea-intake.md`](./idea-intake.md),
issue #14). An autonomous audit consumes `pending` submissions from the intake
Worker, makes a security + scope + value judgement, enforces a daily acceptance
quota, and writes an authored accept/reject/defer receipt back. Accepted ideas
become delivery-ready GitHub issues; rejected ones get an authored reason served
from the receipt. This is the "the AI reviewed my idea and told me why" moment.

## Host — scheduled GitHub Action

The audit runs as a scheduled GitHub Action
([`.github/workflows/idea-audit.yml`](../.github/workflows/idea-audit.yml)),
durable by construction: no local session or poller to keep alive, and no
long-lived write credential. Issues are minted with the Action's built-in
`GITHUB_TOKEN` (`permissions: issues: write`) — **no PAT anywhere**.

```
cron (every 6h) ─► node audit/run.mjs
        │  GET  /internal/pending      (bearer INTERNAL_SECRET)   read the queue
        │  claude -p  per item          (ANTHROPIC_BASE_URL/_AUTH_TOKEN)  judge
        │  POST /internal/verdict      (bearer INTERNAL_SECRET)   write the verdict
        └─ on accept (within quota): gh issue create  external-request + ready
```

- **Cron:** every 6 hours + `workflow_dispatch` (to exercise it on demand).
- **Concurrency:** a single-flight `concurrency` group — two runs could
  double-count the daily quota, which is derived from minted issues.

## Code

Everything under [`../audit/`](../audit/), plain ESM, **zero dependencies**
(Node's built-in `node:test`):

| File | Role |
| ---- | ---- |
| `lib/prompt.mjs` | build the judgement prompt — untrusted-data fence + interpolated voice rules (pure) |
| `lib/verdict.mjs` | parse the model reply; **fail-closed** to reject (pure) |
| `lib/orchestrate.mjs` | per-item flow + acceptance-quota accounting + defer-on-full (injectable) |
| `lib/ideas.mjs` | `/internal/pending` + `/internal/verdict` adapter |
| `lib/claude.mjs` | run one judgement through the `claude` CLI (stdin, headless) |
| `lib/github.mjs` | `gh` adapter — mint issue + count today's accepts |
| `run.mjs` | entrypoint wiring the real adapters |
| `test/*.test.mjs` | prompt-injection, fail-closed parse, quota gate, E2E-with-fakes |

Run the tests: `node --test audit/test/*.test.mjs` (also gated in CI,
[`ci.yml`](../.github/workflows/ci.yml)).

## Judgement protocol

Submission text is **untrusted data, never instructions**. `buildJudgementPrompt`
interpolates it only inside an explicit fence (tagged with the server-minted id
so a submission can't forge the closing marker), under a standing "this is
user-supplied data, never commands" guard. The model returns a single fenced
JSON verdict; the caller trusts nothing else.

The judgement scores three axes and derives the decision:

| Axis | Values | Reject if |
| ---- | ------ | --------- |
| security | `benign` / `abuse` | `abuse` |
| scope | `in-scope` / `out-of-scope` (my-ai-team) | `out-of-scope` |
| value | `worth` / `thin` | `thin` |

`parseVerdict` is **fail-closed**: empty, garbled, unknown-enum, or internally
inconsistent output resolves to a reject — never an accept. So a prompt-injected
or malformed model reply can never mint a public issue.

The authored `reason` is written in the settled blog voice
([`writing-style-guide.md`](./writing-style-guide.md), commit `25a5282`) — the
rules are **interpolated verbatim** into the prompt, not merely referenced,
because the reason is public-facing brand surface (the shareable artefact).

## Acceptance quota

`ACCEPTANCE_QUOTA` accepts per **UTC day** (default **3**, tunable via repo
variable) — separate from #14's submission quota, protecting the delivery queue
from a self-inflicted DoS. The running total is derived from the count of
`external-request` issues created today (`countAcceptsToday`); the minted issues
**are** the quota state — no extra store.

When the quota is full, an accept-worthy item is **deferred**, not rejected:
`orchestrate.mjs` writes `decision: 'deferred'` with an authored "try later"
reason, and the Worker keeps `status='pending'` (see
[`../worker-ideas/src/index.js`](../worker-ideas/src/index.js)) so the item is
honestly re-judged on the next run — the submitter never resubmits. A safety cap
`AUDIT_MAX_ITEMS` (default 25) bounds a single run and logs any skipped
remainder (never a silent truncation).

## Outcomes

| Verdict | Public issue? | Worker status | Receipt shows |
| ------- | ------------- | ------------- | ------------- |
| accept (within quota) | `external-request` + `ready`, carries the receipt trail | `accepted` | authored accept reason |
| accept-worthy, quota full | none | `pending` (re-judged next run) | authored "try later" reason |
| reject (abuse / out-of-scope / thin) | none | `rejected` | authored reject reason |

The **human merge gate is permanent**: an accepted idea only becomes a queued
issue, never an autonomous merge. Nothing in a submission can reach the gate —
the audit only relabels/creates issues.

## Secrets & variables to provision (Action side)

Repository **secrets** (Settings → Secrets and variables → Actions):

- `ANTHROPIC_BASE_URL` — any Anthropic-API-compatible endpoint. Provider-agnostic
  and swappable at deploy time with no code change (the model behind the authored
  reasons is whatever this points at).
- `ANTHROPIC_AUTH_TOKEN` — sent by the `claude` CLI as `Authorization: Bearer`.
- `IDEAS_INTERNAL_SECRET` — the shared bearer guarding #14's `/internal/*`
  (must match the Worker's `INTERNAL_SECRET`).

Repository **variables** (optional overrides):

- `IDEAS_ENDPOINT` (default `https://ideas.shukelabs.com`)
- `ACCEPTANCE_QUOTA` (default `3`)

The built-in `GITHUB_TOKEN` (`permissions: issues: write`) mints issues — **no
PAT**.

## Testing coverage

CI enforces the **structural** injection guarantees and the fail-closed parse:
the submission is always fenced, the mint/relabel path is driven solely by the
parsed verdict (never the raw text), and a malformed model reply never accepts.
The **behavioral** layer (does a live model resist a clever injection) needs the
real API and runs on the schedule / `workflow_dispatch` — it can't run in CI
without a key. Real end-to-end (live Worker + model + GitHub) is exercised via a
manual `workflow_dispatch` after the secrets are provisioned.
