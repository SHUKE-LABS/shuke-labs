# Deployment

The site is a static Astro build (`npm run build` → `dist/`) served from
**Cloudflare Pages**, one project with two branches:

| Branch | Environment | Domain | D1 binding |
|--------|-------------|--------|------------|
| `prod` | Production  | `shukelabs.com` (apex) | D1-prod |
| `main` | Preview     | `beta.shukelabs.com`   | D1-beta |

Every other branch (feature/PR branches) is also a Preview deployment and
shares the beta (non-prod) environment — harmless, since nothing but `prod`
touches the apex.

## Ongoing model — beta auto, prod manual-promote

- **Beta** auto-deploys on every merge to `main` → `beta.shukelabs.com`.
- **Production** is a deliberate promotion: **merge `main` → `prod`**. That
  merge is the only push that publishes to the apex. A merge to `main` never
  publishes to production.

So the flow is: PR → `main` (CI + beta preview) → verify on beta → promote by
merging `main` into `prod` (publishes the apex).

CF Pages differentiates deployments by **branch**, not by an env-var switch, so
this branch split is what enforces the gate. Env vars and bindings (including
the per-environment D1 namespace) are set separately for Production vs Preview
in the Pages project settings — that is what keeps the like counter's prod and
beta counts isolated (#97).

## One-time cutover runbook (GitHub Pages → Cloudflare Pages)

Execute in order. Steps (a)–(d) are Cloudflare dashboard / DNS actions; the
repo half (retiring the GitHub Pages workflow, dropping `public/CNAME`,
correcting all references) already shipped in the migration PR. Nothing here is
irreversible until step (d), and prod keeps serving from the last GitHub Pages
deploy until that cut — so verify first, cut last.

a. **Create / confirm the CF Pages project** for this repo. Build command
   `npm run build`, build output directory `dist`, Node 22. No Astro adapter —
   the output is pure static `dist/` (Functions, if later added for likes, live
   in `/functions` and still need no adapter).

b. **Configure the two environments.** Set the **production branch to `prod`**
   and bind D1-prod to Production. Leave `main` as a preview branch, attach the
   custom domain `beta.shukelabs.com` to it, and bind D1-beta to Preview.

c. **Create the `prod` branch** from `main`'s tip and push it, so CF Pages has a
   production deployment to publish:

   ```bash
   git fetch origin
   git push origin origin/main:refs/heads/prod
   ```

d. **Attach the apex and cut DNS — the last, irreversible step.** Only after the
   CF Pages production deployment is verified serving the built site (open the
   `*.pages.dev` production URL and confirm the site loads): attach the custom
   domain `shukelabs.com` (and `www.shukelabs.com` if used) to the production
   deployment, then cut the apex DNS to Cloudflare Pages. The DNS zone is
   already on Cloudflare, so this is a zone-internal record change. This is the
   moment the apex stops serving from GitHub Pages.

e. **Verify on the live apex (post-cutover).** With `shukelabs.com` now served
   by CF Pages, confirm TLS is valid and the apex + `www` resolve, then check
   parity against the previous prod — **sitemap** (`/sitemap-index.xml`),
   **RSS**, per-post **permalinks**, and the **404** page all resolve
   identically. (These are live-host checks; the migration PR cannot prove them
   pre-cutover.)

f. **GitHub Pages retirement** — already done in the migration PR
   (`.github/workflows/deploy.yml` and `public/CNAME` removed). No further
   action; the old GitHub Pages deployment can be disabled in repo settings once
   the apex is confirmed on CF Pages.
