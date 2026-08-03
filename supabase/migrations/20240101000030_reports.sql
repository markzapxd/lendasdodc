-- Reports table (private schema)
CREATE TABLE private.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target
  message_id uuid NOT NULL REFERENCES api.messages(id) ON DELETE CASCADE,

  -- Reporter (pseudonymous)
  reporter_session_hmac text NOT NULL,
  reporter_ip_tag_hmac text,

  -- Report content
  reason private.report_reason NOT NULL,
  details text,

  -- State
  status private.report_status NOT NULL DEFAULT 'open',
  status_version integer NOT NULL DEFAULT 1,

  -- Resolution
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_reason text,

  -- Timing
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT reports_details_length CHECK (
    details IS NULL OR char_length(details) <= 500
  )
);

-- Only one report for a message may be open or under review at a time.
CREATE UNIQUE INDEX one_open_per_message
  ON private.reports (message_id)
  WHERE status IN ('open', 'reviewing');

-- Index for open reports
CREATE INDEX idx_reports_status ON private.reports (status)
  WHERE status IN ('open', 'reviewing');

-- Index for message lookup
CREATE INDEX idx_reports_message ON private.reports (message_id);

-- Updated_at trigger
CREATE TRIGGER set_reports_updated_at
  BEFORE UPDATE ON private.reports
  FOR EACH ROW
  EXECUTE FUNCTION private.update_updated_at();
