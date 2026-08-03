-- Private staging bucket for service-role uploads.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'card-images-staging',
  'card-images-staging',
  false,
  4194304,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public derivative bucket. Objects are still immutable to client roles.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'card-images',
  'card-images',
  true,
  4194304,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "service_upload_staging"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'card-images-staging');

CREATE POLICY "service_delete_staging"
  ON storage.objects
  FOR DELETE
  TO service_role
  USING (bucket_id = 'card-images-staging');

CREATE POLICY "anon_no_read_staging"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id != 'card-images-staging');

CREATE POLICY "anon_read_derivatives"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'card-images');

CREATE POLICY "service_insert_derivatives"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'card-images');

CREATE POLICY "service_delete_derivatives"
  ON storage.objects
  FOR DELETE
  TO service_role
  USING (bucket_id = 'card-images');

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON storage.objects FROM anon, authenticated;
