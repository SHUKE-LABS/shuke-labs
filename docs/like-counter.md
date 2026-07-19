# Post like counter

An anonymous, global "like" on blog posts (issue #93): a real cross-visitor
count, not a per-browser toggle. Deliberately the lightest thing that works — no
accounts, no comments, no analytics pipeline.

## Architecture

The site is a static Astro build served from two Cloudflare Pages
environments (prod and beta). The counter lives in a **standalone Cloudflare
Worker** backed by **D1**, on a stable, host-independent URL
(`like.shukelabs.com`). Both hosts' pages hit that one Worker, but each count is
**isolated per environment** (#97): the Worker resolves the environment from the
request `Origin` (`prod` for `shukelabs.com`, `beta` for `beta.shukelabs.com`)
and stores every count under `(env, slug)`. beta is a preview/review host, so
its test-clicks must not inflate the prod count or #80's A/B signal — only the
prod namespace counts toward display on `shukelabs.com` and toward #80.

A request with an unrecognised `Origin` — or none (e.g. a bare curl) — is
rejected with `403`, which is what guarantees the prod namespace only ever
receives prod-origin likes.

```
blog post page (prod or beta)
        │  GET/POST https://like.shukelabs.com/like/:slug   (browser sends Origin)
        ▼
  shukelabs-like Worker  ── Origin → env ──►  D1 table `likes (env, slug) PK`
        (prod → env='prod' rows,  beta → env='beta' rows — never collide)
```

- **Worker source + deploy**: [`../worker/`](../worker/) (`src/index.js`,
  `wrangler.toml`, `schema.sql`, `README.md`).
- **Client control**: [`../src/components/LikeButton.astro`](../src/components/LikeButton.astro),
  rendered by [`../src/pages/blog/[slug].astro`](../src/pages/blog/%5Bslug%5D.astro).
- **Endpoint constant**: `LIKE_ENDPOINT` in
  [`../src/config/site.ts`](../src/config/site.ts).

## API

| Method | Path          | Response          | Effect                              |
| ------ | ------------- | ----------------- | ----------------------------------- |
| `GET`  | `/like/:slug` | `{ slug, count }` | current count (0 if never liked)    |
| `POST` | `/like/:slug` | `{ slug, count }` | atomic increment, returns new count |

The increment is a single `INSERT ... ON CONFLICT(env, slug) DO UPDATE SET count
= count + 1 RETURNING count`, so concurrent likes never lose a write. `env` comes
from the request Origin. CORS allows the prod and beta origins only; any other
Origin (or none) gets `403`.

## The slug ↔ post mapping

The counter key is the post's **Astro content-collection id** — the Markdown
filename under `src/content/blog/` without its extension (e.g.
`manifesto-why-this-blog`). The post page passes it as `post.id`
(`<LikeButton slug={post.id} />`), which is the same value used for the post's
own `/blog/:slug` route. Rename a post file and its counter resets (a new key);
that is acceptable for this scale.

## Client behaviour

On load the control fetches the live count and renders it. On click it:

1. checks a per-slug `localStorage` flag (`like:<slug>`); if set, does nothing
   (same-browser re-likes suppressed),
2. sets the flag, flips the heart to the filled/liked state,
3. renders an optimistic +1, then `POST`s and reconciles to the Worker's
   authoritative count.

## Anti-abuse (v1)

localStorage dedup **only**. The endpoint is still curl-able by anyone who
passes a recognised `Origin` header (the Origin gate is environment routing, not
auth) and has no per-IP or rate limiting — an accepted tradeoff for a small blog.
Hardening is out of scope for v1; revisit if abuse appears.

## Engagement signal for the #80 A/B

Each published post records its topic-sourcing track in a `topicSource`
(`agent | shuke`) frontmatter field (see the blog-cadence section of the
[README](../README.md)). Because the like counter is keyed by the same slug,
`GET /like/:slug` from the **prod** origin gives a per-post engagement number
that can be correlated with `topicSource` when comparing the two tracks — beta
test-clicks are isolated (#97) and excluded. It is a noisy, qualitative signal —
there is no analytics pipeline — but it turns #80's otherwise purely qualitative
read into one with a real (if rough) number attached.

## Deploy

The Worker is provisioned and deployed independently of the site — see
[`../worker/README.md`](../worker/README.md). Provisioning shuke's D1 database,
running `wrangler deploy`, and pointing `like.shukelabs.com` DNS are one-time
operator steps on the Cloudflare account.
