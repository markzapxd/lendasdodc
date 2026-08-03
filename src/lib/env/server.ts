import { z } from "zod";

const serverEnvironmentSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  QSTASH_TOKEN: z.string().min(1),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1),
  ADMIN_SESSION_SECRET: z.string().min(32),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  ALERT_WEBHOOK_URL: z.string().url().optional(),
});

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY,
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
  QSTASH_TOKEN,
  QSTASH_CURRENT_SIGNING_KEY,
  QSTASH_NEXT_SIGNING_KEY,
  ADMIN_SESSION_SECRET,
  TURNSTILE_SECRET_KEY,
  CRON_SECRET,
  ALERT_WEBHOOK_URL,
} = process.env;

const parsedServerEnvironment = serverEnvironmentSchema.safeParse({
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY,
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
  QSTASH_TOKEN,
  QSTASH_CURRENT_SIGNING_KEY,
  QSTASH_NEXT_SIGNING_KEY,
  ADMIN_SESSION_SECRET,
  TURNSTILE_SECRET_KEY,
  CRON_SECRET,
  ALERT_WEBHOOK_URL,
});

if (!parsedServerEnvironment.success) {
  const invalidVariables = parsedServerEnvironment.error.issues
    .map((issue) => issue.path[0])
    .filter((variable): variable is string => typeof variable === "string");
  const variableList = invalidVariables.join(", ") || "an unknown variable";

  throw new Error(`Invalid server environment configuration: ${variableList}.`);
}

export const serverEnv = parsedServerEnvironment.data;
export type ServerEnv = typeof serverEnv;
