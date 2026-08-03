-- Function to update card message count and last activity
CREATE OR REPLACE FUNCTION private.update_card_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE api.cards
  SET
    message_count = (
      SELECT count(*)
      FROM api.messages
      WHERE card_id = NEW.card_id
        AND status = 'published'
    ),
    last_activity_at = (
      SELECT max(published_at)
      FROM api.messages
      WHERE card_id = NEW.card_id
        AND status = 'published'
    )
  WHERE id = NEW.card_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on message insert/update
CREATE TRIGGER update_card_aggregates_on_message
  AFTER INSERT OR UPDATE ON api.messages
  FOR EACH ROW
  EXECUTE FUNCTION private.update_card_aggregates();

-- Function for slug generation
CREATE OR REPLACE FUNCTION private.generate_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  base_slug := lower(regexp_replace(
    regexp_replace(
      lower(private.immutable_unaccent(NEW.name::text)),
      '[^a-z0-9\s-]',
      '',
      'g'
    ),
    '\s+',
    '-',
    'g'
  ));

  base_slug := trim(both '-' from base_slug);

  IF base_slug = '' THEN
    base_slug := 'card';
  END IF;

  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM api.cards WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-slug generation
CREATE TRIGGER generate_card_slug
  BEFORE INSERT ON api.cards
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '')
  EXECUTE FUNCTION private.generate_slug();

-- Function for old slug redirect
CREATE OR REPLACE FUNCTION api.resolve_card_slug(input_slug text)
RETURNS uuid AS $$
DECLARE
  card_id uuid;
BEGIN
  SELECT id INTO card_id
  FROM api.cards
  WHERE slug = input_slug
    AND status != 'deleted';

  IF card_id IS NOT NULL THEN
    RETURN card_id;
  END IF;

  SELECT a.card_id INTO card_id
  FROM api.card_slug_aliases a
  JOIN api.cards c ON c.id = a.card_id
  WHERE a.old_slug = input_slug
    AND c.status != 'deleted';

  RETURN card_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, api;

-- Revoke public access to security definer function
REVOKE ALL ON FUNCTION api.resolve_card_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION api.resolve_card_slug(text) TO anon;
