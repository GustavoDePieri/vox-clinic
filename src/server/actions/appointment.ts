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

export async function getAppointments(page: number = 1, status?: string) {
  const workspaceId = await getWorkspaceId()
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const where: { workspaceId: string; status?: string } = { workspaceId }
  if (status && status !== "all") {
    where.status = status
  }

  const [appointments, total] = await Promise.all([
    db.appointment.findMany({
      where,
      include: {
        patient: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: "desc" },
      skip,
      take: pageSize,
    }),
    db.appointment.count({ where }),
  ])

  return {
    appointments: appointments.map((a) => ({
      id: a.id,
      date: a.date.toISOString(),
      patient: a.patient,
      procedures: a.procedures as string[],
      notes: a.notes,
      aiSummary: a.aiSummary,
      status: a.status,
    })),
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  }
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

export async function checkAppointmentConflicts(date: string) {
  const workspaceId = await getWorkspaceId()
  const targetDate = new Date(date)

  // Check for appointments within ±30 minutes
  const windowMs = 30 * 60 * 1000
  const windowStart = new Date(targetDate.getTime() - windowMs)
  const windowEnd = new Date(targetDate.getTime() + windowMs)

  const conflicts = await db.appointment.findMany({
    where: {
      workspaceId,
      status: { in: ["scheduled", "completed"] },
      date: { gte: windowStart, lte: windowEnd },
    },
    include: {
      patient: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  })

  return conflicts.map((a) => ({
    id: a.id,
    date: a.date.toISOString(),
    patient: a.patient,
    status: a.status,
  }))
}

export async function scheduleAppointment(data: {
  patientId: string
  date: string
  notes?: string
  procedures?: string[]
  forceSchedule?: boolean
}) {
  const workspaceId = await getWorkspaceId()

  // Verify patient belongs to workspace
  const patient = await db.patient.findFirst({
    where: { id: data.patientId, workspaceId },
  })
  if (!patient) throw new Error("Paciente nao encontrado")

  // Check for conflicts unless force-scheduled
  if (!data.forceSchedule) {
    const conflicts = await checkAppointmentConflicts(data.date)
    if (conflicts.length > 0) {
      const names = conflicts.map((c) => c.patient.name).join(", ")
      throw new Error(
        `CONFLICT:Ja existe consulta proxima a este horario (${names}). Deseja agendar mesmo assim?`
      )
    }
  }

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
