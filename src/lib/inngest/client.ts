/**
 * Inngest client helpers for server actions.
 *
 * Uses the same client from src/inngest/client.ts.
 * Provides isInngestEnabled() and sendInngestEvent() for the feature flag pattern.
 */

export type InngestEvents = {
  "app/audio.uploaded": {
    data: {
      workspaceId: string
      userId: string
      patientId?: string
      type: "registration" | "consultation"
      audioBuffer: string
      filename: string
      fileSize: number
    }
  }
  "app/reminder.send": {
    data: {
      appointmentId: string
      workspaceId: string
    }
  }
}

export function isInngestEnabled(): boolean {
  // In dev mode (INNGEST_DEV=1), event key is not required — the dev server accepts events without auth.
  // In production, INNGEST_EVENT_KEY is required to send events to Inngest Cloud.
  return !!process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV === "1"
}

export async function sendInngestEvent<K extends keyof InngestEvents>(
  name: K,
  data: InngestEvents[K]["data"]
): Promise<boolean> {
  if (!isInngestEnabled()) return false

  try {
    const { inngest } = await import("@/inngest/client")
    await inngest.send({ name, data: data as any })
    return true
  } catch (err) {
    console.error("[Inngest] Failed to send event:", err)
    return false
  }
}
