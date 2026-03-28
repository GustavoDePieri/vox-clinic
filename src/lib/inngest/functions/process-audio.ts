/**
 * Inngest step function: process-audio
 *
 * 5-step pipeline for audio processing with per-step retries.
 * Each step is independently retryable (3 retries, exponential backoff).
 *
 * Steps:
 * 1. upload-storage    — Upload audio buffer to Supabase Storage
 * 2. preprocess-ffmpeg — FFmpeg silence removal + speed up
 * 3. transcribe-whisper — OpenAI Whisper transcription
 * 4. extract-ai        — Claude entity extraction or consultation summary
 * 5. save-recording    — DB transaction (create Recording + audit + consent)
 *
 * This file exports a factory function that creates the Inngest function.
 * It is only imported by the API route handler when Inngest is available.
 */

import { db } from "@/lib/db"
import { uploadAudio } from "@/lib/storage"
import { transcribeAudio } from "@/lib/openai"
import { preprocessAudio } from "@/lib/audio-preprocessing"
import { extractEntities, generateConsultationSummary } from "@/lib/claude"
import { logAudit } from "@/lib/audit"
import { recordConsent } from "@/lib/consent"
import { readProcedures, readCustomFields, toJsonValue } from "@/lib/json-helpers"
import { logger } from "@/lib/logger"
import type { InngestEvents } from "../client"

type AudioUploadedData = InngestEvents["app/audio.uploaded"]["data"]

/**
 * Creates the process-audio Inngest function.
 * Called from the API route handler with the actual Inngest instance.
 */
export function createProcessAudioFunction(inngest: {
  createFunction: (
    config: {
      id: string
      retries: number
      onFailure?: (opts: { event: { data: AudioUploadedData }; error: Error }) => Promise<void>
    },
    trigger: { event: string },
    handler: (opts: {
      event: { data: AudioUploadedData }
      step: {
        run: <T>(name: string, fn: () => Promise<T>) => Promise<T>
      }
    }) => Promise<void>
  ) => unknown
}) {
  return inngest.createFunction(
    {
      id: "process-audio",
      retries: 3,
      onFailure: async ({ event, error }) => {
        // On final failure after all retries, mark recording as error
        const data = event.data
        logger.error("Inngest process-audio final failure", {
          action: "process-audio",
          workspaceId: data.workspaceId,
        }, error)

        try {
          // Find the recording created in step 1 (if it exists)
          const recording = await db.recording.findFirst({
            where: {
              workspaceId: data.workspaceId,
              status: "processing",
            },
            orderBy: { createdAt: "desc" },
          })

          if (recording) {
            await db.recording.update({
              where: { id: recording.id },
              data: {
                status: "error",
                errorMessage: error.message || "Erro no processamento de audio",
              },
            })
          }
        } catch (saveErr) {
          logger.error("Failed to update recording error status", {
            action: "process-audio.onFailure",
            workspaceId: data.workspaceId,
          }, saveErr)
        }
      },
    },
    { event: "app/audio.uploaded" },
    async ({ event, step }) => {
      const data = event.data

      // Step 1: Upload audio to Supabase Storage
      const audioPath = await step.run("upload-storage", async () => {
        const buffer = Buffer.from(data.audioBuffer, "base64")
        const path = await uploadAudio(buffer, data.filename)
        return path
      })

      // Step 2: Preprocess audio via FFmpeg (silence removal + speed up)
      const processedBase64 = await step.run("preprocess-ffmpeg", async () => {
        const buffer = Buffer.from(data.audioBuffer, "base64")
        const { buffer: processedBuffer } = await preprocessAudio(
          buffer,
          data.filename
        )
        return processedBuffer.toString("base64")
      })

      // Step 3: Transcribe via OpenAI Whisper
      const transcription = await step.run("transcribe-whisper", async () => {
        const processedBuffer = Buffer.from(processedBase64, "base64")

        // Load workspace for vocabulary hints
        const workspace = await db.workspace.findUnique({
          where: { id: data.workspaceId },
          select: { procedures: true },
        })

        const procedureNames = workspace
          ? readProcedures(workspace.procedures).map((p) => p.name)
          : []

        const result = await transcribeAudio(
          processedBuffer,
          "processed.mp3",
          procedureNames
        )

        return { text: result.text, duration: result.duration }
      })

      // Step 4: Extract entities or generate summary via Claude
      const aiResult = await step.run("extract-ai", async () => {
        const workspace = await db.workspace.findUnique({
          where: { id: data.workspaceId },
          select: { procedures: true, customFields: true },
        })

        if (data.type === "registration") {
          const workspaceConfig = {
            customFields: workspace ? readCustomFields(workspace.customFields) : [],
            procedures: workspace ? readProcedures(workspace.procedures) : [],
          }
          const extracted = await extractEntities(
            transcription.text,
            workspaceConfig
          )
          return { type: "registration" as const, data: extracted }
        } else {
          const procedures = workspace
            ? readProcedures(workspace.procedures)
            : []
          const summary = await generateConsultationSummary(
            transcription.text,
            procedures
          )
          return { type: "consultation" as const, data: summary }
        }
      })

      // Step 5: Save Recording to DB in transaction (+ audit + consent)
      await step.run("save-recording", async () => {
        await db.$transaction(async (tx) => {
          // Check if a "processing" recording already exists for this job
          // (created when the event was sent) — update it
          const existingRecording = await tx.recording.findFirst({
            where: {
              workspaceId: data.workspaceId,
              status: "processing",
              audioUrl: "__processing__",
            },
            orderBy: { createdAt: "desc" },
          })

          let recordingId: string

          if (existingRecording) {
            // Update the placeholder recording
            await tx.recording.update({
              where: { id: existingRecording.id },
              data: {
                audioUrl: audioPath,
                transcript: transcription.text,
                aiExtractedData: toJsonValue(aiResult.data),
                status: "processed",
                fileSize: data.fileSize,
                duration: transcription.duration,
                patientId: data.patientId ?? null,
              },
            })
            recordingId = existingRecording.id
          } else {
            // Create new recording (fallback)
            const rec = await tx.recording.create({
              data: {
                workspaceId: data.workspaceId,
                audioUrl: audioPath,
                transcript: transcription.text,
                aiExtractedData: toJsonValue(aiResult.data),
                status: "processed",
                fileSize: data.fileSize,
                duration: transcription.duration,
                patientId: data.patientId ?? null,
              },
            })
            recordingId = rec.id
          }

          await logAudit({
            workspaceId: data.workspaceId,
            userId: data.userId,
            action: "recording.created",
            entityType: "Recording",
            entityId: recordingId,
          })

          await recordConsent({
            workspaceId: data.workspaceId,
            patientId: data.patientId,
            recordingId,
            consentType: "audio_recording",
            givenBy: data.userId,
          })
        })
      })
    }
  )
}
