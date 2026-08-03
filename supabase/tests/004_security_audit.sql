BEGIN;
SELECT plan(12);

-- Test 1: Reports table exists
SELECT has_table('private', 'reports', 'reports table exists');

-- Test 2: Admin users table exists
SELECT has_table('private', 'admin_users', 'admin_users table exists');

-- Test 3: Admin sessions table exists
SELECT has_table('private', 'admin_sessions', 'admin_sessions table exists');

-- Test 4: Audit log exists
SELECT has_table('private', 'audit_log', 'audit_log table exists');

-- Test 5: Can insert report
SELECT lives_ok(
  $$INSERT INTO private.reports (
    message_id, reporter_session_hmac, reason
  ) VALUES (
    (SELECT id FROM api.messages LIMIT 1),
    'test-reporter-hmac',
    'spam'
  )$$,
  'can insert report'
);

-- Test 6: Report status constraint works
SELECT throws_ok(
  $$INSERT INTO private.reports (
    message_id, reporter_session_hmac, reason, status
  ) VALUES (
    (SELECT id FROM api.messages LIMIT 1),
    'test-reporter-hmac-2',
    'spam',
    'invalid_status'
  )$$,
  '22P02',
  'invalid input value for enum private.report_status: "invalid_status"',
  'invalid report status is rejected'
);

-- Seed one row so both append-only trigger checks exercise a row-level trigger.
INSERT INTO private.audit_log (action, resource_type)
VALUES ('admin.login', 'admin');

-- Test 7: Audit log is append-only (update fails)
SELECT throws_ok(
  $$UPDATE private.audit_log SET action = 'hacked' WHERE true$$,
  'P0001',
  'Audit log is append-only',
  'audit log update is rejected'
);

-- Test 8: Audit log is append-only (delete fails)
SELECT throws_ok(
  $$DELETE FROM private.audit_log WHERE true$$,
  'P0001',
  'Audit log is append-only',
  'audit log delete is rejected'
);

-- Test 9: Admin session has expiry
SELECT has_column('private', 'admin_sessions', 'expires_at', 'admin session has expires_at');

-- Test 10: Abuse buckets table exists
SELECT has_table('private', 'abuse_buckets', 'abuse_buckets table exists');

-- Test 11: Security events table exists
SELECT has_table('private', 'security_events', 'security_events table exists');

-- Test 12: Retention ledger exists
SELECT has_table('private', 'retention_ledger', 'retention_ledger table exists');

SELECT * FROM finish();
ROLLBACK;
