import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import type { PlatformState } from "@/types/database";

const platformStateSchema = z.object({
  id: z.string().uuid(),
  configured_interval_ms: z.number().int().positive(),
  emergency_mode: z.boolean(),
  degraded_mode: z.boolean(),
  last_published_at: z.coerce.date().nullable(),
  updated_at: z.coerce.date(),
});

const platformSettingsUpdateSchema = z
  .object({
    configured_interval_ms: z.number().int().positive(),
    emergency_mode: z.boolean(),
    degraded_mode: z.boolean(),
  })
  .partial()
  .strict();

export type PlatformSettings = PlatformState;
export type PlatformSettingsUpdate = z.infer<typeof platformSettingsUpdateSchema>;

export function parsePlatformState(value: unknown): PlatformSettings {
  return platformStateSchema.parse(value);
}

export function parsePlatformSettingsUpdate(value: unknown): PlatformSettingsUpdate {
  return platformSettingsUpdateSchema.parse(value);
}

export async function getSettings(): Promise<PlatformSettings> {
  const { data, error } = await createAdminClient()
    .schema("api")
    .from("platform_state")
    .select(
      "id, configured_interval_ms, emergency_mode, degraded_mode, last_published_at, updated_at",
    )
    .single();

  if (error) {
    throw new Error(`Failed to fetch platform state: ${error.message}`, { cause: error });
  }

  if (data === null) {
    throw new Error("Failed to fetch platform state: singleton row is missing");
  }

  return parsePlatformState(data);
}

export async function updateSettings(settings: unknown): Promise<void> {
  const parsedSettings = parsePlatformSettingsUpdate(settings);
  if (Object.keys(parsedSettings).length === 0) {
    return;
  }

  const { error } = await createAdminClient()
    .schema("api")
    .from("platform_state")
    .update(parsedSettings);

  if (error) {
    throw new Error(`Failed to update platform state: ${error.message}`, { cause: error });
  }
}
