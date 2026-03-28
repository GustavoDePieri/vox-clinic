"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { logAudit } from "@/lib/audit"
import { getWorkspaceIdCached } from "@/lib/workspace-cache"
import {
  ERR_UNAUTHORIZED,
  ERR_WORKSPACE_NOT_CONFIGURED,
  ERR_PATIENT_NOT_FOUND,
  ERR_FORM_TEMPLATE_NOT_FOUND,
  ERR_FORM_RESPONSE_NOT_FOUND,
  ERR_FORM_ALREADY_COMPLETED,
  ActionError,
  safeAction,
} from "@/lib/error-messages"

async function getWorkspaceContext() {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)

  const workspaceId = await getWorkspaceIdCached(userId)
  if (!workspaceId) throw new Error(ERR_WORKSPACE_NOT_CONFIGURED)

  return { workspaceId, clerkId: userId }
}

// ─── List form templates for workspace ───

export async function getFormTemplates() {
  const { workspaceId } = await getWorkspaceContext()

  const templates = await db.formTemplate.findMany({
    where: { workspaceId, isActive: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      icon: true,
      fields: true,
      sections: true,
      isDefault: true,
      allowMultiple: true,
      version: true,
      _count: { select: { responses: true } },
    },
  })

  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    icon: t.icon,
    fields: t.fields as unknown[],
    sections: t.sections as unknown[] | null,
    isDefault: t.isDefault,
    allowMultiple: t.allowMultiple,
    version: t.version,
    responseCount: t._count.responses,
  }))
}

// ─── List form responses for a patient ───

export async function getPatientFormResponses(patientId: string) {
  const { workspaceId } = await getWorkspaceContext()

  // Verify patient belongs to workspace
  const patient = await db.patient.findFirst({
    where: { id: patientId, workspaceId },
  })
  if (!patient) throw new Error(ERR_PATIENT_NOT_FOUND)

  const responses = await db.formResponse.findMany({
    where: { patientId, workspaceId },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          category: true,
          icon: true,
          fields: true,
          sections: true,
          version: true,
        },
      },
      appointment: {
        select: {
          id: true,
          date: true,
          procedures: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return responses.map((r) => ({
    id: r.id,
    templateId: r.templateId,
    templateName: r.template.name,
    templateCategory: r.template.category,
    templateIcon: r.template.icon,
    templateFields: r.template.fields as unknown[],
    templateSections: r.template.sections as unknown[] | null,
    templateVersion: r.template.version,
    patientId: r.patientId,
    appointmentId: r.appointmentId,
    appointment: r.appointment
      ? {
          id: r.appointment.id,
          date: r.appointment.date.toISOString(),
          procedures: r.appointment.procedures as string[],
          status: r.appointment.status,
        }
      : null,
    answers: r.answers as Record<string, unknown>,
    status: r.status as "draft" | "completed",
    completedAt: r.completedAt?.toISOString() ?? null,
    completedBy: r.completedBy,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))
}

// ─── Get form responses linked to an appointment ───

export async function getAppointmentFormResponses(appointmentId: string) {
  const { workspaceId } = await getWorkspaceContext()

  const responses = await db.formResponse.findMany({
    where: { appointmentId, workspaceId },
    include: {
      template: {
        select: { id: true, name: true, category: true, fields: true, sections: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return responses.map((r) => ({
    id: r.id,
    templateId: r.templateId,
    templateName: r.template.name,
    templateCategory: r.template.category,
    templateFields: r.template.fields as unknown[],
    templateSections: r.template.sections as unknown[] | null,
    answers: r.answers as Record<string, unknown>,
    status: r.status as "draft" | "completed",
    completedAt: r.completedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }))
}

// ─── Create a new form response (draft) ───

export const createFormResponse = safeAction(
  async (data: {
    templateId: string
    patientId: string
    appointmentId?: string
    answers?: Record<string, unknown>
  }) => {
    const { workspaceId, clerkId } = await getWorkspaceContext()

    // Verify patient
    const patient = await db.patient.findFirst({
      where: { id: data.patientId, workspaceId },
    })
    if (!patient) throw new ActionError(ERR_PATIENT_NOT_FOUND)

    // Verify template
    const template = await db.formTemplate.findFirst({
      where: { id: data.templateId, workspaceId, isActive: true },
    })
    if (!template) throw new ActionError(ERR_FORM_TEMPLATE_NOT_FOUND)

    // Check if allowMultiple is false and response already exists
    if (!template.allowMultiple) {
      const existing = await db.formResponse.findFirst({
        where: {
          templateId: data.templateId,
          patientId: data.patientId,
          workspaceId,
          status: "completed",
        },
      })
      if (existing) {
        throw new ActionError(
          "Este formulario ja foi preenchido para este paciente e nao permite multiplas respostas."
        )
      }
    }

    const response = await db.formResponse.create({
      data: {
        workspaceId,
        templateId: data.templateId,
        patientId: data.patientId,
        appointmentId: data.appointmentId ?? null,
        answers: (data.answers ?? {}) as Prisma.InputJsonValue,
        templateVersion: template.version,
        status: "draft",
      },
    })

    await logAudit({
      workspaceId,
      userId: clerkId,
      action: "create",
      entityType: "FormResponse",
      entityId: response.id,
      details: { templateId: data.templateId, patientId: data.patientId },
    })

    return { id: response.id }
  }
)

// ─── Save draft (update answers) ───

export const saveDraftFormResponse = safeAction(
  async (data: { responseId: string; answers: Record<string, unknown> }) => {
    const { workspaceId } = await getWorkspaceContext()

    const response = await db.formResponse.findFirst({
      where: { id: data.responseId, workspaceId },
    })
    if (!response) throw new ActionError(ERR_FORM_RESPONSE_NOT_FOUND)
    if (response.status === "completed") throw new ActionError(ERR_FORM_ALREADY_COMPLETED)

    await db.formResponse.update({
      where: { id: data.responseId },
      data: { answers: data.answers as Prisma.InputJsonValue },
    })

    return { success: true }
  }
)

// ─── Complete a form response ───

export const completeFormResponse = safeAction(
  async (data: { responseId: string; answers: Record<string, unknown> }) => {
    const { workspaceId, clerkId } = await getWorkspaceContext()

    const response = await db.formResponse.findFirst({
      where: { id: data.responseId, workspaceId },
    })
    if (!response) throw new ActionError(ERR_FORM_RESPONSE_NOT_FOUND)
    if (response.status === "completed") throw new ActionError(ERR_FORM_ALREADY_COMPLETED)

    await db.formResponse.update({
      where: { id: data.responseId },
      data: {
        answers: data.answers as Prisma.InputJsonValue,
        status: "completed",
        completedAt: new Date(),
        completedBy: clerkId,
      },
    })

    await logAudit({
      workspaceId,
      userId: clerkId,
      action: "update",
      entityType: "FormResponse",
      entityId: data.responseId,
      details: { action: "completed" },
    })

    return { success: true }
  }
)

// ─── Submit a new form response (create + complete in one step) ───

export const submitFormResponse = safeAction(
  async (data: {
    templateId: string
    patientId: string
    appointmentId?: string
    answers: Record<string, unknown>
  }) => {
    const { workspaceId, clerkId } = await getWorkspaceContext()

    // Verify patient
    const patient = await db.patient.findFirst({
      where: { id: data.patientId, workspaceId },
    })
    if (!patient) throw new ActionError(ERR_PATIENT_NOT_FOUND)

    // Verify template
    const template = await db.formTemplate.findFirst({
      where: { id: data.templateId, workspaceId, isActive: true },
    })
    if (!template) throw new ActionError(ERR_FORM_TEMPLATE_NOT_FOUND)

    // Check allowMultiple
    if (!template.allowMultiple) {
      const existing = await db.formResponse.findFirst({
        where: {
          templateId: data.templateId,
          patientId: data.patientId,
          workspaceId,
          status: "completed",
        },
      })
      if (existing) {
        throw new ActionError(
          "Este formulario ja foi preenchido para este paciente e nao permite multiplas respostas."
        )
      }
    }

    const response = await db.formResponse.create({
      data: {
        workspaceId,
        templateId: data.templateId,
        patientId: data.patientId,
        appointmentId: data.appointmentId ?? null,
        answers: data.answers as Prisma.InputJsonValue,
        templateVersion: template.version,
        status: "completed",
        completedAt: new Date(),
        completedBy: clerkId,
      },
    })

    await logAudit({
      workspaceId,
      userId: clerkId,
      action: "create",
      entityType: "FormResponse",
      entityId: response.id,
      details: { templateId: data.templateId, patientId: data.patientId, action: "submitted" },
    })

    return { id: response.id }
  }
)

// ─── Delete a draft form response ───

export const deleteFormResponse = safeAction(
  async (responseId: string) => {
    const { workspaceId, clerkId } = await getWorkspaceContext()

    const response = await db.formResponse.findFirst({
      where: { id: responseId, workspaceId },
    })
    if (!response) throw new ActionError(ERR_FORM_RESPONSE_NOT_FOUND)

    if (response.status === "completed") {
      throw new ActionError("Formularios preenchidos nao podem ser excluidos.")
    }

    await db.formResponse.delete({ where: { id: responseId } })

    await logAudit({
      workspaceId,
      userId: clerkId,
      action: "delete",
      entityType: "FormResponse",
      entityId: responseId,
      details: { templateId: response.templateId },
    })

    return { success: true }
  }
)
