BEGIN;
SELECT plan(10);

-- Test 1: Queue table exists
SELECT has_table('private', 'queue_items', 'queue_items table exists');

-- Test 2: Publication gate exists
SELECT has_table('private', 'publication_gate', 'publication_gate table exists');

-- Test 3: Idempotency table exists
SELECT has_table('private', 'idempotency_keys', 'idempotency_keys table exists');

-- Test 4: Outbox table exists
SELECT has_table('private', 'dispatch_outbox', 'dispatch_outbox table exists');

-- Test 5: Can insert queue items
SELECT lives_ok(
  $$INSERT INTO private.queue_items (
    session_hmac, content_hash, card_id, idempotency_key, receipt_hash, content_hmac
  ) VALUES
    (
      'test-session-hmac',
      'test-content-hash',
      (SELECT id FROM api.cards LIMIT 1),
      'test-idempotency-key',
      'test-receipt-hash',
      'test-content-hmac'
    ),
    (
      'test-session-hmac-2',
      'test-content-hash-2',
      (SELECT id FROM api.cards LIMIT 1),
      'test-idempotency-key-2',
      'test-receipt-hash-2',
      'test-content-hmac-2'
    )$$,
  'can insert queue items'
);

-- Test 6: Enqueue_seq is monotonic
SELECT ok(
  (SELECT enqueue_seq FROM private.queue_items ORDER BY enqueue_seq DESC LIMIT 1) >
  (SELECT enqueue_seq FROM private.queue_items ORDER BY enqueue_seq ASC LIMIT 1),
  'enqueue_seq is monotonic'
);

-- Test 7: One active pending per session (unique constraint)
SELECT throws_ok(
  $$INSERT INTO private.queue_items (
    session_hmac, content_hash, card_id, idempotency_key, receipt_hash, content_hmac, status
  ) VALUES (
    'test-session-hmac',
    'test-content-hash-3',
    (SELECT id FROM api.cards LIMIT 1),
    'test-idempotency-key-3',
    'test-receipt-hash-3',
    'test-content-hmac-3',
    'pending'
  )$$,
  '23505',
  NULL,
  'duplicate active pending per session is rejected'
);

-- Test 8: can_publish function exists
SELECT has_function('private', 'can_publish', 'can_publish function exists');

-- Test 9: create_dispatch function exists
SELECT has_function('private', 'create_dispatch', 'create_dispatch function exists');

-- Test 10: Publication gate has single row
SELECT is(
  (SELECT count(*) FROM private.publication_gate),
  1::bigint,
  'publication_gate has exactly one row'
);

SELECT * FROM finish();
ROLLBACK;
