-- Queue items table (private schema)
CREATE TABLE private.queue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Session/identity (HMAC hashed, not raw)
  session_hmac text NOT NULL,
  session_key_version integer NOT NULL DEFAULT 1,

  -- Content (stored encrypted/hashed for privacy)
  content_hash text NOT NULL,
  content_preview text, -- first 50 chars for admin debugging, redacted
  card_id uuid NOT NULL REFERENCES api.cards(id),
  nickname citext,

  -- Ordering and state
  enqueue_seq bigint GENERATED ALWAYS AS IDENTITY,
  status private.queue_status NOT NULL DEFAULT 'pending',
  status_version integer NOT NULL DEFAULT 1,

  -- Idempotency
  idempotency_key text NOT NULL,
  receipt_hash text NOT NULL,

  -- Timing
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),

  -- Processing metadata
  processing_started_at timestamptz,
  published_message_id uuid REFERENCES api.messages(id),
  rejection_reason text,

  -- Abuse metadata (pseudonymous)
  ip_tag_hmac text,
  content_hmac text NOT NULL
);

-- A partial unique index is the PostgreSQL form of a conditional unique rule.
CREATE UNIQUE INDEX unique_active_pending_per_session
  ON private.queue_items (session_hmac)
  WHERE status IN ('pending', 'processing');

-- Enqueue order index (monotonic)
CREATE INDEX idx_queue_enqueue_seq ON private.queue_items (enqueue_seq ASC);

-- Status filter for pending items
CREATE INDEX idx_queue_pending ON private.queue_items (created_at ASC)
  WHERE status = 'pending';

-- Session lookup
CREATE INDEX idx_queue_session ON private.queue_items (session_hmac, status);

-- Idempotency lookup
CREATE INDEX idx_queue_idempotency ON private.queue_items (idempotency_key);

-- Expiry cleanup
CREATE INDEX idx_queue_expiry ON private.queue_items (expires_at)
  WHERE status IN ('pending', 'processing');

REVOKE ALL ON private.queue_items FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.queue_items TO service_role;
