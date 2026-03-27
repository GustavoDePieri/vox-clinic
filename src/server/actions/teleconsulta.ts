"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { createVideoRoom, createMeetingToken, deleteVideoRoom } from "@/lib/daily"
import crypto from "crypto"

async function getAuthContext() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true, memberships: { select: { workspaceId: true }, take: 1 } },
  })

  const workspaceId = user?.workspace?.id ?? user?.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error("Workspace not configured")

  return { userId, user: user!, workspaceId }
}

export async function createTeleconsultaRoom(appointmentId: string) {
  const { workspaceId, user } = await getAuthContext()

  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, workspaceId },
    include: { patient: { select: { name: true } } },
  })
  if (!appointment) throw new Error("Consulta nao encontrada")

  // If room already exists, return existing info
  if (appointment.videoRoomName && appointment.videoRoomUrl && appointment.videoToken) {
    const ownerToken = await createMeetingToken(appointment.videoRoomName, {
      isOwner: true,
      userName: user.clinicName ?? user.name ?? "Profissional",
      expiresAt: new Date(appointment.date.getTime() + 3 * 60 * 60 * 1000),
    })
    return {
      roomUrl: appointment.videoRoomUrl,
      ownerToken: ownerToken.token,
      videoToken: appointment.videoToken,
    }
  }

  const videoToken = crypto.randomUUID()
  const expiresAt = new Date(appointment.date.getTime() + 3 * 60 * 60 * 1000)

  const room = await createVideoRoom(appointmentId, expiresAt)

  const ownerToken = await createMeetingToken(room.name, {
    isOwner: true,
    userName: user.clinicName ?? user.name ?? "Profissional",
    expiresAt,
  })

  await db.appointment.update({
    where: { id: appointmentId },
    data: {
      videoRoomName: room.name,
      videoRoomUrl: room.url,
      videoToken,
    },
  })

  return {
    roomUrl: room.url,
    ownerToken: ownerToken.token,
    videoToken,
  }
}

export async function getPatientJoinInfo(videoToken: string) {
  const appointment = await db.appointment.findFirst({
    where: { videoToken },
    include: {
      patient: { select: { name: true } },
      workspace: {
        include: {
          user: { select: { name: true, clinicName: true } },
        },
      },
    },
  })

  if (!appointment) throw new Error("Teleconsulta nao encontrada")
  if (!appointment.videoRoomName || !appointment.videoRoomUrl) {
    throw new Error("Sala de video nao configurada")
  }

  // Allow joining from 30 min before until 3 hours after appointment time
  const now = new Date()
  const earliestJoin = new Date(appointment.date.getTime() - 30 * 60 * 1000)
  const latestJoin = new Date(appointment.date.getTime() + 3 * 60 * 60 * 1000)

  if (now < earliestJoin) {
    throw new Error("A teleconsulta ainda nao esta disponivel. Tente novamente mais perto do horario agendado.")
  }
  if (now > latestJoin) {
    throw new Error("O horario desta teleconsulta ja expirou.")
  }

  const expiresAt = new Date(appointment.date.getTime() + 3 * 60 * 60 * 1000)
  const patientName = appointment.patient?.name ?? "Paciente"

  const meetingToken = await createMeetingToken(appointment.videoRoomName, {
    isOwner: false,
    userName: patientName,
    expiresAt,
  })

  // Get professional name from workspace owner
  const professionalName = appointment.workspace?.user?.clinicName ?? appointment.workspace?.user?.name ?? "Profissional"

  return {
    roomUrl: appointment.videoRoomUrl,
    patientToken: meetingToken.token,
    appointmentDate: appointment.date.toISOString(),
    professionalName,
    patientName,
  }
}

export async function endTeleconsulta(appointmentId: string) {
  const { workspaceId } = await getAuthContext()

  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, workspaceId },
  })
  if (!appointment) throw new Error("Consulta nao encontrada")

  await db.appointment.update({
    where: { id: appointmentId },
    data: { status: "completed" },
  })

  // Cleanup: delete Daily room
  if (appointment.videoRoomName) {
    try {
      await deleteVideoRoom(appointment.videoRoomName)
    } catch {
      // Room cleanup is best-effort, don't fail the action
    }
  }

  return { success: true }
}

export async function getTeleconsultaInfo(appointmentId: string) {
  const { workspaceId, user } = await getAuthContext()

  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, workspaceId },
    include: {
      patient: { select: { id: true, name: true } },
    },
  })
  if (!appointment) throw new Error("Consulta nao encontrada")

  let ownerToken: string | null = null
  if (appointment.videoRoomName) {
    try {
      const expiresAt = new Date(appointment.date.getTime() + 3 * 60 * 60 * 1000)
      const token = await createMeetingToken(appointment.videoRoomName, {
        isOwner: true,
        userName: user.clinicName ?? user.name ?? "Profissional",
        expiresAt,
      })
      ownerToken = token.token
    } catch {
      // Room may have expired
    }
  }

  return {
    id: appointment.id,
    date: appointment.date.toISOString(),
    status: appointment.status,
    type: appointment.type,
    patient: appointment.patient,
    procedures: Array.isArray(appointment.procedures)
      ? (appointment.procedures as Record<string, unknown>[]).map((p) => (typeof p === "string" ? p : (p?.name as string) ?? String(p)))
      : [],
    videoRoomName: appointment.videoRoomName,
    videoRoomUrl: appointment.videoRoomUrl,
    videoToken: appointment.videoToken,
    ownerToken,
  }
}
