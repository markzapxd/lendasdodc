"use client";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Browser-side Supabase client with anon key (respects RLS).
 * Only use this in Client Components that need to read public data.
 *
 * SECURITY: This client uses the anon key only. Never use service
 * role key in browser code.
 */
export function createBrowserClient() {
  const { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey } =
    process.env;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. " +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
