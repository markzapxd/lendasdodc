BEGIN;
SELECT plan(8);

SELECT has_schema('api', 'api schema exists');

SELECT has_schema('private', 'private schema exists');

SELECT ok(
  NOT has_table_privilege('anon', 'private.migration_ledger', 'SELECT'),
  'anon cannot read private.migration_ledger'
);

SELECT ok(
  has_table_privilege('anon', 'api.platform_state', 'SELECT'),
  'anon can read api.platform_state'
);

SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'private.update_updated_at()',
    'EXECUTE'
  ),
  'authenticated cannot execute private functions'
);

SELECT has_pk('api', 'platform_state', 'platform_state has primary key');

SELECT has_type('api', 'card_status', 'card_status enum exists');

SELECT has_type('private', 'queue_status', 'queue_status enum exists');

SELECT * FROM finish();
ROLLBACK;
