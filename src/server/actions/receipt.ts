"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ERR_UNAUTHORIZED, ERR_WORKSPACE_NOT_CONFIGURED, ERR_APPOINTMENT_NOT_FOUND } from "@/lib/error-messages"

export async function generateReceiptData(appointmentId: string) {
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
    include: {
      patient: {
        select: { name: true, document: true },
      },
    },
  })

  if (!appointment) throw new Error(ERR_APPOINTMENT_NOT_FOUND)

  // Load workspace professionType if not available via ownership (member fallback)
  const professionType = user?.workspace?.professionType
    ?? (await db.workspace.findUnique({ where: { id: workspaceId }, select: { professionType: true } }))?.professionType
    ?? "Profissional"

  return {
    clinicName: user?.clinicName ?? "Clinica",
    profession: user?.profession ?? professionType,
    patientName: appointment.patient.name,
    patientDocument: appointment.patient.document,
    date: appointment.date.toISOString(),
    procedures: appointment.procedures as string[],
    price: appointment.price,
    appointmentId: appointment.id,
  }
}
