// Site-wide runtime constants baked into the static build.

// Base URL of the standalone like-counter Worker (issue #93). One endpoint for
// both prod and beta, so they share a single counter. See docs/like-counter.md
// and the worker/ directory.
export const LIKE_ENDPOINT = 'https://like.shukelabs.com';
