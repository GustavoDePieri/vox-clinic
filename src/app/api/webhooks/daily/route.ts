import { NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { uploadVideo } from "@/lib/storage"
import { logger } from "@/lib/logger"

function validateSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  const webhookSecret = process.env.DAILY_WEBHOOK_SECRET

  // Verify signature if secret is configured
  if (webhookSecret) {
    const signature = request.headers.get("x-webhook-signature")
    if (!validateSignature(rawBody, signature, webhookSecret)) {
      logger.warn("Daily webhook signature verification failed", { action: "POST /api/webhooks/daily" })
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const eventType = payload.type || payload.event

  // Only handle recording.ready-to-download events
  if (eventType === "recording.ready-to-download") {
    try {
      await handleRecordingReady(payload)
    } catch (err) {
      logger.error("Daily webhook recording processing failed", { action: "POST /api/webhooks/daily", eventType }, err)
      // Still return 200 to avoid retries
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}

async function handleRecordingReady(payload: Record<string, unknown>) {
  // Daily.co payload structure for recording.ready-to-download:
  // payload.payload.room_name — the room name we created (e.g., "vox-abc123xyz456")
  // payload.payload.download_link — URL to download the recording
  // payload.payload.duration — duration in seconds
  // payload.payload.max_participants — number of participants

  const data = (payload.payload ?? payload.data ?? {}) as Record<string, unknown>
  const roomName = (data.room_name ?? payload.room_name) as string | undefined
  const downloadUrl = (data.download_link ?? data.download_url) as string | undefined

  if (!roomName || !downloadUrl) {
    logger.warn("Daily webhook missing room_name or download_url", { action: "handleRecordingReady", roomName, downloadUrl: !!downloadUrl })
    return
  }

  // Find appointment by videoRoomName
  const appointment = await db.appointment.findFirst({
    where: { videoRoomName: roomName },
    select: { id: true, workspaceId: true, patientId: true },
  })

  if (!appointment) {
    // Room might have been cleaned up already, or is from a different system
    logger.warn("Daily webhook: no appointment found for room", { action: "handleRecordingReady", roomName })
    return
  }

  // Skip if recording already saved
  const existing = await db.appointment.findUnique({
    where: { id: appointment.id },
    select: { videoRecordingUrl: true },
  })
  if (existing?.videoRecordingUrl) {
    logger.info("Daily webhook: recording already saved, skipping", { action: "handleRecordingReady", appointmentId: appointment.id })
    return
  }

  // Download the recording from Daily.co
  logger.info("Daily webhook: downloading recording", { action: "handleRecordingReady", appointmentId: appointment.id, roomName })

  const response = await fetch(downloadUrl)
  if (!response.ok) {
    throw new Error(`Failed to download recording: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload to Supabase Storage
  const videoPath = await uploadVideo(buffer, `teleconsulta-${appointment.id}.mp4`)

  // Update appointment with recording URL
  await db.appointment.update({
    where: { id: appointment.id },
    data: { videoRecordingUrl: videoPath },
  })

  logger.info("Daily webhook: recording saved", { action: "handleRecordingReady", appointmentId: appointment.id, videoPath, sizeBytes: buffer.length })
}
