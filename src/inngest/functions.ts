import { inngest } from "./client"

export const processAudio = inngest.createFunction(
  { id: "process-audio", triggers: { event: "app/audio.uploaded" } },
  async ({ event, step }) => {
    const data = event.data as {
      workspaceId: string
      userId: string
      patientId?: string
      type: "registration" | "consultation"
      recordingId: string
      audioPath: string
      filename: string
      fileSize: number
    }

    // Step 1: Download audio from Supabase Storage
    const { rawBuffer } = await step.run("download-storage", async () => {
      const { getAudioBuffer } = await import("@/lib/storage")
      const buf = await getAudioBuffer(data.audioPath)
      return { rawBuffer: buf.toString("base64") }
    })

    // Step 2: Preprocess audio (FFmpeg silence removal + speed)
    const { processedBuffer } = await step.run("preprocess-ffmpeg", async () => {
      const { preprocessAudio } = await import("@/lib/audio-preprocessing")
      const buffer = Buffer.from(rawBuffer, "base64")
      const result = await preprocessAudio(buffer, data.filename)
      return { processedBuffer: result.buffer.toString("base64") }
    })

    // Step 3: Transcribe via OpenAI Whisper
    const { transcript, duration } = await step.run("transcribe-whisper", async () => {
      const { transcribeAudio } = await import("@/lib/openai")
      const { db } = await import("@/lib/db")
      const { readProcedures } = await import("@/lib/json-helpers")

      const workspace = await db.workspace.findUnique({
        where: { id: data.workspaceId },
        select: { procedures: true },
      })
      const procedureNames = workspace
        ? readProcedures(workspace.procedures).map((p: any) => p.name)
        : []

      const audioBuffer = Buffer.from(processedBuffer, "base64")
      const result = await transcribeAudio(audioBuffer, "processed.mp3", procedureNames)
      return { transcript: result.text, duration: result.duration }
    })

    // Step 4: AI extraction/summary
    const { extractedData } = await step.run("extract-ai", async () => {
      const { db } = await import("@/lib/db")
      const { readProcedures, readCustomFields } = await import("@/lib/json-helpers")

      const workspace = await db.workspace.findUnique({
        where: { id: data.workspaceId },
        select: { procedures: true, customFields: true },
      })

      if (data.type === "registration") {
        const { extractEntities } = await import("@/lib/claude")
        const config = {
          customFields: workspace ? readCustomFields(workspace.customFields) : [],
          procedures: workspace ? readProcedures(workspace.procedures) : [],
        }
        const result = await extractEntities(transcript, config)
        return { extractedData: result }
      } else {
        const { generateConsultationSummary } = await import("@/lib/claude")
        const procedures = workspace ? readProcedures(workspace.procedures) : []
        const result = await generateConsultationSummary(transcript, procedures)
        return { extractedData: result }
      }
    })

    // Step 5: Update recording in database (direct by ID, no fragile matching)
    const { recordingId } = await step.run("save-recording", async () => {
      const { db } = await import("@/lib/db")
      const { toJsonValue } = await import("@/lib/json-helpers")
      const { logAudit } = await import("@/lib/audit")
      const { recordConsent } = await import("@/lib/consent")

      await db.recording.update({
        where: { id: data.recordingId },
        data: {
          transcript,
          aiExtractedData: toJsonValue(extractedData),
          status: "processed",
          duration,
          patientId: data.patientId || null,
        },
      })

      await logAudit({
        workspaceId: data.workspaceId,
        userId: data.userId,
        action: "recording.created",
        entityType: "Recording",
        entityId: data.recordingId,
      })

      await recordConsent({
        workspaceId: data.workspaceId,
        patientId: data.patientId,
        recordingId: data.recordingId,
        consentType: "audio_recording",
        givenBy: data.userId,
      })

      return { recordingId: data.recordingId }
    })

    return { success: true, recordingId, type: data.type }
  }
)
