CREATE TABLE IF NOT EXISTS private.migration_ledger (
  id serial PRIMARY KEY,
  migration_name text NOT NULL UNIQUE,
  applied_at timestamptz NOT NULL DEFAULT now(),
  checksum text NOT NULL
);

REVOKE ALL ON private.migration_ledger FROM PUBLIC;
GRANT ALL ON private.migration_ledger TO service_role;
