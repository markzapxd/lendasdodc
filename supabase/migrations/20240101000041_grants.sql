-- Revoke default privileges from the public role.
REVOKE ALL ON ALL TABLES IN SCHEMA api FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA api FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA private FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;

-- Public schema access is read-only for anonymous and authenticated clients.
GRANT USAGE ON SCHEMA api TO anon, authenticated, service_role;
GRANT SELECT ON api.cards, api.messages, api.card_slug_aliases, api.platform_state
  TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA api FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA api FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA api FROM anon, authenticated;

-- Only the documented public RPC is callable by anonymous clients.
GRANT EXECUTE ON FUNCTION api.resolve_card_slug(text) TO anon;

-- No private schema access for API roles.
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA private FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA private FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM anon, authenticated;

-- The service role is the only application role with private data access.
GRANT USAGE ON SCHEMA private TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA private TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA private TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA private TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA api TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA api TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA api TO service_role;

-- Pin function lookup to trusted schemas.
ALTER FUNCTION private.update_updated_at() SET search_path = '';
ALTER FUNCTION private.immutable_unaccent(text) SET search_path = '';
ALTER FUNCTION private.can_publish() SET search_path = '';
ALTER FUNCTION private.create_dispatch(text, jsonb, text, timestamptz) SET search_path = '';
ALTER FUNCTION private.update_card_aggregates() SET search_path = '';
ALTER FUNCTION private.generate_slug() SET search_path = '';
ALTER FUNCTION private.prevent_audit_modification() SET search_path = '';
ALTER FUNCTION api.resolve_card_slug(text) SET search_path = '';
