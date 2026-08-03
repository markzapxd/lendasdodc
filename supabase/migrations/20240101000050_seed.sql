-- Fictional seed data for Lendas do DC

-- 1. Create test admin (bcrypt hash of 'Test@12345')
INSERT INTO private.admin_users (
  id,
  username,
  password_hash,
  totp_encrypted_seed
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin-teste',
  '$2b$10$pMznB75L1vASH.hfMYX6AuOWdaA/Frkqht2ufNBTaCqEVxJyS0.Ra',
  'test-only-encrypted-totp-seed'
);

-- 2. Create fictional cards (5 diverse heroines)
INSERT INTO api.cards (id, name, slug, description, image_url, image_alt, status)
VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    'Wonder Woman',
    'wonder-woman',
    'Muitos milênios atrás, nas Ilhas Themyscira, uma princesa amazônica foi treinada para ser uma invencível guerreira.',
    'https://example.invalid/images/wonder-woman.jpg',
    'Wonder Woman em pose de combate',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'Storm',
    'storm',
    'Ororo Munroe, a mulher que controla o clima, é uma das mutantes mais poderosas já registradas.',
    'https://example.invalid/images/storm.jpg',
    'Storm cercada por nuvens e raios',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'Catwoman',
    'catwoman',
    'Selina Kyle navega entre o mundo do crime e a justiça com habilidade e elegância incomparáveis.',
    'https://example.invalid/images/catwoman.jpg',
    'Catwoman sobre os telhados de Gotham',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'Harley Quinn',
    'harley-quinn',
    'A ex-psicóloga do Asilo Arkham que encontrou sua liberdade no caos e na anarquia.',
    'https://example.invalid/images/harley-quinn.jpg',
    'Harley Quinn sorrindo com seu taco',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000105',
    'Black Widow',
    'black-widow',
    'Natasha Romanoff, a espiã mais letal do mundo, sempre encontrou uma maneira de se reinventar.',
    'https://example.invalid/images/black-widow.jpg',
    'Black Widow pronta para uma missão',
    'active'
  );

-- 3. Create card slug aliases
INSERT INTO api.card_slug_aliases (card_id, old_slug)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'mulher-maravilha'),
  ('00000000-0000-0000-0000-000000000102', 'tempestade'),
  ('00000000-0000-0000-0000-000000000103', 'gata'),
  ('00000000-0000-0000-0000-000000000104', 'arlequina'),
  ('00000000-0000-0000-0000-000000000105', 'viuva-negra');

-- 4. Create published messages (15 total, 3 per card)
INSERT INTO api.messages (id, card_id, content, status, published_at)
VALUES
  -- Wonder Woman messages
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'A verdadeira força vem do coração, não dos músculos.', 'published', NOW() - INTERVAL '29 days'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000101', 'Lutar pelo que é certo, mesmo quando ninguém está olhando.', 'published', NOW() - INTERVAL '28 days'),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000101', 'A compaixão é a arma mais poderosa de todas.', 'published', NOW() - INTERVAL '27 days'),
  -- Storm messages
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000102', 'A natureza não pede permissão para ser poderosa.', 'published', NOW() - INTERVAL '24 days'),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000102', 'Cada gota de chuva é uma bênção disfarçada.', 'published', NOW() - INTERVAL '23 days'),
  ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000102', 'O trovão é apenas a voz da tempestade cantando.', 'published', NOW() - INTERVAL '22 days'),
  -- Catwoman messages
  ('00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000103', 'Nove vidas, mas apenas uma paixão.', 'published', NOW() - INTERVAL '19 days'),
  ('00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000103', 'A escuridão é minha aliada, não minha inimiga.', 'published', NOW() - INTERVAL '18 days'),
  ('00000000-0000-0000-0000-000000000209', '00000000-0000-0000-0000-000000000103', 'Flexibilidade é a chave para a sobrevivência.', 'published', NOW() - INTERVAL '17 days'),
  -- Harley Quinn messages
  ('00000000-0000-0000-0000-000000000210', '00000000-0000-0000-0000-000000000104', 'O caos é apenas ordem que ainda não conhecemos.', 'published', NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000104', 'Sorrir é minha armadura contra o mundo.', 'published', NOW() - INTERVAL '13 days'),
  ('00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000104', 'Às vezes, a loucura é a única sanidade.', 'published', NOW() - INTERVAL '12 days'),
  -- Black Widow messages
  ('00000000-0000-0000-0000-000000000213', '00000000-0000-0000-0000-000000000105', 'O passado não define quem somos, mas nos ensina.', 'published', NOW() - INTERVAL '9 days'),
  ('00000000-0000-0000-0000-000000000214', '00000000-0000-0000-0000-000000000105', 'Confiança é a arma mais perigosa que existe.', 'published', NOW() - INTERVAL '8 days'),
  ('00000000-0000-0000-0000-000000000215', '00000000-0000-0000-0000-000000000105', 'Uma viúva negra sempre encontra seu caminho de volta.', 'published', NOW() - INTERVAL '7 days');

-- 5. Create pending messages (in queue)
INSERT INTO private.queue_items (
  session_hmac,
  content_hash,
  card_id,
  idempotency_key,
  receipt_hash,
  content_hmac,
  status
)
VALUES
  ('pending-session-1', 'pending-hash-1', '00000000-0000-0000-0000-000000000101', 'idem-001', 'receipt-001', 'pending-hmac-1', 'pending'),
  ('pending-session-2', 'pending-hash-2', '00000000-0000-0000-0000-000000000102', 'idem-002', 'receipt-002', 'pending-hmac-2', 'pending'),
  ('pending-session-3', 'pending-hash-3', '00000000-0000-0000-0000-000000000103', 'idem-003', 'receipt-003', 'pending-hmac-3', 'published');

-- 6. Create some reports
INSERT INTO private.reports (message_id, reporter_session_hmac, reason, details, status)
VALUES
  ('00000000-0000-0000-0000-000000000201', 'reporter-session-1', 'spam', 'Mensagem repetitiva para testar a triagem.', 'open'),
  ('00000000-0000-0000-0000-000000000204', 'reporter-session-2', 'odio', 'Conteúdo usado para testar a fila de moderação.', 'reviewing');

-- 7. Create abuse buckets
INSERT INTO private.abuse_buckets (bucket_key, bucket_type, count, window_start)
VALUES
  ('ip-tag-192-168-1-1', 'ip_tag', 3, NOW() - INTERVAL '1 hour'),
  ('session-abc123', 'session', 5, NOW() - INTERVAL '30 minutes');

-- 8. Create security events
INSERT INTO private.security_events (event_type, severity, admin_id, metadata)
VALUES
  ('admin_login_success', 'info', '00000000-0000-0000-0000-000000000001', '{"ip": "127.0.0.1"}'::jsonb),
  ('admin_login_failed', 'warning', NULL, '{"email": "hacker@evil.com", "ip": "10.0.0.1", "reason": "invalid_password"}'::jsonb);

-- 9. Create audit log entries
INSERT INTO private.audit_log (admin_id, action, resource_type, resource_id, metadata)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin.login', 'admin_user', '00000000-0000-0000-0000-000000000001', '{"email": "admin@lendasdc.local"}'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'card.create', 'card', '00000000-0000-0000-0000-000000000101', '{"name": "Wonder Woman"}'::jsonb);
