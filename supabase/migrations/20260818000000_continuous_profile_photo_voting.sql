-- Profile pictures are candidates. Votes are permanent; only the displayed leader
-- is refreshed hourly by api.refresh_profile_photo_rankings().
CREATE TABLE api.profile_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES api.cards(id) ON DELETE CASCADE,
  image_url text NOT NULL CHECK (image_url ~ '^https?://'),
  image_alt text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_photos_image_alt_length CHECK (image_alt IS NULL OR char_length(image_alt) <= 200)
);

CREATE INDEX profile_photos_active_card_idx ON api.profile_photos (card_id, created_at, id)
  WHERE is_active;

CREATE OR REPLACE FUNCTION private.limit_profile_photo_uploads()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- A card represents the person in this application. Count in UTC so the
  -- limit is deterministic across server regions.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(NEW.card_id::text, 0));
  IF (SELECT count(*) FROM api.profile_photos
      WHERE card_id = NEW.card_id
        AND created_at >= date_trunc('day', NEW.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
        AND created_at < (date_trunc('day', NEW.created_at AT TIME ZONE 'UTC') + interval '1 day') AT TIME ZONE 'UTC') >= 3 THEN
    RAISE EXCEPTION 'daily_profile_photo_limit_reached' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER limit_profile_photo_uploads
  BEFORE INSERT ON api.profile_photos
  FOR EACH ROW EXECUTE FUNCTION private.limit_profile_photo_uploads();

CREATE TABLE private.profile_photo_votes (
  card_id uuid NOT NULL REFERENCES api.cards(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES api.profile_photos(id) ON DELETE CASCADE,
  session_hmac text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (card_id, session_hmac)
);

CREATE INDEX profile_photo_votes_photo_idx ON private.profile_photo_votes (photo_id);

-- Existing profile images join the voting pool during rollout.
INSERT INTO api.profile_photos (card_id, image_url, image_alt, created_at)
SELECT id, image_url, image_alt, created_at FROM api.cards WHERE image_url IS NOT NULL;

ALTER TABLE api.cards ADD COLUMN profile_photo_id uuid
  REFERENCES api.profile_photos(id) ON DELETE SET NULL;

UPDATE api.cards AS card
SET profile_photo_id = photo.id
FROM api.profile_photos AS photo
WHERE photo.card_id = card.id AND photo.image_url = card.image_url;

ALTER TABLE api.profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.profile_photo_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_active_profile_photos" ON api.profile_photos FOR SELECT TO anon
  USING (is_active AND EXISTS (SELECT 1 FROM api.cards WHERE id = card_id AND status = 'active'));
CREATE POLICY "authenticated_read_active_profile_photos" ON api.profile_photos FOR SELECT TO authenticated
  USING (is_active AND EXISTS (SELECT 1 FROM api.cards WHERE id = card_id AND status = 'active'));
CREATE POLICY "deny_anon_profile_photo_votes" ON private.profile_photo_votes FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_authenticated_profile_photo_votes" ON private.profile_photo_votes FOR ALL TO authenticated USING (false) WITH CHECK (false);

GRANT SELECT ON api.profile_photos TO anon, authenticated;
GRANT ALL ON api.profile_photos, private.profile_photo_votes TO service_role;

CREATE OR REPLACE FUNCTION api.refresh_profile_photo_rankings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE refreshed integer;
BEGIN
  WITH ranked AS (
    SELECT DISTINCT ON (photo.card_id) photo.card_id, photo.id, photo.image_url, photo.image_alt
    FROM api.profile_photos AS photo
    LEFT JOIN private.profile_photo_votes AS vote ON vote.photo_id = photo.id
    JOIN api.cards AS card ON card.id = photo.card_id
    WHERE photo.is_active AND card.status = 'active'
    GROUP BY photo.id
    ORDER BY photo.card_id, count(vote.photo_id) DESC, photo.created_at ASC, photo.id ASC
  ), updated AS (
    UPDATE api.cards AS card
    SET profile_photo_id = ranked.id, image_url = ranked.image_url, image_alt = ranked.image_alt
    FROM ranked
    WHERE card.id = ranked.card_id
      AND card.profile_photo_id IS DISTINCT FROM ranked.id
    RETURNING 1
  ) SELECT count(*) INTO refreshed FROM updated;
  RETURN refreshed;
END;
$$;

REVOKE ALL ON FUNCTION api.refresh_profile_photo_rankings() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION api.refresh_profile_photo_rankings() TO service_role;
ALTER FUNCTION private.limit_profile_photo_uploads() SET search_path = '';
