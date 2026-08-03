CREATE TYPE api.card_status AS ENUM (
  'active',
  'archived',
  'hidden',
  'deleted'
);

CREATE TYPE api.message_status AS ENUM (
  'published',
  'removed'
);

CREATE TYPE private.queue_status AS ENUM (
  'pending',
  'processing',
  'published',
  'rejected',
  'expired'
);

CREATE TYPE private.report_status AS ENUM (
  'open',
  'reviewing',
  'resolved',
  'dismissed'
);

CREATE TYPE private.report_reason AS ENUM (
  'assedio',
  'odio',
  'dados_pessoais',
  'spam',
  'sexual',
  'ameaca',
  'informacao_falsa',
  'outro'
);

CREATE TYPE private.admin_session_status AS ENUM (
  'active',
  'revoked',
  'expired'
);
