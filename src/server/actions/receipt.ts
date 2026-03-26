"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function generateReceiptData(appointmentId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true },
  })
  if (!user?.workspace) throw new Error("Workspace not configured")

  const appointment = await db.appointment.findFirst({
    where: {
      id: appointmentId,
      workspaceId: user.workspace.id,
    },
    include: {
      patient: {
        select: { name: true, document: true },
      },
    },
  })

  if (!appointment) throw new Error("Consulta nao encontrada")

  return {
    clinicName: user.clinicName ?? "Clinica",
    profession: user.profession ?? user.workspace.professionType,
    patientName: appointment.patient.name,
    patientDocument: appointment.patient.document,
    date: appointment.date.toISOString(),
    procedures: appointment.procedures as string[],
    price: appointment.price,
    appointmentId: appointment.id,
  }
}
