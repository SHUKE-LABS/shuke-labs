// Thin adapter over #14's intake Worker /internal/* seam (issue #100). The only
// two calls the audit makes against the receipt store: read the pending queue,
// write a verdict back. Bearer-authed with the shared INTERNAL_SECRET.

/**
 * @param {string} endpoint - IDEAS_ENDPOINT base URL (e.g. https://ideas.shukelabs.com)
 * @param {string} secret   - shared INTERNAL_SECRET (Bearer)
 * @returns {Promise<Array<{id,created_at,input,input_hash}>>}
 */
export async function fetchPending(endpoint, secret) {
  const res = await fetch(`${endpoint}/internal/pending`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!res.ok) throw new Error(`/internal/pending -> ${res.status}`);
  const data = await res.json();
  return data.pending || [];
}

/**
 * @param {string} endpoint
 * @param {string} secret
 * @param {{id,security_verdict,scope_reason,decision,authored_reason}} verdict
 */
export async function writeVerdict(endpoint, secret, verdict) {
  const res = await fetch(`${endpoint}/internal/verdict`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(verdict),
  });
  if (!res.ok) throw new Error(`/internal/verdict ${verdict.id} -> ${res.status}`);
  return res.json();
}
