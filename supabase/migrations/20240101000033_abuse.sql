-- Abuse buckets (private schema)
CREATE TABLE private.abuse_buckets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity (pseudonymous)
  bucket_key text NOT NULL, -- HMAC of IP/session + context
  bucket_type text NOT NULL, -- 'session', 'ip_tag', 'content'

  -- State
  count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz,

  -- Key rotation
  key_version integer NOT NULL DEFAULT 1,

  CONSTRAINT valid_bucket_type CHECK (bucket_type IN ('session', 'ip_tag', 'content'))
);

-- Bucket lookup
CREATE INDEX idx_abuse_buckets_key ON private.abuse_buckets (bucket_key, bucket_type);

-- Blocked check
CREATE INDEX idx_abuse_blocked ON private.abuse_buckets (blocked_until)
  WHERE blocked_until IS NOT NULL;

-- Security events
CREATE TABLE private.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',

  -- Context
  admin_id uuid,
  session_id uuid,
  ip_tag_hmac text,

  -- Details
  metadata jsonb NOT NULL DEFAULT '{}',

  -- Timing
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

-- Alert outbox
CREATE TABLE private.alert_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Alert
  alert_type text NOT NULL,
  payload jsonb NOT NULL,

  -- State
  sent boolean NOT NULL DEFAULT false,
  sent_at timestamptz,
  retry_count integer NOT NULL DEFAULT 0,

  -- Timing
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_alert_type CHECK (alert_type IN ('security', 'operational', 'abuse'))
);

-- Index for pending alerts
CREATE INDEX idx_alerts_pending ON private.alert_outbox (created_at)
  WHERE sent = false;
