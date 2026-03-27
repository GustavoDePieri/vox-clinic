"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"

export async function exportPatientData(patientId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true, memberships: { select: { workspaceId: true }, take: 1 } },
  })
  const workspaceId = user?.workspace?.id ?? user?.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error("Workspace not configured")

  const patient = await db.patient.findFirst({
    where: { id: patientId, workspaceId },
    include: {
      appointments: {
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          procedures: true,
          notes: true,
          aiSummary: true,
          transcript: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      recordings: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          duration: true,
          transcript: true,
          status: true,
          createdAt: true,
        },
      },
    },
  })

  if (!patient) throw new Error("Paciente nao encontrado")

  const auditLogs = await db.auditLog.findMany({
    where: {
      workspaceId,
      entityType: "Patient",
      entityId: patientId,
    },
    orderBy: { createdAt: "desc" },
    select: {
      action: true,
      createdAt: true,
      details: true,
    },
  })

  const consentRecords = await db.consentRecord.findMany({
    where: {
      workspaceId,
      patientId,
    },
    orderBy: { givenAt: "desc" },
    select: {
      consentType: true,
      givenAt: true,
      details: true,
    },
  })

  await logAudit({
    workspaceId,
    userId,
    action: "patient.data_exported",
    entityType: "Patient",
    entityId: patientId,
  })

  return {
    exportDate: new Date().toISOString(),
    lgpdNotice: "Exportacao de dados conforme Lei 13.709/2018 (LGPD) - Direito a portabilidade de dados.",
    patient: {
      id: patient.id,
      name: patient.name,
      document: patient.document,
      phone: patient.phone,
      email: patient.email,
      birthDate: patient.birthDate,
      customData: patient.customData,
      alerts: patient.alerts,
      isActive: patient.isActive,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    },
    appointments: patient.appointments,
    recordings: patient.recordings,
    auditLogs,
    consentRecords,
  }
}
