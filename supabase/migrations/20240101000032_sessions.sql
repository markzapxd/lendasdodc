-- Admin sessions table (private schema)
CREATE TABLE private.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Session
  admin_id uuid NOT NULL REFERENCES private.admin_users(id) ON DELETE CASCADE,
  session_token_hash text NOT NULL UNIQUE,

  -- Security
  csrf_token_hash text NOT NULL,
  password_assured_at timestamptz NOT NULL DEFAULT now(),
  totp_assured_at timestamptz,

  -- State
  status private.admin_session_status NOT NULL DEFAULT 'active',

  -- Timing
  created_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '8 hours'),

  -- Metadata
  ip_tag_hmac text,
  user_agent text
);

-- Active sessions index
CREATE INDEX idx_admin_sessions_active ON private.admin_sessions (admin_id)
  WHERE status = 'active';

-- Expiry cleanup
CREATE INDEX idx_admin_sessions_expiry ON private.admin_sessions (expires_at)
  WHERE status = 'active';

-- TOTP step tracking (monotonic)
CREATE TABLE private.totp_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES private.admin_users(id) ON DELETE CASCADE,
  step bigint NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_totp_step UNIQUE (admin_id, step)
);

-- Recovery code usage tracking
CREATE TABLE private.recovery_codes_used (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES private.admin_users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_recovery_code UNIQUE (admin_id, code_hash)
);
