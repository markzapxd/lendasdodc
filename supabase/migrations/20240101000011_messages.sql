-- Messages table (public with redacted fields)
CREATE TABLE api.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES api.cards(id) ON DELETE CASCADE,
  content text,
  nickname citext,
  status api.message_status NOT NULL DEFAULT 'published',
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Content is null only for removed messages
  CONSTRAINT messages_content_not_null CHECK (
    (status = 'removed' AND content IS NULL) OR
    (status = 'published' AND content IS NOT NULL)
  ),
  CONSTRAINT messages_content_length CHECK (
    content IS NULL OR char_length(content) BETWEEN 1 AND 500
  ),
  CONSTRAINT messages_nickname_length CHECK (
    nickname IS NULL OR char_length(nickname::text) BETWEEN 1 AND 30
  )
);

-- Card reference index
CREATE INDEX idx_messages_card_id ON api.messages (card_id);

-- Published_at for newest-first sorting
CREATE INDEX idx_messages_published_at ON api.messages (published_at DESC, id DESC);

-- Card + published_at for card-scoped queries
CREATE INDEX idx_messages_card_published ON api.messages (card_id, published_at DESC);

-- Status filter
CREATE INDEX idx_messages_status ON api.messages (status) WHERE status = 'published';

-- Updated_at trigger
CREATE TRIGGER set_messages_updated_at
  BEFORE UPDATE ON api.messages
  FOR EACH ROW
  EXECUTE FUNCTION private.update_updated_at();
