CREATE TABLE api.platform_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configured_interval_ms integer NOT NULL DEFAULT 5000,
  emergency_mode boolean NOT NULL DEFAULT false,
  degraded_mode boolean NOT NULL DEFAULT false,
  last_published_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_platform_state_singleton ON api.platform_state ((true));

INSERT INTO api.platform_state (id) VALUES (gen_random_uuid());

CREATE TRIGGER set_platform_state_updated_at
  BEFORE UPDATE ON api.platform_state
  FOR EACH ROW
  EXECUTE FUNCTION private.update_updated_at();

ALTER TABLE api.platform_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_platform_state"
  ON api.platform_state
  FOR SELECT
  TO anon
  USING (true);

ALTER TABLE api.platform_state OWNER TO postgres;
REVOKE ALL ON api.platform_state FROM PUBLIC, authenticated;
GRANT SELECT ON api.platform_state TO anon;

CREATE TABLE IF NOT EXISTS private.migration_ledger (
  id serial PRIMARY KEY,
  migration_name text NOT NULL UNIQUE,
  applied_at timestamptz NOT NULL DEFAULT now(),
  checksum text NOT NULL
);

REVOKE ALL ON private.migration_ledger FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.migration_ledger TO service_role;
GRANT ALL ON SEQUENCE private.migration_ledger_id_seq TO service_role;
