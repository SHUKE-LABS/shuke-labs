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

Deployment is two-tier:

- **Beta** (`beta.shukelabs.com`, Cloudflare Pages Git integration) auto-deploys on every merge to `main`.
- **Production** (`shukelabs.com`, GitHub Pages via `.github/workflows/deploy.yml`) is a manual promotion: it runs on `workflow_dispatch` only, after beta is verified — nothing ships to production automatically on push.

The production custom domain `shukelabs.com` is set in `public/CNAME`.

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

## License

© 2026 SHUKE Labs Ltd
