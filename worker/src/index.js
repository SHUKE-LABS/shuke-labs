// Standalone Cloudflare Worker backing the blog's anonymous global "like"
// counter (issue #93), isolated per environment (#97). One D1-backed counter
// per (environment, post slug). The environment is resolved from the request
// Origin so beta preview clicks never inflate the prod count or #80's A/B
// signal — beta likes land in the beta namespace, prod likes in the prod one.
//
//   GET  /like/:slug -> { slug, count }   current count (0 if never liked)
//   POST /like/:slug -> { slug, count }   atomic increment, returns new count
//
// The slug is the Astro content-collection id (the post filename without
// extension) — see docs/like-counter.md.

// Origin -> environment. Only these two origins are recognised; anything else
// (including a same-origin curl with no Origin header) is rejected, which is
// what keeps each environment's store free of the other's writes. CORS already
// blocks unknown browser origins; the reject closes the curl path too.
const ORIGIN_ENV = new Map([
  ['https://shukelabs.com', 'prod'],
  ['https://beta.shukelabs.com', 'beta'],
]);

function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && ORIGIN_ENV.has(origin)) {
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

    // Preflight is answered before the Origin gate so an unknown-origin browser
    // still gets its 204 (CORS-less, so the actual request is then blocked by
    // the browser) rather than a 403 at preflight.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Resolve the environment from the Origin; reject anything unrecognised so
    // each namespace only ever receives its own environment's likes.
    const environment = origin ? ORIGIN_ENV.get(origin) : undefined;
    if (!environment) {
      return json({ error: 'forbidden' }, 403, origin);
    }

    // Route: /like/:slug — slug may contain any non-slash characters.
    const match = pathname.match(/^\/like\/([^/]+)\/?$/);
    if (!match) {
      return json({ error: 'not found' }, 404, origin);
    }
    const slug = decodeURIComponent(match[1]);

    if (request.method === 'GET') {
      const row = await env.DB.prepare(
        'SELECT count FROM likes WHERE env = ? AND slug = ?',
      )
        .bind(environment, slug)
        .first();
      return json({ slug, count: row ? row.count : 0 }, 200, origin);
    }

    if (request.method === 'POST') {
      // Atomic upsert: the single INSERT ... ON CONFLICT ... RETURNING is one
      // statement, so concurrent likes never lose an increment.
      const row = await env.DB.prepare(
        'INSERT INTO likes (env, slug, count) VALUES (?, ?, 1) ' +
          'ON CONFLICT(env, slug) DO UPDATE SET count = count + 1 RETURNING count',
      )
        .bind(environment, slug)
        .first();
      return json({ slug, count: row.count }, 200, origin);
    }

    return json({ error: 'method not allowed' }, 405, origin);
  },
};
