"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import {
  ERR_UNAUTHORIZED,
  ERR_WORKSPACE_NOT_CONFIGURED,
  ERR_RECORDING_NOT_FOUND,
  ActionError,
  safeAction,
} from "@/lib/error-messages"

/**
 * Get recording status for polling from the processing page.
 * Returns the current status plus transcript/summary when available.
 */
export const getRecordingStatus = safeAction(async (recordingId: string) => {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      workspace: true,
      memberships: { select: { workspaceId: true }, take: 1 },
    },
  })
  const workspaceId =
    user?.workspace?.id ?? user?.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error(ERR_WORKSPACE_NOT_CONFIGURED)

  const recording = await db.recording.findFirst({
    where: { id: recordingId, workspaceId },
    select: {
      id: true,
      status: true,
      transcript: true,
      aiExtractedData: true,
      errorMessage: true,
      patientId: true,
      audioUrl: true,
    },
  })

  if (!recording) throw new ActionError(ERR_RECORDING_NOT_FOUND)

  return {
    recordingId: recording.id,
    status: recording.status as
      | "processing"
      | "processed"
      | "error"
      | "pending",
    transcript: recording.transcript,
    summary: recording.aiExtractedData,
    error: recording.errorMessage,
    patientId: recording.patientId,
    audioUrl: recording.audioUrl,
  }
})
