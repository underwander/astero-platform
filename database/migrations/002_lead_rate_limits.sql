CREATE TABLE IF NOT EXISTS lead_rate_limits (
  key_hash CHAR(64) PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  window_started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS lead_rate_limits_expires_at_idx ON lead_rate_limits (expires_at);

ALTER TABLE lead_rate_limits ENABLE ROW LEVEL SECURITY;
