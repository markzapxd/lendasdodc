-- Append-only audit log (private schema)
CREATE TABLE private.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor
  admin_id uuid REFERENCES private.admin_users(id),
  session_id uuid,

  -- Action
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,

  -- Details
  old_values jsonb,
  new_values jsonb,
  metadata jsonb NOT NULL DEFAULT '{}',

  -- Timing
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_action CHECK (action IN (
    'admin.login', 'admin.logout', 'admin.password_change', 'admin.totp_rotate',
    'admin.recovery_use', 'admin.break_glass',
    'card.create', 'card.update', 'card.archive', 'card.restore', 'card.delete',
    'message.remove', 'message.restore',
    'report.create', 'report.resolve', 'report.dismiss',
    'settings.update', 'emergency.toggle', 'interval.change',
    'block.create', 'block.remove'
  ))
);

-- Index for audit queries
CREATE INDEX idx_audit_admin ON private.audit_log (admin_id, created_at DESC);
CREATE INDEX idx_audit_action ON private.audit_log (action, created_at DESC);
CREATE INDEX idx_audit_resource ON private.audit_log (resource_type, resource_id);

-- Prevent UPDATE and DELETE on audit log
CREATE OR REPLACE FUNCTION private.prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_no_update
  BEFORE UPDATE ON private.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_audit_modification();

CREATE TRIGGER audit_no_delete
  BEFORE DELETE ON private.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_audit_modification();

-- Retention ledger
CREATE TABLE private.retention_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was purged
  table_name text NOT NULL,
  rows_purged integer NOT NULL,
  oldest_purged timestamptz,
  newest_purged timestamptz,

  -- When
  purged_at timestamptz NOT NULL DEFAULT now(),

  -- Legal hold
  legal_hold boolean NOT NULL DEFAULT false
);
