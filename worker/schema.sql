-- D1 schema for the anonymous per-post like counter (issue #93, isolated per
-- environment in #97). One row per (environment, post slug): beta and prod
-- likes for the same slug are distinct keys and never collide. `env` is
-- resolved from the request Origin in the Worker (prod | beta). The POST
-- handler's upsert relies on (env, slug) being the primary key for its
-- ON CONFLICT clause.
CREATE TABLE IF NOT EXISTS likes (
  env   TEXT    NOT NULL,
  slug  TEXT    NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (env, slug)
);
