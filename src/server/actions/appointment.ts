"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

async function getWorkspaceId() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true },
  })
  if (!user?.workspace) throw new Error("Workspace not configured")

  return user.workspace.id
}

export async function getAppointmentsByDateRange(startDate: string, endDate: string) {
  const workspaceId = await getWorkspaceId()

  const appointments = await db.appointment.findMany({
    where: {
      workspaceId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { date: "asc" },
  })

  return appointments.map((a) => ({
    id: a.id,
    date: a.date.toISOString(),
    patient: a.patient,
    procedures: a.procedures as string[],
    notes: a.notes,
    status: a.status,
  }))
}

export async function scheduleAppointment(data: {
  patientId: string
  date: string
  notes?: string
  procedures?: string[]
}) {
  const workspaceId = await getWorkspaceId()

  // Verify patient belongs to workspace
  const patient = await db.patient.findFirst({
    where: { id: data.patientId, workspaceId },
  })
  if (!patient) throw new Error("Paciente nao encontrado")

  const appointment = await db.appointment.create({
    data: {
      workspaceId,
      patientId: data.patientId,
      date: new Date(data.date),
      notes: data.notes || null,
      procedures: data.procedures || [],
      status: "scheduled",
    },
    include: {
      patient: {
        select: { id: true, name: true },
      },
    },
  })

  return {
    id: appointment.id,
    date: appointment.date.toISOString(),
    patient: appointment.patient,
    procedures: appointment.procedures as string[],
    notes: appointment.notes,
    status: appointment.status,
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const workspaceId = await getWorkspaceId()

  const validStatuses = ["scheduled", "completed", "cancelled", "no_show"]
  if (!validStatuses.includes(status)) {
    throw new Error("Status invalido")
  }

  const existing = await db.appointment.findFirst({
    where: { id: appointmentId, workspaceId },
  })
  if (!existing) throw new Error("Consulta nao encontrada")

  const updated = await db.appointment.update({
    where: { id: appointmentId },
    data: { status },
  })

  return { id: updated.id, status: updated.status }
}

export async function deleteAppointment(appointmentId: string) {
  const workspaceId = await getWorkspaceId()

  const existing = await db.appointment.findFirst({
    where: { id: appointmentId, workspaceId },
  })
  if (!existing) throw new Error("Consulta nao encontrada")

  await db.appointment.delete({
    where: { id: appointmentId },
  })

  return { success: true }
}
