CREATE OR REPLACE FUNCTION private.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION private.update_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.update_updated_at() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private.update_updated_at() TO service_role;
