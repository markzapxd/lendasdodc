-- Cards table (public content)
CREATE TABLE api.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name citext NOT NULL,
  slug text NOT NULL,
  description text,
  image_url text,
  image_alt text,
  status api.card_status NOT NULL DEFAULT 'active',
  message_count integer NOT NULL DEFAULT 0,
  last_activity_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT cards_name_length CHECK (char_length(name::text) BETWEEN 1 AND 100),
  CONSTRAINT cards_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT cards_description_length CHECK (
    description IS NULL OR char_length(description) <= 500
  ),
  CONSTRAINT cards_image_url_format CHECK (
    image_url IS NULL OR image_url ~ '^https?://'
  )
);

-- Unique slug
CREATE UNIQUE INDEX idx_cards_slug ON api.cards (slug);

-- Slug aliases for redirects
CREATE TABLE api.card_slug_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES api.cards(id) ON DELETE CASCADE,
  old_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_old_slug UNIQUE (old_slug)
);

CREATE INDEX idx_card_aliases_card_id ON api.card_slug_aliases (card_id);

-- unaccent() is STABLE because its dictionary can be changed. Index expressions
-- require IMMUTABLE functions, so keep the dictionary fixed for these indexes.
CREATE OR REPLACE FUNCTION private.immutable_unaccent(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT public.unaccent('public.unaccent'::regdictionary, input);
$$;

REVOKE ALL ON FUNCTION private.immutable_unaccent(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.immutable_unaccent(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private.immutable_unaccent(text) TO service_role;

-- Case/accent-insensitive search index
CREATE INDEX idx_cards_name_search ON api.cards USING gin (
  to_tsvector('portuguese', private.immutable_unaccent(name::text))
);

-- Trigram index for fuzzy search
CREATE INDEX idx_cards_name_trgm ON api.cards USING gin (
  private.immutable_unaccent(name::text) gin_trgm_ops
);

-- Status filter index
CREATE INDEX idx_cards_status ON api.cards (status) WHERE status = 'active';

-- Cursor pagination index
CREATE INDEX idx_cards_cursor ON api.cards (created_at DESC, id DESC);

-- Activity sorting index
CREATE INDEX idx_cards_activity ON api.cards (
  last_activity_at DESC NULLS LAST,
  id DESC
);

-- Message count sorting index
CREATE INDEX idx_cards_message_count ON api.cards (message_count DESC, id DESC);

-- Updated_at trigger
CREATE TRIGGER set_cards_updated_at
  BEFORE UPDATE ON api.cards
  FOR EACH ROW
  EXECUTE FUNCTION private.update_updated_at();
