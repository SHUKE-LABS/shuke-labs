// Verdict parsing for the idea audit (issue #100). Pure and fail-closed: any
// malformed, missing, or ambiguous model output resolves to a REJECT, never an
// accept. This is the structural guarantee that a prompt-injected or garbled
// model reply can never mint a public issue — the mint path (orchestrate.mjs)
// trusts only the object this returns.

const SECURITY = new Set(['benign', 'abuse']);
const SCOPE = new Set(['in-scope', 'out-of-scope']);
const VALUE = new Set(['worth', 'thin']);
const DECISION = new Set(['accept', 'reject']);

// A safe reason to show when the model gave us nothing usable. Kept on-voice
// (plain, honest) since it can surface on a public receipt.
const FALLBACK_REASON =
  'The review could not reach a clear decision on this one, so it did not go through. You are welcome to resubmit with a bit more detail.';

// Safe raw-report fallbacks for an accept whose ticket fields came back
// missing/garbled. The accept decision itself is still valid (the enums
// passed), so we mint anyway — but with honest placeholder spec text rather
// than trusting broken output. The delivery agent grounds and sharpens it.
const FALLBACK_OUT_OF_SCOPE =
  'Anything beyond what advances my-ai-team; the delivery agent sets the concrete boundary when grounding this.';
const FALLBACK_ACCEPTANCE = [
  'The accepted idea is delivered in a way the delivery agent verifies against the grounded plan.',
];

/**
 * Coerce a model-supplied acceptance list into clean non-empty strings.
 * @param {unknown} value
 * @returns {string[]}
 */
function cleanAcceptance(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s) => typeof s === 'string')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Extract the last fenced ```json block, else the last {...} object.
 * @param {string} text
 * @returns {string|null}
 */
function extractJsonBlock(text) {
  const fenced = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  if (fenced.length) return fenced[fenced.length - 1][1].trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) return text.slice(first, last + 1).trim();
  return null;
}

/**
 * Parse the model's reply into a validated verdict. Fail-closed to reject.
 *
 * @param {string} modelOutput - raw text from the judge
 * @returns {{ security: string, scope: string, value: string, decision: 'accept'|'reject', reason: string, valid: boolean }}
 */
export function parseVerdict(modelOutput) {
  const reject = (reason) => ({
    security: 'abuse',
    scope: 'out-of-scope',
    value: 'thin',
    decision: 'reject',
    reason: reason || FALLBACK_REASON,
    problem: '',
    outOfScope: '',
    acceptance: [],
    valid: false,
  });

  if (typeof modelOutput !== 'string' || !modelOutput.trim()) return reject();

  const block = extractJsonBlock(modelOutput);
  if (!block) return reject();

  let obj;
  try {
    obj = JSON.parse(block);
  } catch {
    return reject();
  }
  if (!obj || typeof obj !== 'object') return reject();

  const { security, scope, value, decision, reason, problem, outOfScope, acceptance } = obj;

  // Every enum must be present and known, and the decision must be internally
  // consistent with the axes — otherwise we don't trust it enough to accept.
  if (!SECURITY.has(security) || !SCOPE.has(scope) || !VALUE.has(value) || !DECISION.has(decision)) {
    return reject();
  }
  const shouldReject = security === 'abuse' || scope === 'out-of-scope' || value === 'thin';
  const consistentDecision = shouldReject ? 'reject' : decision;
  const cleanReason =
    typeof reason === 'string' && reason.trim() ? reason.trim() : FALLBACK_REASON;

  // Raw-report ticket fields are SECONDARY to the gate: they never affect the
  // accept/reject decision above, so a garbled ticket field cannot flip a
  // reject to an accept (or vice versa). Each falls back safely so a valid
  // accept still mints an honest raw report. The submitter-facing `reason`
  // seeds `problem` if the model gave none, keeping the ticket non-empty.
  const cleanProblem =
    typeof problem === 'string' && problem.trim() ? problem.trim() : cleanReason;
  const cleanOutOfScope =
    typeof outOfScope === 'string' && outOfScope.trim() ? outOfScope.trim() : FALLBACK_OUT_OF_SCOPE;
  const cleanCriteria = cleanAcceptance(acceptance);

  return {
    security,
    scope,
    value,
    decision: consistentDecision,
    reason: cleanReason,
    problem: cleanProblem,
    outOfScope: cleanOutOfScope,
    acceptance: cleanCriteria.length ? cleanCriteria : FALLBACK_ACCEPTANCE,
    valid: true,
  };
}

export { FALLBACK_REASON, FALLBACK_OUT_OF_SCOPE, FALLBACK_ACCEPTANCE };
