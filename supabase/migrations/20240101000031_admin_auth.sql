-- Admin users table (private schema)
CREATE TABLE private.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Credentials
  username citext NOT NULL UNIQUE,
  password_hash text NOT NULL,

  -- TOTP
  totp_encrypted_seed text NOT NULL,
  totp_key_version integer NOT NULL DEFAULT 1,
  totp_last_used_step bigint,

  -- Recovery codes
  recovery_codes_hash text[] NOT NULL DEFAULT '{}',

  -- State
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_username CHECK (char_length(username::text) BETWEEN 3 AND 50)
);

-- Single admin constraint (initial setup)
-- This is enforced at application level, not DB level

-- Updated_at trigger
CREATE TRIGGER set_admin_users_updated_at
  BEFORE UPDATE ON private.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION private.update_updated_at();
