-- Permanent idempotency table (private schema)
CREATE TABLE private.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL UNIQUE,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

-- Index for cleanup
CREATE INDEX idx_idempotency_expiry ON private.idempotency_keys (expires_at);

-- Processed QStash deliveries
CREATE TABLE private.processed_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id text NOT NULL UNIQUE,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Index for cleanup
CREATE INDEX idx_deliveries_expiry ON private.processed_deliveries (processed_at);

REVOKE ALL ON private.idempotency_keys, private.processed_deliveries
  FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.idempotency_keys, private.processed_deliveries TO service_role;
