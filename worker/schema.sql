-- D1 schema for the anonymous per-post like counter (issue #93).
-- One row per post slug (the Astro content-collection id). The POST handler's
-- upsert relies on slug being the primary key for its ON CONFLICT clause.
CREATE TABLE IF NOT EXISTS likes (
  slug  TEXT    PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);
