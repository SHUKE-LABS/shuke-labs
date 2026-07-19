# `shukelabs-like` — post like-counter Worker

Standalone Cloudflare Worker + D1 backing the blog's anonymous global "like"
(issue #93, isolated per environment in #97). It is deployed **independently**
of the Astro site — the site is a static build on GitHub Pages (prod) and
Cloudflare Pages (beta); both origins hit this one Worker, which routes each
request to its environment's namespace by request Origin so beta and prod counts
stay separate.

See [`../docs/like-counter.md`](../docs/like-counter.md) for the full design
(slug↔post mapping, client behaviour, the #80 A/B signal).

## API

| Method | Path          | Response         | Effect                             |
| ------ | ------------- | ---------------- | ---------------------------------- |
| `GET`  | `/like/:slug` | `{ slug, count }` | current count (0 if never liked)   |
| `POST` | `/like/:slug` | `{ slug, count }` | atomic increment, returns new count |

`:slug` is the Astro content-collection id (post filename without extension).
The environment (`prod` | `beta`) is resolved from the request `Origin` and the
count is stored per `(env, slug)`, so a like on one origin never affects the
other. CORS allows `https://shukelabs.com` and `https://beta.shukelabs.com`; a
request with any other Origin — or none — is rejected with `403`.

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

Requests need a recognised `Origin` header (a browser sends one automatically on
the cross-origin fetch; curl must pass it explicitly, or the Worker returns
`403`):

```bash
curl -H 'Origin: https://shukelabs.com' \
  https://like.shukelabs.com/like/manifesto-why-this-blog          # -> {"slug":"...","count":0}
curl -X POST -H 'Origin: https://shukelabs.com' \
  https://like.shukelabs.com/like/manifesto-why-this-blog          # -> {"slug":"...","count":1}
```

Swap the Origin for `https://beta.shukelabs.com` to exercise the beta namespace;
the two counts move independently. Counts live in D1 and survive Worker redeploys.
