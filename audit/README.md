# `audit/` — public idea audit host

Back half of the public idea pipeline (issue #100; front half #14). A scheduled
GitHub Action reads `pending` submissions from the intake Worker, runs one Claude
judgement per item (security → scope → value → acceptance quota), writes the
verdict back to the receipt store, and on accept mints a **raw-report** public
issue (`external-request` + `raw-report`, not `ready`) — an honest problem +
acceptance boundary authored blind, which the delivery agent then refines,
promotes to `ready`, and implements. Durable by construction — no long-lived
credential, no autonomous merge.

Plain ESM, **zero dependencies** (Node's built-in test runner).

```bash
node --test audit/test/*.test.mjs   # unit tests (also gated in CI)
node audit/run.mjs                   # one audit pass (needs the env below)
```

Host + protocol + secrets: [`../docs/idea-audit.md`](../docs/idea-audit.md).
The host workflow: [`../.github/workflows/idea-audit.yml`](../.github/workflows/idea-audit.yml).
