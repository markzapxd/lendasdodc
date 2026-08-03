import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env/server";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client for Server Components and Server Actions.
 * Uses service role key for full access (bypasses RLS).
 *
 * SECURITY: This client MUST only be used in server-only code.
 * The service role key has elevated privileges and should NEVER
 * be exposed to the client bundle.
 */
export function createServerClient() {
  return createClient<Database>(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Server-side Supabase client with anon key (respects RLS).
 * Use this when you want RLS policies enforced.
 */
export function createAnonClient() {
  return createClient<Database>(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
