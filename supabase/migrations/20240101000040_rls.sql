-- Enable RLS on every application table.
ALTER TABLE api.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.card_slug_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.platform_state ENABLE ROW LEVEL SECURITY;

ALTER TABLE private.queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.publication_gate ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.processed_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.dispatch_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.totp_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.recovery_codes_used ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.abuse_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.alert_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.retention_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.migration_ledger ENABLE ROW LEVEL SECURITY;

-- The platform-state policy is created by an earlier migration.
DROP POLICY IF EXISTS "anon_read_platform_state" ON api.platform_state;

-- Public API schema policies.
CREATE POLICY "anon_read_active_cards"
  ON api.cards
  FOR SELECT
  TO anon
  USING (status = 'active');

CREATE POLICY "authenticated_read_active_cards"
  ON api.cards
  FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "anon_read_published_messages"
  ON api.messages
  FOR SELECT
  TO anon
  USING (status = 'published');

CREATE POLICY "authenticated_read_published_messages"
  ON api.messages
  FOR SELECT
  TO authenticated
  USING (status = 'published');

CREATE POLICY "anon_read_card_aliases"
  ON api.card_slug_aliases
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "authenticated_read_card_aliases"
  ON api.card_slug_aliases
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "anon_read_platform_state"
  ON api.platform_state
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "authenticated_read_platform_state"
  ON api.platform_state
  FOR SELECT
  TO authenticated
  USING (true);

-- Private schema policies: explicit defense-in-depth denials for both public roles.
CREATE POLICY "deny_anon_queue_items"
  ON private.queue_items
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_queue_items"
  ON private.queue_items
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_publication_gate"
  ON private.publication_gate
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_publication_gate"
  ON private.publication_gate
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_idempotency_keys"
  ON private.idempotency_keys
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_idempotency_keys"
  ON private.idempotency_keys
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_processed_deliveries"
  ON private.processed_deliveries
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_processed_deliveries"
  ON private.processed_deliveries
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_dispatch_outbox"
  ON private.dispatch_outbox
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_dispatch_outbox"
  ON private.dispatch_outbox
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_reports"
  ON private.reports
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_reports"
  ON private.reports
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_admin_users"
  ON private.admin_users
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_admin_users"
  ON private.admin_users
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_admin_sessions"
  ON private.admin_sessions
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_admin_sessions"
  ON private.admin_sessions
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_totp_steps"
  ON private.totp_steps
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_totp_steps"
  ON private.totp_steps
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_recovery_codes_used"
  ON private.recovery_codes_used
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_recovery_codes_used"
  ON private.recovery_codes_used
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_abuse_buckets"
  ON private.abuse_buckets
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_abuse_buckets"
  ON private.abuse_buckets
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_security_events"
  ON private.security_events
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_security_events"
  ON private.security_events
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_alert_outbox"
  ON private.alert_outbox
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_alert_outbox"
  ON private.alert_outbox
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_audit_log"
  ON private.audit_log
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_audit_log"
  ON private.audit_log
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_retention_ledger"
  ON private.retention_ledger
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_retention_ledger"
  ON private.retention_ledger
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_migration_ledger"
  ON private.migration_ledger
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_migration_ledger"
  ON private.migration_ledger
  FOR ALL TO authenticated USING (false) WITH CHECK (false);
