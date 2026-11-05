import { env } from "../config/env.js";

const BROADCAST_TIMEOUT_MS = 2_000;

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
      console.warn("Supabase feed broadcast was rejected", { event, status: response.status });
      return false;
    }
    return true;
  } catch (error) {
    console.warn("Supabase feed broadcast failed", { event, message: error.message });
    return false;
  }
}
