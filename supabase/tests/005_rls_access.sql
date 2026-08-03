BEGIN;
SELECT plan(15);

-- Seed a valid referenced card for the service-role insert test.
INSERT INTO api.cards (name) VALUES ('RLS Test Card');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'api' AND c.relname = 'cards'),
  'RLS enabled on api.cards'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'api' AND c.relname = 'messages'),
  'RLS enabled on api.messages'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'private' AND c.relname = 'queue_items'),
  'RLS enabled on private.queue_items'
);

SELECT lives_ok(
  $$SET LOCAL ROLE anon; SELECT count(*) FROM api.cards; SET LOCAL ROLE postgres$$,
  'anon can read api.cards'
);

SELECT lives_ok(
  $$SET LOCAL ROLE anon; SELECT count(*) FROM api.messages WHERE status = 'published'; SET LOCAL ROLE postgres$$,
  'anon can read published api.messages'
);

SELECT throws_ok(
  $$SET LOCAL ROLE anon; SELECT count(*) FROM private.queue_items; SET LOCAL ROLE postgres$$,
  '42501',
  NULL,
  'anon cannot read private.queue_items'
);

SELECT throws_ok(
  $$SET LOCAL ROLE anon; SELECT count(*) FROM private.admin_users; SET LOCAL ROLE postgres$$,
  '42501',
  NULL,
  'anon cannot read private.admin_users'
);

SELECT throws_ok(
  $$SET LOCAL ROLE anon; SELECT count(*) FROM private.audit_log; SET LOCAL ROLE postgres$$,
  '42501',
  NULL,
  'anon cannot read private.audit_log'
);

SELECT throws_ok(
  $$SET LOCAL ROLE anon; INSERT INTO api.cards (name) VALUES ('hacked'); SET LOCAL ROLE postgres$$,
  '42501',
  NULL,
  'anon cannot insert into api.cards'
);

SELECT throws_ok(
  $$SET LOCAL ROLE anon; UPDATE api.cards SET name = 'hacked'; SET LOCAL ROLE postgres$$,
  '42501',
  NULL,
  'anon cannot update api.cards'
);

SELECT throws_ok(
  $$SET LOCAL ROLE anon; DELETE FROM api.cards; SET LOCAL ROLE postgres$$,
  '42501',
  NULL,
  'anon cannot delete api.cards'
);

SELECT lives_ok(
  $$SET LOCAL ROLE service_role; SELECT count(*) FROM private.queue_items; SET LOCAL ROLE postgres$$,
  'service_role can read private.queue_items'
);

SELECT lives_ok(
  $$SET LOCAL ROLE service_role;
    INSERT INTO private.queue_items
      (session_hmac, content_hash, card_id, idempotency_key, receipt_hash, content_hmac)
    VALUES
      ('test', 'test', (SELECT id FROM api.cards LIMIT 1), 'test', 'test', 'test');
    SET LOCAL ROLE postgres$$,
  'service_role can insert into private.queue_items'
);

SELECT ok(
  (SELECT count(*) FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'api' AND tablename = 'cards') > 0,
  'api.cards is in realtime publication'
);

SELECT is(
  (SELECT count(*)::integer FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'private'),
  0,
  'no private tables in realtime publication'
);

SELECT * FROM finish();
ROLLBACK;
