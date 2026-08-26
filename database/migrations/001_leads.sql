CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  telegram VARCHAR(64),
  country CHAR(2) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'qualified', 'closed', 'archived')),
  source VARCHAR(32) NOT NULL DEFAULT 'website',
  consent_given_at TIMESTAMPTZ NOT NULL,
  user_agent VARCHAR(500),
  referrer VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leads_message_length CHECK (char_length(message) BETWEEN 30 AND 3000)
);

CREATE TABLE IF NOT EXISTS lead_delivery_outbox (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel VARCHAR(24) NOT NULL CHECK (channel IN ('crm', 'telegram', 'email')),
  status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  last_error VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lead_id, channel)
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status, created_at DESC);
CREATE INDEX IF NOT EXISTS lead_outbox_pending_idx
  ON lead_delivery_outbox (next_attempt_at, created_at)
  WHERE status IN ('pending', 'failed', 'processing');

-- Supabase exposes public-schema tables through PostgREST. With no policies,
-- browser clients cannot read or mutate leads; the server-side database owner remains available.
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_delivery_outbox ENABLE ROW LEVEL SECURITY;
