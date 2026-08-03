import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env/server";
import type { Database } from "@/types/database";
import "./admin.guard";

/**
 * Admin Supabase client for privileged operations.
 * Uses service role key with full database access.
 *
 * SECURITY: This client MUST only be imported in server-only code.
 * Mark any file importing this with 'server-only' guard.
 */
export function createAdminClient(): SupabaseClient {
  return createClient<Database>(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
