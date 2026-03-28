"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { appointmentReminder } from "@/lib/email-templates"
import { ERR_UNAUTHORIZED, ERR_WORKSPACE_NOT_CONFIGURED, ERR_APPOINTMENT_NOT_FOUND } from "@/lib/error-messages"

export async function sendAppointmentReminder(appointmentId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true, memberships: { select: { workspaceId: true }, take: 1 } },
  })
  const workspaceId = user?.workspace?.id ?? user?.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error(ERR_WORKSPACE_NOT_CONFIGURED)

  const appointment = await db.appointment.findFirst({
    where: {
      id: appointmentId,
      workspaceId,
    },
    include: { patient: true },
  })

  if (!appointment) throw new Error(ERR_APPOINTMENT_NOT_FOUND)

  if (!appointment.patient.email) {
    return { success: false, message: "Paciente não possui email cadastrado" }
  }

  const html = appointmentReminder({
    patientName: appointment.patient.name,
    appointmentDate: appointment.date,
    clinicName: user!.clinicName || "Clínica",
  })

  await sendEmail({
    to: appointment.patient.email,
    subject: `Lembrete: Consulta agendada - ${user!.clinicName || "VoxClinic"}`,
    html,
  })

  return { success: true, message: "Lembrete enviado com sucesso" }
}

export async function sendBulkReminders(date: string) {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true, memberships: { select: { workspaceId: true }, take: 1 } },
  })
  const workspaceId = user?.workspace?.id ?? user?.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error(ERR_WORKSPACE_NOT_CONFIGURED)

  const targetDate = new Date(date)
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  const appointments = await db.appointment.findMany({
    where: {
      workspaceId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: { patient: true },
  })

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const appointment of appointments) {
    if (!appointment.patient.email) {
      skipped++
      continue
    }

    try {
      const html = appointmentReminder({
        patientName: appointment.patient.name,
        appointmentDate: appointment.date,
        clinicName: user!.clinicName || "Clínica",
      })

      await sendEmail({
        to: appointment.patient.email,
        subject: `Lembrete: Consulta agendada - ${user!.clinicName || "VoxClinic"}`,
        html,
      })

      sent++
    } catch (error) {
      errors.push(
        `Falha ao enviar para ${appointment.patient.name}: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      )
    }
  }

  return {
    success: true,
    total: appointments.length,
    sent,
    skipped,
    errors,
  }
}
