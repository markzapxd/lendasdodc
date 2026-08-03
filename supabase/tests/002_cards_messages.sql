BEGIN;
SELECT plan(15);

SELECT has_table('api', 'cards', 'cards table exists');

SELECT has_table('api', 'messages', 'messages table exists');

SELECT has_table('api', 'card_slug_aliases', 'card_slug_aliases table exists');

SELECT lives_ok(
  $$INSERT INTO api.cards (name) VALUES ('Test Card')$$,
  'can insert a card'
);

SELECT isnt(
  (SELECT slug FROM api.cards WHERE name = 'Test Card'),
  NULL,
  'card slug is auto-generated'
);

SELECT throws_ok(
  $$INSERT INTO api.cards (name) VALUES ('')$$,
  'empty name is rejected'
);

SELECT throws_ok(
  $$INSERT INTO api.cards (name, description) VALUES ('Test', repeat('x', 501))$$,
  'description over 500 chars is rejected'
);

SELECT lives_ok(
  $$INSERT INTO api.messages (card_id, content)
    SELECT id, 'Hello World' FROM api.cards WHERE name = 'Test Card' LIMIT 1$$,
  'can insert a message'
);

SELECT throws_ok(
  $$INSERT INTO api.messages (card_id, content)
    SELECT id, repeat('x', 501) FROM api.cards WHERE name = 'Test Card' LIMIT 1$$,
  'message over 500 chars is rejected'
);

SELECT lives_ok(
  $$INSERT INTO api.messages (card_id, content, status)
    SELECT id, NULL, 'removed'::api.message_status FROM api.cards WHERE name = 'Test Card' LIMIT 1$$,
  'removed message can have null content'
);

SELECT throws_ok(
  $$INSERT INTO api.messages (card_id, content, status)
    SELECT id, NULL, 'published'::api.message_status FROM api.cards WHERE name = 'Test Card' LIMIT 1$$,
  'published message cannot have null content'
);

SELECT is(
  (SELECT message_count FROM api.cards WHERE name = 'Test Card'),
  1,
  'message count is updated'
);

SELECT has_index('api', 'cards', 'idx_cards_name_search', 'search index exists');

SELECT has_index('api', 'cards', 'idx_cards_name_trgm', 'trigram index exists');

SELECT lives_ok(
  $$INSERT INTO api.card_slug_aliases (card_id, old_slug)
    SELECT id, 'old-slug' FROM api.cards WHERE name = 'Test Card' LIMIT 1$$,
  'slug alias can be inserted'
);

SELECT * FROM finish();
ROLLBACK;
