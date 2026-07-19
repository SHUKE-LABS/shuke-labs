// Site-wide runtime constants baked into the static build.

// Base URL of the standalone like-counter Worker (issue #93). One endpoint for
// both prod and beta; the Worker isolates their counts by request Origin (#97),
// so no second URL is needed. See docs/like-counter.md and the worker/ directory.
export const LIKE_ENDPOINT = 'https://like.shukelabs.com';
