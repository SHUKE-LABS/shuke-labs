# Post like counter

An anonymous, global "like" on blog posts (issue #93): a real cross-visitor
count, not a per-browser toggle. Deliberately the lightest thing that works — no
accounts, no comments, no analytics pipeline.

## Architecture

The site is a static Astro build served from two hosts (prod on GitHub Pages,
beta on Cloudflare Pages). The counter lives in a **standalone Cloudflare
Worker** backed by **D1**, on a stable, host-independent URL
(`like.shukelabs.com`). Both hosts' pages hit that one Worker, so prod and beta
**share a single counter**.

```
blog post page (prod or beta)
        │  GET/POST https://like.shukelabs.com/like/:slug
        ▼
  shukelabs-like Worker  ──►  D1 table `likes (slug PRIMARY KEY, count)`
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

The increment is a single `INSERT ... ON CONFLICT(slug) DO UPDATE SET count =
count + 1 RETURNING count`, so concurrent likes never lose a write. CORS allows
the prod and beta origins only.

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

localStorage dedup **only**. The endpoint is publicly curl-able and has no
per-IP or rate limiting — an accepted tradeoff for a small blog. Hardening is
out of scope for v1; revisit if abuse appears.

## Engagement signal for the #80 A/B

Each published post records its topic-sourcing track in a `topicSource`
(`agent | shuke`) frontmatter field (see the blog-cadence section of the
[README](../README.md)). Because the like counter is keyed by the same slug,
`GET /like/:slug` gives a per-post engagement number that can be correlated with
`topicSource` when comparing the two tracks. It is a noisy, qualitative signal —
there is no analytics pipeline — but it turns #80's otherwise purely qualitative
read into one with a real (if rough) number attached.

## Deploy

The Worker is provisioned and deployed independently of the site — see
[`../worker/README.md`](../worker/README.md). Provisioning shuke's D1 database,
running `wrangler deploy`, and pointing `like.shukelabs.com` DNS are one-time
operator steps on the Cloudflare account.
