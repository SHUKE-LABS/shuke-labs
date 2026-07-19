// Site-wide runtime constants baked into the static build.

// Base URL of the standalone like-counter Worker (issue #93). One endpoint for
// both prod and beta; the Worker isolates their counts by request Origin (#97),
// so no second URL is needed. See docs/like-counter.md and the worker/ directory.
export const LIKE_ENDPOINT = 'https://like.shukelabs.com';

// Base URL of the standalone idea-submission intake Worker (issue #14). One
// endpoint for both prod and beta; the Worker gates /submit by request Origin.
// See docs/idea-intake.md and the worker-ideas/ directory.
export const IDEAS_ENDPOINT = 'https://ideas.shukelabs.com';

// Public Cloudflare Turnstile site key for the idea form. Public by design (it
// ships in the page); the matching secret lives only in the Worker. Replace
// this placeholder with the real key once Turnstile is provisioned (see
// worker-ideas/README.md), then flip IDEA_SUBMISSION_ENABLED to reveal the form.
export const TURNSTILE_SITE_KEY = 'REPLACE_WITH_TURNSTILE_SITE_KEY';

// Feature flag for the public idea-submission form. Stays false until the
// Worker + Turnstile keys are provisioned and the audit ticket (#100) is live,
// so the form never ships in a broken (no-verdict, no-key) state.
export const IDEA_SUBMISSION_ENABLED = false;
