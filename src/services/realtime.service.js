import { env } from "../config/env.js";

const BROADCAST_TIMEOUT_MS = 2_000;

export async function checkSupabaseHealth() {
  if (!env.supabase.url || !env.supabase.serviceRoleKey) {
    return { ok: false, status: "not-configured" };
  }

  try {
    const response = await fetch(`${env.supabase.url}/auth/v1/health`, {
      headers: { apikey: env.supabase.serviceRoleKey },
      signal: AbortSignal.timeout(BROADCAST_TIMEOUT_MS),
    });
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return { ok: false, status: error instanceof Error ? error.message : "request-failed" };
  }
}

export async function broadcastFeedEvent(event, payload) {
  if (!env.supabase.url || !env.supabase.serviceRoleKey) return false;

  try {
    const response = await fetch(
      `${env.supabase.url}/realtime/v1/api/broadcast/feed/events/${encodeURIComponent(event)}`,
      {
        method: "POST",
        headers: {
          apikey: env.supabase.serviceRoleKey,
          Authorization: `Bearer ${env.supabase.serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(BROADCAST_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn("Supabase feed broadcast was rejected", {
        event,
        status: response.status,
        detail: detail.slice(0, 300),
      });
      return false;
    }
    if (env.nodeEnv !== "production") {
      console.info("Supabase feed broadcast sent", { event, status: response.status });
    }
    return true;
  } catch (error) {
    console.warn("Supabase feed broadcast failed", { event, message: error.message });
    return false;
  }
}
