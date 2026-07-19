-- D1 schema for the public idea-submission intake Worker (issue #14). The
-- Worker is the sole owner of this database; the site never touches it and no
-- GitHub credential is involved.
--
-- `submissions` holds one row per accepted-into-queue idea. At submit time the
-- Worker fills id / created_at / ip_hash / input / input_hash / quota_state and
-- sets status='pending'; the audit ticket (#100) later fills security_verdict,
-- scope_reason, decision, and authored_reason via /internal/verdict. Those
-- audit-owned columns stay NULL (rendered as "pending" on the receipt) until it
-- runs. `id` is an unguessable UUID — the only handle to the public receipt.
-- A verdict of decision='deferred' (audit #100, acceptance-quota full) writes an
-- authored reason but leaves status='pending', so the row is re-judged next run.
CREATE TABLE IF NOT EXISTS submissions (
  id               TEXT    NOT NULL PRIMARY KEY,
  created_at       TEXT    NOT NULL,
  ip_hash          TEXT    NOT NULL,
  input            TEXT    NOT NULL,
  input_hash       TEXT    NOT NULL,
  status           TEXT    NOT NULL DEFAULT 'pending',
  quota_state      TEXT    NOT NULL,
  security_verdict TEXT,
  scope_reason     TEXT,
  decision         TEXT,
  authored_reason  TEXT
);

-- Index the queue read (/internal/pending) by status + arrival order.
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions (status, created_at);

-- Daily submission quota, per scope. Two scope kinds share the table:
--   'global'      — the site-wide daily cap across all submitters
--   'ip:<hash>'   — one submitter's daily cap (ip_hash, never the raw IP)
-- `day` is the UTC date (YYYY-MM-DD); the (scope, day) pair rolls the count
-- over at midnight without a cleanup job. The Worker increments with the same
-- atomic INSERT ... ON CONFLICT ... RETURNING idiom as the like counter, so
-- concurrent submits never lose a count.
CREATE TABLE IF NOT EXISTS quota (
  scope TEXT    NOT NULL,
  day   TEXT    NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (scope, day)
);
