# Public idea submission

A public "submit an idea" path on the my-ai-team page (issue #14): a single
free-text field → a validated Cloudflare Worker → durable D1 intake → an instant
mechanical receipt. This is the **front half** of the idea → AI-review pipeline.
It does **not** make the AI value judgement (that is the audit ticket, #100), so
its UX is honestly **asynchronous**: you submit, you get a receipt link, and the
receipt fills in as the review runs later.

## Architecture

The site is a static Astro build on Cloudflare Pages (prod + beta). The intake
lives in a **standalone Cloudflare Worker** backed by **D1**, on a stable URL
(`ideas.shukelabs.com`) — separate from the `shukelabs-like` Worker, with its
own database and its own secrets, so the two never share a blast radius. The
Worker is the **sole owner** of the D1 store and holds **zero GitHub
credentials**.

```
my-ai-team page (form, flag-gated)
        │  POST https://ideas.shukelabs.com/submit   { input, turnstileToken }
        ▼
  shukelabs-ideas Worker ── Turnstile verify → sanitise+cap → quota → store ──► D1 submissions (pending)
        │                                                                          ▲
        │  GET /idea/:id  (public HTML receipt, unguessable id)                     │
        └── /internal/pending · /internal/verdict  (shared-secret) ────────────────┘
                                              ▲
                                the audit ticket (#100) reads/writes here
```

- **Worker source + deploy:** [`../worker-ideas/`](../worker-ideas/)
  (`src/index.js`, `wrangler.toml`, `schema.sql`, `README.md`).
- **Form:** the flag-gated section in
  [`../src/pages/products/my-ai-team.astro`](../src/pages/products/my-ai-team.astro).
- **Config constants:** `IDEAS_ENDPOINT`, `TURNSTILE_SITE_KEY`,
  `IDEA_SUBMISSION_ENABLED` in [`../src/config/site.ts`](../src/config/site.ts).

## Intake model

Raw submissions live **only in D1** — a submission is not a public GitHub issue.
By default (reversible), a public GitHub issue is minted only when the audit
**accepts** (that minting is the audit ticket's job). Rejected submissions never
become public GitHub content; their authored reason is served from D1 on the
receipt. Consequence: the `external-request` label is **provenance on accepted
issues, not the intake queue** — D1 is the queue.

## The receipt (`/idea/:id`)

The receipt is keyed by an **unguessable** UUID and renders the full trail, not
a bare yes/no — so the shareable artefact carries *why*:

| Field            | Filled when | Notes                                             |
| ---------------- | ----------- | ------------------------------------------------- |
| Submitted        | at submit   | UTC timestamp                                     |
| Input hash       | at submit   | SHA-256 of the submitted text                     |
| Quota state      | at submit   | `ip n/5, global m/200` at the moment of intake    |
| Status           | at submit   | `pending` → `accepted` / `rejected`               |
| Security verdict | at audit    | `pending` until #100 writes it                    |
| Scope reason     | at audit    | `pending` until #100 writes it                    |
| Decision         | at audit    | `pending` until #100 writes it                    |
| Reason           | at audit    | the authored accept/reject reason                 |

The receipt always states that the pipeline stops at a **human merge gate**:
even an accepted idea is only ever merged by a person — nothing is applied
autonomously. An unknown id and a malformed path return an **identical** `404`,
so the id cannot be probed by shape.

## Anti-abuse

- **Turnstile** on every submit, verified server-side **exactly once per submit,
  before** the quota step — a failed challenge is `spam` and never consumes a
  submitter's quota.
- **Length cap** 2000 chars; empty/oversized/bad-JSON → `malformed`.
- **Daily quota** in D1: **5 / IP / day** and **200 / day** global; a hit → the
  mechanical `quota-full` receipt. The IP is stored only as a salted hash (the
  quota key), never in the clear.

Reject receipts are mechanical and distinct (`malformed` / `spam` /
`quota-full`), so the submitter always gets an honest, specific outcome.

## Front-end flag state

`IDEA_SUBMISSION_ENABLED` in `src/config/site.ts` defaults to **`false`** — the
form is not rendered. It stays off until:

1. the Worker is deployed and its D1 + secrets are provisioned (see
   [`../worker-ideas/README.md`](../worker-ideas/README.md)),
2. the real public `TURNSTILE_SITE_KEY` replaces the placeholder in
   `src/config/site.ts`, and
3. the audit ticket (#100) is live, so an accepted idea actually gets reviewed.

Flipping the flag to `true` reveals the form; no other change is needed. This
keeps the form from ever shipping in a broken (no-key, no-verdict) state.

## Secrets

Provisioned Worker-side with `wrangler secret put` (never in the repo):

- `TURNSTILE_SECRET` — Cloudflare Turnstile secret key (server-side verify). The
  Turnstile **site** key is public and lives in the form.
- `INTERNAL_SECRET` — shared bearer guarding `/internal/*`; also salts the
  stored IP hash.

No GitHub write token exists anywhere in this pipeline.
