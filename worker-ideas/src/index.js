// Standalone Cloudflare Worker backing the public idea-submission intake (issue
// #14) — the front half of the idea → AI-review pipeline. It is deployed
// independently of the Astro site and separately from the `shukelabs-like`
// Worker (its own D1, its own secrets, its own blast radius).
//
//   POST /submit            Turnstile-gated, quota-capped intake -> { id, receiptUrl }
//   GET  /idea/:id          public HTML receipt for an unguessable submission id
//   GET  /internal/pending  (shared-secret) list pending submissions
//   POST /internal/verdict  (shared-secret) write the audit verdict onto a row
//
// This Worker makes NO value judgement — it stores submissions as `pending` and
// hands an honest mechanical receipt back. The AI accept/reject decision is the
// audit ticket (#100), which reaches this store only through /internal/*. The
// Worker holds zero GitHub credentials and never writes to GitHub.

// Origin -> environment, same gate as the like Worker: the /submit endpoint is
// only callable from the site's own origins. A request with any other Origin,
// or none (a bare curl), is rejected — CORS blocks unknown browser origins and
// the gate closes the curl path. /idea/:id (top-level navigation) and
// /internal/* (server-to-server, bearer-authed) are deliberately NOT gated.
const ORIGIN_ENV = new Map([
  ['https://shukelabs.com', 'prod'],
  ['https://beta.shukelabs.com', 'beta'],
]);

// Free-text bounds and daily quota caps. Turnstile + these bounds reject before
// the quota step, so spam/malformed attempts never consume a submitter's quota.
const MAX_INPUT_CHARS = 2000;
const PER_IP_DAILY_CAP = 5;
const GLOBAL_DAILY_CAP = 200;

function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

function html(body, status) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

// SHA-256 -> lowercase hex. Used for both the input hash (shown on the receipt)
// and the salted IP hash (the quota key; the raw IP is never stored).
async function sha256hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Cloudflare's Turnstile siteverify. Single-use token: called exactly once per
// submit, before the quota step, so a failed challenge never touches quota.
async function verifyTurnstile(secret, token, ip) {
  if (!token) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body: form },
    );
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

// Read one scope's count for the day. Returns 0 if the row doesn't exist yet.
async function quotaCount(env, scope, day) {
  const row = await env.DB.prepare(
    'SELECT count FROM quota WHERE scope = ? AND day = ?',
  )
    .bind(scope, day)
    .first();
  return row ? row.count : 0;
}

// Atomic +1 for one scope/day, same upsert idiom as the like counter so
// concurrent submits never lose a count.
async function bumpQuota(env, scope, day) {
  await env.DB.prepare(
    'INSERT INTO quota (scope, day, count) VALUES (?, ?, 1) ' +
      'ON CONFLICT(scope, day) DO UPDATE SET count = count + 1',
  )
    .bind(scope, day)
    .run();
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// The public receipt. Audit-owned fields (security verdict, scope reason,
// decision, authored reason) render as "pending" until the audit ticket writes
// them via /internal/verdict — so the shareable receipt shows *why*, not just a
// bare yes/no, once the review runs.
function receiptHtml(row) {
  const pending = '<span style="color:#b45309">pending review</span>';
  const field = (label, value) =>
    `<tr><th style="text-align:left;padding:6px 16px 6px 0;vertical-align:top;color:#6b7280;font-weight:600">${label}</th>` +
    `<td style="padding:6px 0;vertical-align:top">${value == null || value === '' ? pending : escapeHtml(value)}</td></tr>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Idea receipt · ${escapeHtml(row.id)}</title>
<style>
  body{font:16px/1.6 system-ui,sans-serif;color:#111827;background:#f9fafb;margin:0;padding:2rem 1rem}
  main{max-width:720px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:2rem}
  h1{font-size:1.4rem;margin:0 0 .25rem}
  p.sub{color:#6b7280;margin:0 0 1.5rem}
  pre{white-space:pre-wrap;word-break:break-word;background:#f3f4f6;border-radius:8px;padding:1rem;margin:0}
  table{border-collapse:collapse;width:100%;font-size:.95rem}
  .gate{margin-top:1.5rem;padding:1rem;border:1px dashed #d1d5db;border-radius:8px;color:#374151}
</style>
</head>
<body>
<main>
  <h1>Your idea is in the review queue</h1>
  <p class="sub">This is a mechanical receipt. Review is asynchronous — bookmark this page; it fills in as the review runs.</p>
  <table>
    ${field('Submitted', row.created_at)}
    ${field('Input hash', row.input_hash)}
    ${field('Quota state', row.quota_state)}
    ${field('Status', row.status)}
    ${field('Security verdict', row.security_verdict)}
    ${field('Scope reason', row.scope_reason)}
    ${field('Decision', row.decision)}
    ${field('Reason', row.authored_reason)}
  </table>
  <h2 style="font-size:1rem;margin:1.5rem 0 .5rem;color:#6b7280">Your idea</h2>
  <pre>${escapeHtml(row.input)}</pre>
  <div class="gate">This pipeline stops at a <strong>human merge gate</strong>: even an accepted idea is only ever merged by a person. No change is applied autonomously.</div>
</main>
</body>
</html>`;
}

// Identical 404 for both an unknown id and a malformed path, so the unguessable
// id cannot be probed by shape — a wrong guess and a wrong format look the same.
function receiptNotFound() {
  return html(
    '<!doctype html><meta charset="utf-8"><title>Not found</title>' +
      '<p style="font:16px system-ui,sans-serif;padding:2rem">No receipt found for that link.</p>',
    404,
  );
}

// Constant-form bearer check for the /internal/* audit seam.
function internalAuthorized(request, env) {
  const header = request.headers.get('Authorization') || '';
  return env.INTERNAL_SECRET && header === `Bearer ${env.INTERNAL_SECRET}`;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // --- Public receipt: GET /idea/:id -------------------------------------
    const receiptMatch = pathname.match(/^\/idea\/([^/]+)\/?$/);
    if (receiptMatch) {
      if (request.method !== 'GET') return receiptNotFound();
      const id = decodeURIComponent(receiptMatch[1]);
      const row = await env.DB.prepare('SELECT * FROM submissions WHERE id = ?')
        .bind(id)
        .first();
      // Not-found and malformed collapse to the same 404 (see receiptNotFound).
      return row ? html(receiptHtml(row), 200) : receiptNotFound();
    }

    // --- Audit seam: /internal/* (shared-secret, no Origin gate) -----------
    if (pathname === '/internal/pending' && request.method === 'GET') {
      if (!internalAuthorized(request, env)) return json({ error: 'unauthorized' }, 401);
      const { results } = await env.DB.prepare(
        "SELECT id, created_at, input, input_hash FROM submissions WHERE status = 'pending' ORDER BY created_at ASC",
      ).all();
      return json({ pending: results || [] }, 200);
    }

    if (pathname === '/internal/verdict' && request.method === 'POST') {
      if (!internalAuthorized(request, env)) return json({ error: 'unauthorized' }, 401);
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'malformed' }, 400);
      }
      const { id, security_verdict, scope_reason, decision, authored_reason } = body || {};
      if (!id || !decision) return json({ error: 'malformed' }, 400);
      // decision drives status: accepted | rejected leave the queue.
      const status = decision === 'accepted' ? 'accepted' : 'rejected';
      const res = await env.DB.prepare(
        'UPDATE submissions SET security_verdict = ?, scope_reason = ?, decision = ?, ' +
          'authored_reason = ?, status = ? WHERE id = ?',
      )
        .bind(
          security_verdict ?? null,
          scope_reason ?? null,
          decision,
          authored_reason ?? null,
          status,
          id,
        )
        .run();
      if (!res.meta.changes) return json({ error: 'not found' }, 404);
      return json({ id, status }, 200);
    }

    // --- Intake: POST /submit (Origin-gated to the site) -------------------
    if (pathname === '/submit') {
      if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405, origin);

      const environment = origin ? ORIGIN_ENV.get(origin) : undefined;
      if (!environment) return json({ error: 'forbidden' }, 403, origin);

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'malformed', receipt: 'Submission was malformed.' }, 400, origin);
      }

      // Sanitise + length-cap the free text. Empty or oversized -> malformed,
      // rejected before Turnstile/quota are touched.
      const input = typeof body.input === 'string' ? body.input.trim() : '';
      if (!input || input.length > MAX_INPUT_CHARS) {
        return json(
          { error: 'malformed', receipt: `Idea must be 1–${MAX_INPUT_CHARS} characters.` },
          400,
          origin,
        );
      }

      // Turnstile: exactly once, before quota. A failed challenge is spam and
      // never consumes the submitter's daily quota.
      const ip = request.headers.get('CF-Connecting-IP') || '';
      const ok = await verifyTurnstile(env.TURNSTILE_SECRET, body.turnstileToken, ip);
      if (!ok) {
        return json(
          { error: 'spam', receipt: 'Anti-bot check failed. Please retry.' },
          403,
          origin,
        );
      }

      // Per-IP + global daily quota. Read both before bumping either, so a hit
      // on one cap doesn't inflate the other's counter.
      const day = new Date().toISOString().slice(0, 10);
      const ipHash = await sha256hex(`${ip}:${env.INTERNAL_SECRET || ''}`);
      const ipScope = `ip:${ipHash}`;
      const ipCount = await quotaCount(env, ipScope, day);
      const globalCount = await quotaCount(env, 'global', day);
      if (ipCount >= PER_IP_DAILY_CAP || globalCount >= GLOBAL_DAILY_CAP) {
        return json(
          { error: 'quota-full', receipt: 'Daily submission limit reached. Try again tomorrow.' },
          429,
          origin,
        );
      }
      await bumpQuota(env, ipScope, day);
      await bumpQuota(env, 'global', day);

      // Store pending. id is the unguessable public handle.
      const id = crypto.randomUUID();
      const inputHash = await sha256hex(input);
      const quotaState = `ip ${ipCount + 1}/${PER_IP_DAILY_CAP}, global ${globalCount + 1}/${GLOBAL_DAILY_CAP}`;
      await env.DB.prepare(
        'INSERT INTO submissions (id, created_at, ip_hash, input, input_hash, status, quota_state) ' +
          "VALUES (?, ?, ?, ?, ?, 'pending', ?)",
      )
        .bind(id, new Date().toISOString(), ipHash, input, inputHash, quotaState)
        .run();

      const receiptUrl = `${new URL(request.url).origin}/idea/${id}`;
      return json({ id, receiptUrl }, 200, origin);
    }

    return json({ error: 'not found' }, 404, origin);
  },
};
