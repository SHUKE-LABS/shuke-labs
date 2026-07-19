# SHUKE Labs Ltd

Official website of SHUKE Labs Ltd — **Build more, struggle less**

Live at [shukelabs.com](https://shukelabs.com).

## Products

- My AI Team — Structured AI agent sessions in your terminal (commercial; contact weizhong2004@gmail.com)
- Rewind — Navigate and explore your AI coding sessions (commercial; contact weizhong2004@gmail.com)
- [Agent Quota Gateway](https://github.com/SHUKE-LABS/agent-quota-gateway) — Auto-rotate accounts, keep shipping
- [Credential Gateway](https://github.com/SHUKE-LABS/credential-gateway) — Credentials outside your worktree, injected at runtime
- [HappyNotes](https://happynotes.shukebeta.com) — Fast, durable note-taking
- [NewWords](https://newwords.shukebeta.com) — Capture vocabulary, reinforce it with AI-generated stories

## Development

This site is built with [Astro](https://astro.build/) and [Tailwind CSS](https://tailwindcss.com/).

```bash
# Install dependencies
npm install

# Serve locally (http://localhost:4321)
npm run dev

# Build to ./dist
npm run build

# Preview the production build
npm run preview
```

## Deployment

Both tiers are served from **Cloudflare Pages** (one project, two branches):

- **Beta** (`beta.shukelabs.com`, the `main` branch) auto-deploys on every merge to `main`.
- **Production** (`shukelabs.com`, the `prod` branch) is a manual promotion: **merge `main` → `prod`** after beta is verified — nothing ships to production automatically on a merge to `main`.

Full model, per-environment D1 bindings, and the one-time cutover runbook are in [`docs/deploy.md`](docs/deploy.md).

## Blog cadence

The blog runs a sustained weekly cadence driven by a cron GitHub Action
(`.github/workflows/weekly-blog-cadence.yml`, Monday 09:00 UTC). Each week it
mints two "本周文章" track issues for an A/B experiment on topic sourcing —
does an agent-chosen or a shuke-chosen topic produce the better post?

- **Agent-sourced** (`本周文章:agent`) — opens `ready`; a delivery agent picks
  the topic and writes the post.
- **Shuke-sourced 命题** (`本周文章:命题`) — opens `blocked`; shuke assigns the
  topic and marks it `ready`. The automation never promotes this track.

A dedup guard skips a track whose previous issue is still open, so a slow week
never piles up a backlog. The cron is self-healing — it fires every week
regardless of whether the prior week's post shipped — and can be triggered
on demand via `workflow_dispatch`.

Each published post records its track in a non-rendered `topicSource`
(`agent | shuke`) frontmatter field, so the two tracks stay filterable for
comparison. Evaluation is shuke's qualitative read over several weeks; there is
no analytics pipeline.

## Post likes

Blog posts carry an anonymous, global like counter — a real cross-visitor
count shared by prod and beta, backed by a standalone Cloudflare Worker + D1
(`worker/`). Design, API, and deploy steps are in
[`docs/like-counter.md`](docs/like-counter.md).

## License

© 2026 SHUKE Labs Ltd
