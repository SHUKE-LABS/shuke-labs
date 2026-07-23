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

## Ongoing model — beta auto, prod gated-promote

- **Beta** auto-deploys on every merge to `main` → `beta.shukelabs.com`.
- **Production** is a deliberate, gated promotion: run the **"Release to
  production"** GitHub Actions workflow (`.github/workflows/release-to-production.yml`).
  A push to `prod` is the only push that publishes to the apex; a merge to
  `main` never publishes to production.

So the flow is: PR → `main` (CI + beta preview) → verify on beta → promote by
dispatching the release workflow (publishes the apex).

### Promoting via the release workflow

Actions → **Release to production** → **Run workflow**. One input:

- `ref` — the ref to promote: a branch name (default `main`), a tag, or a
  commit SHA. The workflow resolves it to a SHA and **force-sets** `prod` to it
  (`git push --force origin <sha>:refs/heads/prod`); CF Pages then deploys the
  apex to that tree.

Because `prod` is force-set (not fast-forward merged), it is a **deploy
pointer** rather than merge-accumulated history — it can move to any ref,
including **backward for rollback** (dispatch with an older tag or SHA). The
`prod` git history is not load-bearing: CF Pages deploys the tree at HEAD.

**Approval gate.** The job runs under the `production` GitHub Environment,
configured with a required reviewer. Every dispatch **waits on one
approve-click** before it publishes the apex. The run name reflects the ref and
the run summary records the promoted SHA — the audit trail of what was released
when and by whom now lives in the repo's Actions history.

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

b. **Configure the two environments.** Set the **production branch to `prod`**.
   Leave `main` as a preview branch and attach the custom domain
   `beta.shukelabs.com` to it. Pinning a custom domain to a *non-production*
   branch is done by DNS, not the Pages "custom domains" UI alone: register
   `beta.shukelabs.com` on the project, then point its DNS CNAME at the **branch
   alias** `main.shuke-labs-beta.pages.dev` (not the root `shuke-labs-beta.pages.dev`,
   which always tracks production) and keep the record **proxied** — an
   unproxied/external record silently falls back to production. The `main.*`
   branch alias only exists once `main` is a preview branch *and* has a preview
   deployment, so flip the production branch and trigger a `main` build before
   repointing beta. D1-prod/D1-beta bindings belong to the like-counter work
   (#93/#97) and are not configured yet.

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
   already on Cloudflare, so this is a zone-internal record change (apex A
   record → proxied CNAME to `shuke-labs-beta.pages.dev`, the production alias).
   This is the moment the apex stops serving from GitHub Pages.

   **Gotcha — purge the cache to break the validation chicken-and-egg.** The
   apex Pages custom domain uses HTTP validation. Right after the DNS cut the
   edge may keep serving the *stale cached GitHub Pages response* (headers still
   carry `x-github-request-id` / Fastly `age`), so the validation challenge
   never reaches CF Pages and the domain sticks at `status: pending`. Purge the
   zone cache (`purge_everything`) once — the edge re-fetches from Pages, the
   challenge resolves, and the domain flips to `active` within seconds.

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
