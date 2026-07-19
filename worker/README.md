# `shukelabs-like` — post like-counter Worker

Standalone Cloudflare Worker + D1 backing the blog's anonymous global "like"
(issue #93). It is deployed **independently** of the Astro site — the site is a
static build on GitHub Pages (prod) and Cloudflare Pages (beta); this Worker
holds the one shared counter both origins hit.

See [`../docs/like-counter.md`](../docs/like-counter.md) for the full design
(slug↔post mapping, client behaviour, the #80 A/B signal).

## API

| Method | Path          | Response         | Effect                             |
| ------ | ------------- | ---------------- | ---------------------------------- |
| `GET`  | `/like/:slug` | `{ slug, count }` | current count (0 if never liked)   |
| `POST` | `/like/:slug` | `{ slug, count }` | atomic increment, returns new count |

`:slug` is the Astro content-collection id (post filename without extension).
CORS allows `https://shukelabs.com` and `https://beta.shukelabs.com`.

## One-time provisioning + deploy

Run from this `worker/` directory with `wrangler` (`npx wrangler ...`); requires
a Cloudflare account with D1 and the `like.shukelabs.com` DNS in the same zone.

```bash
# 1. Create the D1 database, then paste the printed database_id into
#    wrangler.toml (replaces REPLACE_WITH_D1_DATABASE_ID).
npx wrangler d1 create shukelabs-like

# 2. Apply the schema to the remote database.
npx wrangler d1 execute shukelabs-like --remote --file=./schema.sql

# 3. Deploy the Worker (binds the custom domain like.shukelabs.com).
npx wrangler deploy
```

The custom-domain route in `wrangler.toml` provisions `like.shukelabs.com`
automatically when the zone is on the same Cloudflare account; otherwise point
a CNAME at the Worker manually.

## Verify

```bash
curl https://like.shukelabs.com/like/manifesto-why-this-blog          # -> {"slug":"...","count":0}
curl -X POST https://like.shukelabs.com/like/manifesto-why-this-blog  # -> {"slug":"...","count":1}
```

Counts live in D1 and survive Worker redeploys.
