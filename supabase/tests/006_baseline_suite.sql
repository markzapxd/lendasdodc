BEGIN;
SELECT plan(30);

SELECT has_schema('api', 'api schema exists');
SELECT has_schema('private', 'private schema exists');
SELECT has_table('api', 'cards', 'api.cards table exists');
SELECT has_table('api', 'messages', 'api.messages table exists');
SELECT has_table('private', 'queue_items', 'private.queue_items table exists');

SELECT is(
  (SELECT count(*)::int FROM api.cards),
  5,
  '5 fictional cards seeded'
);

SELECT is(
  (SELECT count(*)::int FROM api.messages WHERE status = 'published'),
  15,
  '15 published messages seeded'
);

SELECT is(
  (SELECT count(*)::int FROM private.queue_items),
  3,
  '3 queue items seeded'
);

SELECT is(
  (SELECT count(*)::int FROM private.reports),
  2,
  '2 reports seeded'
);

SELECT is(
  (SELECT count(*)::int FROM private.admin_users),
  1,
  '1 admin user seeded'
);

SELECT ok((SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'api' AND c.relname = 'cards'), 'RLS enabled on api.cards');
SELECT ok((SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'api' AND c.relname = 'messages'), 'RLS enabled on api.messages');
SELECT ok((SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'private' AND c.relname = 'queue_items'), 'RLS enabled on private.queue_items');
SELECT ok((SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'private' AND c.relname = 'admin_users'), 'RLS enabled on private.admin_users');
SELECT ok((SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'private' AND c.relname = 'audit_log'), 'RLS enabled on private.audit_log');

SELECT has_fk('api', 'messages', 'api.messages has foreign keys');
SELECT has_fk('api', 'card_slug_aliases', 'api.card_slug_aliases has foreign keys');
SELECT has_fk('private', 'queue_items', 'private.queue_items has foreign keys');
SELECT has_fk('private', 'reports', 'private.reports has foreign keys');
SELECT has_fk('private', 'admin_sessions', 'private.admin_sessions has foreign keys');

SELECT has_index('api', 'cards', 'idx_cards_slug', 'api.cards has indexes');
SELECT has_index('api', 'messages', 'idx_messages_card_id', 'api.messages has indexes');
SELECT has_index('private', 'queue_items', 'idx_queue_enqueue_seq', 'private.queue_items has indexes');
SELECT has_index('private', 'reports', 'idx_reports_status', 'private.reports has indexes');
SELECT has_index('private', 'admin_users', 'admin_users_username_key', 'private.admin_users has indexes');

SELECT has_function('api', 'resolve_card_slug', 'api.resolve_card_slug exists');
SELECT has_function('private', 'can_publish', 'private.can_publish exists');
SELECT has_function('private', 'update_updated_at', 'private.update_updated_at exists');
SELECT has_function('private', 'generate_slug', 'private.generate_slug exists');
SELECT has_function('private', 'prevent_audit_modification', 'private.prevent_audit_modification exists');

SELECT * FROM finish();
ROLLBACK;
