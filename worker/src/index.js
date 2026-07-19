// Standalone Cloudflare Worker backing the blog's anonymous global "like"
// counter (issue #93). One D1-backed counter per post slug, shared across the
// prod (GitHub Pages) and beta (Cloudflare Pages) origins.
//
//   GET  /like/:slug -> { slug, count }   current count (0 if never liked)
//   POST /like/:slug -> { slug, count }   atomic increment, returns new count
//
// The slug is the Astro content-collection id (the post filename without
// extension) — see docs/like-counter.md.

// Origins allowed to read/write the counter from a browser. Same-origin curl
// bypasses CORS entirely; anti-abuse in v1 is client-side localStorage dedup
// only (documented tradeoff in the issue).
const ALLOWED_ORIGINS = new Set([
  'https://shukelabs.com',
  'https://beta.shukelabs.com',
]);

function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Route: /like/:slug — slug may contain any non-slash characters.
    const match = pathname.match(/^\/like\/([^/]+)\/?$/);
    if (!match) {
      return json({ error: 'not found' }, 404, origin);
    }
    const slug = decodeURIComponent(match[1]);

    if (request.method === 'GET') {
      const row = await env.DB.prepare(
        'SELECT count FROM likes WHERE slug = ?',
      )
        .bind(slug)
        .first();
      return json({ slug, count: row ? row.count : 0 }, 200, origin);
    }

    if (request.method === 'POST') {
      // Atomic upsert: the single INSERT ... ON CONFLICT ... RETURNING is one
      // statement, so concurrent likes never lose an increment.
      const row = await env.DB.prepare(
        'INSERT INTO likes (slug, count) VALUES (?, 1) ' +
          'ON CONFLICT(slug) DO UPDATE SET count = count + 1 RETURNING count',
      )
        .bind(slug)
        .first();
      return json({ slug, count: row.count }, 200, origin);
    }

    return json({ error: 'method not allowed' }, 405, origin);
  },
};
