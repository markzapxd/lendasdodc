import { z } from "zod";
import { getSettings, parsePlatformSettingsUpdate, updateSettings } from "@/lib/admin/settings";
import { recordAuditEvent } from "@/lib/audit";
import { requireAdmin } from "@/lib/moderation/admin-auth";

function settingsResponse(settings: Awaited<ReturnType<typeof getSettings>>) {
  return {
    configured_interval_ms: settings.configured_interval_ms,
    emergency_mode: settings.emergency_mode,
    degraded_mode: settings.degraded_mode,
  };
}

function errorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Internal server error";
  const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
  return Response.json({ error: message }, { status });
}

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin(request);
    const settings = await getSettings();
    return Response.json({ settings: settingsResponse(settings) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  let adminId: string;
  try {
    ({ adminId } = await requireAdmin(request, true));
  } catch (error) {
    return errorResponse(error);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }
    throw error;
  }

  let parsedSettings: ReturnType<typeof parsePlatformSettingsUpdate>;
  try {
    parsedSettings = parsePlatformSettingsUpdate(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid settings" }, { status: 400 });
    }
    throw error;
  }

  if (Object.keys(parsedSettings).length === 0) {
    return Response.json({ error: "Invalid settings" }, { status: 400 });
  }

  try {
    const currentSettings = await getSettings();
    await updateSettings(parsedSettings);

    await recordAuditEvent({
      actorId: adminId,
      action: "settings.update",
      entityType: "platform_state",
      entityId: currentSettings.id,
      oldValues: {
        configured_interval_ms: currentSettings.configured_interval_ms,
        emergency_mode: currentSettings.emergency_mode,
        degraded_mode: currentSettings.degraded_mode,
      },
      newValues: {
        configured_interval_ms:
          parsedSettings.configured_interval_ms ?? currentSettings.configured_interval_ms,
        emergency_mode: parsedSettings.emergency_mode ?? currentSettings.emergency_mode,
        degraded_mode: parsedSettings.degraded_mode ?? currentSettings.degraded_mode,
      },
      context: { changedFields: Object.keys(parsedSettings) },
      timestamp: Date.now(),
    });

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
