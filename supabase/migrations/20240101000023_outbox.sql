-- Transactional dispatch outbox (private schema)
CREATE TABLE private.dispatch_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Payload
  event_type text NOT NULL,
  payload jsonb NOT NULL,

  -- Delivery state
  dispatched boolean NOT NULL DEFAULT false,
  dispatched_at timestamptz,
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,

  -- Timing
  created_at timestamptz NOT NULL DEFAULT now(),
  scheduled_for timestamptz NOT NULL DEFAULT now(),

  -- Idempotency
  dedup_key text NOT NULL UNIQUE,

  CONSTRAINT valid_event_type CHECK (event_type IN ('publish_next', 'rescue', 'retry'))
);

-- Index for pending dispatches
CREATE INDEX idx_outbox_pending ON private.dispatch_outbox (scheduled_for ASC)
  WHERE dispatched = false;

-- Function to create outbox entry atomically
CREATE OR REPLACE FUNCTION private.create_dispatch(
  p_event_type text,
  p_payload jsonb,
  p_dedup_key text,
  p_scheduled_for timestamptz DEFAULT now()
)
RETURNS uuid AS $$
DECLARE
  outbox_id uuid;
BEGIN
  INSERT INTO private.dispatch_outbox (event_type, payload, dedup_key, scheduled_for)
  VALUES (p_event_type, p_payload, p_dedup_key, p_scheduled_for)
  ON CONFLICT (dedup_key) DO NOTHING
  RETURNING id INTO outbox_id;

  -- If conflict, get existing
  IF outbox_id IS NULL THEN
    SELECT id INTO outbox_id
    FROM private.dispatch_outbox
    WHERE dedup_key = p_dedup_key;
  END IF;

  RETURN outbox_id;
END;
$$ LANGUAGE plpgsql
SET search_path = pg_catalog, private;

REVOKE ALL ON private.dispatch_outbox FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.dispatch_outbox TO service_role;

-- Revoke public access
REVOKE ALL ON FUNCTION private.create_dispatch(text, jsonb, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.create_dispatch(text, jsonb, text, timestamptz)
  TO service_role;
