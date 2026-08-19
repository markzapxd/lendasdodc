export const serverEnv = {
  SUPABASE_URL:
    process.env["SUPABASE_URL"] ||
    process.env["NEXT_PUBLIC_SUPABASE_URL"] ||
    "https://placeholder.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: process.env["SUPABASE_SERVICE_ROLE_KEY"] || "dummy-service-role-key",
  SUPABASE_ANON_KEY:
    process.env["SUPABASE_ANON_KEY"] ||
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ||
    "dummy-anon-key",
  UPSTASH_REDIS_REST_URL:
    process.env["UPSTASH_REDIS_REST_URL"] || "https://placeholder-redis.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: process.env["UPSTASH_REDIS_REST_TOKEN"] || "dummy-redis-token",
  QSTASH_TOKEN: process.env["QSTASH_TOKEN"] || "dummy-qstash-token",
  QSTASH_CURRENT_SIGNING_KEY: process.env["QSTASH_CURRENT_SIGNING_KEY"] || "dummy-signing-key",
  QSTASH_NEXT_SIGNING_KEY: process.env["QSTASH_NEXT_SIGNING_KEY"] || "dummy-next-signing-key",
  ADMIN_SESSION_SECRET:
    process.env["ADMIN_SESSION_SECRET"] || "default-secret-at-least-32-characters-long",
  TURNSTILE_SECRET_KEY: process.env["TURNSTILE_SECRET_KEY"] || "dummy-turnstile-secret-key",
  CRON_SECRET: process.env["CRON_SECRET"] || "dummy-cron-secret",
  ALERT_WEBHOOK_URL: process.env["ALERT_WEBHOOK_URL"] || undefined,
};

export type ServerEnv = typeof serverEnv;
