-- Singleton publication gate (private schema)
CREATE TABLE private.publication_gate (
  id integer PRIMARY KEY DEFAULT 1,

  -- Last published state
  last_published_at timestamptz,
  last_session_hmac text,

  -- Configuration
  interval_ms integer NOT NULL DEFAULT 5000,
  emergency_mode boolean NOT NULL DEFAULT false,

  -- Constraints
  CONSTRAINT single_row CHECK (id = 1),
  CONSTRAINT positive_interval CHECK (interval_ms > 0)
);

-- Insert default gate
INSERT INTO private.publication_gate (id) VALUES (1);

-- Function to check if publication is allowed
CREATE OR REPLACE FUNCTION private.can_publish()
RETURNS boolean AS $$
DECLARE
  gate private.publication_gate%ROWTYPE;
  time_since_last interval;
BEGIN
  -- Lock the gate row
  SELECT * INTO gate
  FROM private.publication_gate
  WHERE id = 1
  FOR UPDATE;

  -- Emergency mode blocks new publications
  IF gate.emergency_mode THEN
    RETURN false;
  END IF;

  -- First publication always allowed
  IF gate.last_published_at IS NULL THEN
    RETURN true;
  END IF;

  -- Check interval
  time_since_last := clock_timestamp() - gate.last_published_at;
  RETURN extract(epoch FROM time_since_last) * 1000 >= gate.interval_ms;
END;
$$ LANGUAGE plpgsql
SET search_path = pg_catalog, private;

REVOKE ALL ON private.publication_gate FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.publication_gate TO service_role;

-- Revoke public access
REVOKE ALL ON FUNCTION private.can_publish() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.can_publish() TO service_role;
