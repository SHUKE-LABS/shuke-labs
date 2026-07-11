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

## License

© 2026 SHUKE Labs Ltd
