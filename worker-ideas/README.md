# `shukelabs-ideas` — public idea-submission intake Worker

Standalone Cloudflare Worker + D1 backing the public "submit an idea" path on
the my-ai-team page (issue #14). It is the **front half** of the idea →
AI-review pipeline: a validated write path into durable D1 intake plus an
instant, honest *mechanical* receipt. It makes **no** AI value judgement — that
is the audit ticket (#100), which reaches this store only through the
shared-secret `/internal/*` seam.

Deployed **independently** of the Astro site and **separately** from the
`shukelabs-like` Worker — its own name, D1 database, and secrets, so the two
never share a blast radius. This Worker holds **zero GitHub credentials** and
never writes to GitHub.

See [`../docs/idea-intake.md`](../docs/idea-intake.md) for the async UX, the
receipt fields, and the front-end flag state.

## API

| Method | Path                | Auth          | Response          | Effect                                        |
| ------ | ------------------- | ------------- | ----------------- | --------------------------------------------- |
| `POST` | `/submit`           | Origin gate   | `{ id, receiptUrl }` or `{ error, receipt }` | Turnstile-verify → sanitise+cap → quota → store `pending` |
| `GET`  | `/idea/:id`         | none (public) | HTML receipt      | render the receipt for an unguessable id      |
| `GET`  | `/internal/pending` | bearer secret | `{ pending: [...] }` | list `pending` submissions                    |
| `POST` | `/internal/verdict` | bearer secret | `{ id, status }`  | write the audit verdict onto a submission     |

- **`/submit`** is callable only from `https://shukelabs.com` and
  `https://beta.shukelabs.com` (the Origin gate); any other Origin, or none,
  gets `403`. Reject receipts are mechanical and distinct: `malformed`
  (empty/oversized/bad JSON), `spam` (Turnstile failed), `quota-full` (daily cap
  reached). Turnstile is verified **exactly once per submit, before** the quota
  step, so a failed challenge never consumes a submitter's quota. Caps:
  **5 / IP / day**, **200 / day** global.
- **`/idea/:id`** serves an unguessable-id receipt. An unknown id and a
  malformed path return an **identical** `404`, so the id can't be probed by
  shape. Audit-owned fields (security verdict, scope reason, decision, authored
  reason) render as `pending` until `/internal/verdict` fills them.
- **`/internal/*`** require `Authorization: Bearer <INTERNAL_SECRET>`; anything
  else is `401`. This is the only seam the audit host uses. `decision` on
  `/internal/verdict` is `accepted` / `rejected` (both leave the queue) or
  `deferred` — audit #100's acceptance-quota-full "try later", which writes the
  authored reason but keeps `status='pending'` for re-judging next run.

## One-time provisioning + deploy

Run from this `worker-ideas/` directory with `wrangler` (`npx wrangler ...`);
requires a Cloudflare account with D1 and the `ideas.shukelabs.com` DNS in the
same zone.

```bash
# 1. Create the D1 database, then paste the printed database_id into
#    wrangler.toml (replaces REPLACE_WITH_D1_DATABASE_ID).
npx wrangler d1 create shukelabs-ideas

# 2. Apply the schema to the remote database.
npx wrangler d1 execute shukelabs-ideas --remote --file=./schema.sql

# 3. Provision the two secrets (paste the value when prompted).
npx wrangler secret put TURNSTILE_SECRET   # Cloudflare Turnstile secret key
npx wrangler secret put INTERNAL_SECRET    # shared bearer for /internal/*

# 4. Deploy the Worker (binds the custom domain ideas.shukelabs.com).
npx wrangler deploy
```

The custom-domain route in `wrangler.toml` provisions `ideas.shukelabs.com`
automatically when the zone is on the same Cloudflare account; otherwise point a
CNAME at the Worker manually.

Then, on the site side, set the **public** Turnstile site key in
`src/config/site.ts` (`TURNSTILE_SITE_KEY`) and flip `IDEA_SUBMISSION_ENABLED`
to `true` to reveal the form. See [`../docs/idea-intake.md`](../docs/idea-intake.md).

## Verify

```bash
# /submit rejects a foreign / absent Origin (the gate):
curl -X POST https://ideas.shukelabs.com/submit                      # -> 403 forbidden

# /internal/* rejects without the bearer:
curl https://ideas.shukelabs.com/internal/pending                    # -> 401 unauthorized
curl -H 'Authorization: Bearer <INTERNAL_SECRET>' \
  https://ideas.shukelabs.com/internal/pending                       # -> {"pending":[...]}

# an unknown receipt id 404s (same body as a malformed one):
curl -i https://ideas.shukelabs.com/idea/does-not-exist              # -> 404
```

A real `/submit` needs a valid Turnstile token, which only the browser widget on
the site produces — so end-to-end submission is exercised from the page, not
curl. Submissions live in D1 and survive Worker redeploys.
