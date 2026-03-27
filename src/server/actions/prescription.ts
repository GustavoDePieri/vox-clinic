"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"

async function getAuthContext() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true, memberships: { select: { workspaceId: true }, take: 1 } },
  })
  if (!user) throw new Error("User not found")
  const workspaceId = user.workspace?.id ?? user.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error("Workspace not configured")

  return { userId, user, workspaceId }
}

export async function createPrescription(data: {
  patientId: string
  appointmentId?: string
  medications: { name: string; dosage: string; frequency: string; duration: string; notes?: string }[]
  notes?: string
}) {
  const { userId, workspaceId } = await getAuthContext()

  const patient = await db.patient.findFirst({
    where: { id: data.patientId, workspaceId },
  })
  if (!patient) throw new Error("Paciente nao encontrado")

  if (!data.medications.length) throw new Error("Adicione pelo menos um medicamento")

  const prescription = await db.prescription.create({
    data: {
      patientId: data.patientId,
      workspaceId,
      appointmentId: data.appointmentId || null,
      medications: data.medications,
      notes: data.notes || null,
    },
  })

  await logAudit({
    workspaceId,
    userId,
    action: "prescription.created",
    entityType: "Prescription",
    entityId: prescription.id,
  })

  return { id: prescription.id }
}

export async function getPrescription(id: string) {
  const { userId, user, workspaceId } = await getAuthContext()

  const prescription = await db.prescription.findFirst({
    where: { id, workspaceId },
    include: {
      patient: {
        select: { name: true, document: true },
      },
    },
  })
  if (!prescription) throw new Error("Prescricao nao encontrada")

  return {
    id: prescription.id,
    patientName: prescription.patient.name,
    patientDocument: prescription.patient.document,
    medications: prescription.medications as { name: string; dosage: string; frequency: string; duration: string; notes?: string }[],
    notes: prescription.notes,
    createdAt: prescription.createdAt.toISOString(),
    clinicName: user.clinicName ?? "Clinica",
    profession: user.profession ?? "Profissional de Saude",
    doctorName: user.name,
  }
}

export async function getPatientPrescriptions(patientId: string) {
  const { workspaceId } = await getAuthContext()

  const patient = await db.patient.findFirst({
    where: { id: patientId, workspaceId },
  })
  if (!patient) throw new Error("Paciente nao encontrado")

  const prescriptions = await db.prescription.findMany({
    where: { patientId, workspaceId },
    orderBy: { createdAt: "desc" },
  })

  return prescriptions.map((p) => ({
    id: p.id,
    medications: p.medications as { name: string; dosage: string; frequency: string; duration: string; notes?: string }[],
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
  }))
}

export async function deletePrescription(id: string) {
  const { userId, workspaceId } = await getAuthContext()

  const prescription = await db.prescription.findFirst({
    where: { id, workspaceId },
  })
  if (!prescription) throw new Error("Prescricao nao encontrada")

  await db.prescription.delete({ where: { id } })

  await logAudit({
    workspaceId,
    userId,
    action: "prescription.deleted",
    entityType: "Prescription",
    entityId: id,
  })

  return { success: true }
}
