import { inngest } from "./client"

export const processAudio = inngest.createFunction(
  { id: "process-audio", triggers: { event: "app/audio.uploaded" } },
  async ({ event, step }) => {
    const data = event.data as {
      workspaceId: string
      userId: string
      patientId?: string
      type: "registration" | "consultation"
      audioBuffer: string // base64
      filename: string
      fileSize: number
    }

    const buffer = Buffer.from(data.audioBuffer, "base64")

    // Step 1: Upload audio to Supabase Storage
    const { audioPath } = await step.run("upload-storage", async () => {
      const { uploadAudio } = await import("@/lib/storage")
      const path = await uploadAudio(buffer, data.filename)
      return { audioPath: path }
    })

    // Step 2: Preprocess audio (FFmpeg silence removal + speed)
    const { processedBuffer } = await step.run("preprocess-ffmpeg", async () => {
      const { preprocessAudio } = await import("@/lib/audio-preprocessing")
      const result = await preprocessAudio(buffer, data.filename)
      return { processedBuffer: result.buffer.toString("base64") }
    })

    // Step 3: Transcribe via OpenAI Whisper
    const { transcript, duration } = await step.run("transcribe-whisper", async () => {
      const { transcribeAudio } = await import("@/lib/openai")
      const { db } = await import("@/lib/db")
      const { readProcedures } = await import("@/lib/json-helpers")

      // Get workspace procedure names for vocabulary hints
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

    // Step 5: Save recording to database
    const { recordingId } = await step.run("save-recording", async () => {
      const { db } = await import("@/lib/db")
      const { toJsonValue } = await import("@/lib/json-helpers")
      const { logAudit } = await import("@/lib/audit")
      const { recordConsent } = await import("@/lib/consent")

      // Find the placeholder recording created by the server action
      const existing = await db.recording.findFirst({
        where: {
          workspaceId: data.workspaceId,
          audioUrl: "__processing__",
          status: "processing",
          fileSize: data.fileSize,
        },
        orderBy: { createdAt: "desc" },
      })

      if (existing) {
        // Update the placeholder
        await db.recording.update({
          where: { id: existing.id },
          data: {
            audioUrl: audioPath,
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
          entityId: existing.id,
        })

        await recordConsent({
          workspaceId: data.workspaceId,
          patientId: data.patientId,
          recordingId: existing.id,
          consentType: "audio_recording",
          givenBy: data.userId,
        })

        return { recordingId: existing.id }
      } else {
        // Fallback: create new recording
        const rec = await db.recording.create({
          data: {
            workspaceId: data.workspaceId,
            audioUrl: audioPath,
            transcript,
            aiExtractedData: toJsonValue(extractedData),
            status: "processed",
            fileSize: data.fileSize,
            duration,
            patientId: data.patientId || null,
          },
        })
        return { recordingId: rec.id }
      }
    })

    return { success: true, recordingId, type: data.type }
  }
)
