"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"
import { getWorkspaceIdCached } from "@/lib/workspace-cache"
import {
  ERR_UNAUTHORIZED,
  ERR_WORKSPACE_NOT_CONFIGURED,
  ActionError,
  safeAction,
} from "@/lib/error-messages"
import { Prisma } from "@prisma/client"
import type { FormField, FormSection } from "@/types/forms"

// ============================================================
// Auth helper (same pattern as agenda.ts — no shared imports on Vercel)
// ============================================================

async function getAuthContext() {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)

  const workspaceId = await getWorkspaceIdCached(userId)
  if (!workspaceId) throw new Error(ERR_WORKSPACE_NOT_CONFIGURED)

  return { userId, workspaceId }
}

// ============================================================
// Error constants
// ============================================================

const ERR_TEMPLATE_NOT_FOUND = "Formulario nao encontrado."
const ERR_RESPONSE_NOT_FOUND = "Resposta de formulario nao encontrada."
const ERR_TEMPLATE_NAME_REQUIRED = "Nome do formulario e obrigatorio."
const ERR_TEMPLATE_FIELDS_REQUIRED = "O formulario precisa ter pelo menos um campo."
const ERR_RESPONSE_ALREADY_COMPLETED = "Esta resposta ja foi finalizada."

// ============================================================
// FormTemplate CRUD
// ============================================================

export async function getFormTemplates() {
  const { workspaceId } = await getAuthContext()

  const templates = await db.formTemplate.findMany({
    where: { workspaceId, isActive: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { responses: true } },
    },
  })

  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    icon: t.icon,
    fields: t.fields as unknown as FormField[],
    sections: t.sections as unknown as FormSection[] | null,
    isActive: t.isActive,
    isDefault: t.isDefault,
    allowMultiple: t.allowMultiple,
    version: t.version,
    responseCount: t._count.responses,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))
}

export async function getFormTemplate(id: string) {
  const { workspaceId } = await getAuthContext()

  const t = await db.formTemplate.findFirst({
    where: { id, workspaceId },
    include: {
      _count: { select: { responses: true } },
    },
  })

  if (!t) throw new Error(ERR_TEMPLATE_NOT_FOUND)

  return {
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    icon: t.icon,
    fields: t.fields as unknown as FormField[],
    sections: t.sections as unknown as FormSection[] | null,
    isActive: t.isActive,
    isDefault: t.isDefault,
    allowMultiple: t.allowMultiple,
    version: t.version,
    responseCount: t._count.responses,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }
}

export const createFormTemplate = safeAction(
  async (data: {
    name: string
    description?: string
    category?: string
    icon?: string
    fields: FormField[]
    sections?: FormSection[]
    isDefault?: boolean
    allowMultiple?: boolean
  }) => {
    const { userId, workspaceId } = await getAuthContext()

    if (!data.name.trim()) throw new ActionError(ERR_TEMPLATE_NAME_REQUIRED)
    if (!data.fields || data.fields.length === 0)
      throw new ActionError(ERR_TEMPLATE_FIELDS_REQUIRED)

    // If setting as default, unset any existing default in same category
    if (data.isDefault) {
      await db.formTemplate.updateMany({
        where: {
          workspaceId,
          isDefault: true,
          ...(data.category ? { category: data.category } : {}),
        },
        data: { isDefault: false },
      })
    }

    const template = await db.formTemplate.create({
      data: {
        workspaceId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        category: data.category || null,
        icon: data.icon || null,
        fields: data.fields as unknown as Prisma.InputJsonValue,
        sections: data.sections ? (data.sections as unknown as Prisma.InputJsonValue) : undefined,
        isDefault: data.isDefault ?? false,
        allowMultiple: data.allowMultiple ?? true,
      },
    })

    await logAudit({
      workspaceId,
      userId,
      action: "formTemplate.created",
      entityType: "FormTemplate",
      entityId: template.id,
      details: { name: template.name, category: template.category },
    })

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      version: template.version,
    }
  }
)

export const updateFormTemplate = safeAction(
  async (
    id: string,
    data: {
      name?: string
      description?: string
      category?: string
      icon?: string
      fields?: FormField[]
      sections?: FormSection[]
      isDefault?: boolean
      allowMultiple?: boolean
    }
  ) => {
    const { userId, workspaceId } = await getAuthContext()

    const existing = await db.formTemplate.findFirst({
      where: { id, workspaceId },
    })
    if (!existing) throw new ActionError(ERR_TEMPLATE_NOT_FOUND)

    if (data.name !== undefined && !data.name.trim())
      throw new ActionError(ERR_TEMPLATE_NAME_REQUIRED)

    if (data.fields !== undefined && data.fields.length === 0)
      throw new ActionError(ERR_TEMPLATE_FIELDS_REQUIRED)

    // If setting as default, unset others
    if (data.isDefault) {
      const category = data.category ?? existing.category
      await db.formTemplate.updateMany({
        where: {
          workspaceId,
          isDefault: true,
          id: { not: id },
          ...(category ? { category } : {}),
        },
        data: { isDefault: false },
      })
    }

    // Increment version if fields changed
    const shouldBumpVersion =
      data.fields !== undefined &&
      JSON.stringify(data.fields) !== JSON.stringify(existing.fields)

    const template = await db.formTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && {
          description: data.description?.trim() || null,
        }),
        ...(data.category !== undefined && { category: data.category || null }),
        ...(data.icon !== undefined && { icon: data.icon || null }),
        ...(data.fields !== undefined && { fields: data.fields as unknown as Prisma.InputJsonValue }),
        ...(data.sections !== undefined && {
          sections: data.sections ? (data.sections as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.allowMultiple !== undefined && {
          allowMultiple: data.allowMultiple,
        }),
        ...(shouldBumpVersion && { version: existing.version + 1 }),
      },
    })

    await logAudit({
      workspaceId,
      userId,
      action: "formTemplate.updated",
      entityType: "FormTemplate",
      entityId: template.id,
      details: {
        name: template.name,
        versionBumped: shouldBumpVersion,
        newVersion: template.version,
      },
    })

    return {
      id: template.id,
      name: template.name,
      version: template.version,
    }
  }
)

export const deleteFormTemplate = safeAction(async (id: string) => {
  const { userId, workspaceId } = await getAuthContext()

  const existing = await db.formTemplate.findFirst({
    where: { id, workspaceId },
  })
  if (!existing) throw new ActionError(ERR_TEMPLATE_NOT_FOUND)

  // Soft delete
  await db.formTemplate.update({
    where: { id },
    data: { isActive: false, isDefault: false },
  })

  await logAudit({
    workspaceId,
    userId,
    action: "formTemplate.deleted",
    entityType: "FormTemplate",
    entityId: id,
    details: { name: existing.name },
  })

  return { success: true }
})

// ============================================================
// FormResponse CRUD
// ============================================================

export async function getFormResponses(filters?: {
  patientId?: string
  appointmentId?: string
  templateId?: string
}) {
  const { workspaceId } = await getAuthContext()

  const responses = await db.formResponse.findMany({
    where: {
      workspaceId,
      ...(filters?.patientId && { patientId: filters.patientId }),
      ...(filters?.appointmentId && { appointmentId: filters.appointmentId }),
      ...(filters?.templateId && { templateId: filters.templateId }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      template: { select: { name: true, category: true } },
    },
  })

  return responses.map((r) => ({
    id: r.id,
    templateId: r.templateId,
    templateName: r.template.name,
    templateCategory: r.template.category,
    patientId: r.patientId,
    appointmentId: r.appointmentId,
    answers: r.answers as Record<string, unknown>,
    templateVersion: r.templateVersion,
    status: r.status,
    completedAt: r.completedAt?.toISOString() ?? null,
    completedBy: r.completedBy,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))
}

export async function getFormResponse(id: string) {
  const { workspaceId } = await getAuthContext()

  const r = await db.formResponse.findFirst({
    where: { id, workspaceId },
    include: {
      template: { select: { name: true, fields: true, sections: true, version: true } },
    },
  })

  if (!r) throw new Error(ERR_RESPONSE_NOT_FOUND)

  return {
    id: r.id,
    templateId: r.templateId,
    templateName: r.template.name,
    templateFields: r.template.fields as unknown as FormField[],
    templateSections: r.template.sections as unknown as FormSection[] | null,
    templateCurrentVersion: r.template.version,
    patientId: r.patientId,
    appointmentId: r.appointmentId,
    answers: r.answers as Record<string, unknown>,
    templateVersion: r.templateVersion,
    status: r.status,
    completedAt: r.completedAt?.toISOString() ?? null,
    completedBy: r.completedBy,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export const saveFormResponse = safeAction(
  async (data: {
    id?: string // if updating existing draft
    templateId: string
    patientId: string
    appointmentId?: string
    answers: Record<string, unknown>
  }) => {
    const { userId, workspaceId } = await getAuthContext()

    // Validate template exists
    const template = await db.formTemplate.findFirst({
      where: { id: data.templateId, workspaceId },
    })
    if (!template) throw new ActionError(ERR_TEMPLATE_NOT_FOUND)

    // Validate patient exists
    const patient = await db.patient.findFirst({
      where: { id: data.patientId, workspaceId },
    })
    if (!patient) throw new ActionError("Paciente nao encontrado.")

    if (data.id) {
      // Update existing draft
      const existing = await db.formResponse.findFirst({
        where: { id: data.id, workspaceId },
      })
      if (!existing) throw new ActionError(ERR_RESPONSE_NOT_FOUND)
      if (existing.status === "completed")
        throw new ActionError(ERR_RESPONSE_ALREADY_COMPLETED)

      const updated = await db.formResponse.update({
        where: { id: data.id },
        data: {
          answers: data.answers as unknown as Prisma.InputJsonValue,
          templateVersion: template.version,
        },
      })

      return { id: updated.id, status: updated.status }
    }

    // Create new response
    const response = await db.formResponse.create({
      data: {
        workspaceId,
        templateId: data.templateId,
        patientId: data.patientId,
        appointmentId: data.appointmentId || null,
        answers: data.answers as unknown as Prisma.InputJsonValue,
        templateVersion: template.version,
        status: "draft",
      },
    })

    await logAudit({
      workspaceId,
      userId,
      action: "formResponse.created",
      entityType: "FormResponse",
      entityId: response.id,
      details: {
        templateId: data.templateId,
        templateName: template.name,
        patientId: data.patientId,
      },
    })

    return { id: response.id, status: response.status }
  }
)

export const completeFormResponse = safeAction(async (id: string) => {
  const { userId, workspaceId } = await getAuthContext()

  const existing = await db.formResponse.findFirst({
    where: { id, workspaceId },
    include: { template: { select: { name: true, fields: true } } },
  })
  if (!existing) throw new ActionError(ERR_RESPONSE_NOT_FOUND)
  if (existing.status === "completed")
    throw new ActionError(ERR_RESPONSE_ALREADY_COMPLETED)

  // Validate required fields
  const fields = existing.template.fields as unknown as FormField[]
  const answers = existing.answers as Record<string, unknown>
  const missingRequired: string[] = []

  for (const field of fields) {
    if (!field.required) continue
    if (field.type === "section_header" || field.type === "rich_text") continue

    // Check conditional visibility — skip validation if field is hidden
    if (field.conditional) {
      const depValue = answers[field.conditional.dependsOn]
      const condMet =
        field.conditional.operator === "equals"
          ? depValue === field.conditional.value
          : depValue !== field.conditional.value
      if (!condMet) continue
    }

    const value = answers[field.id]
    if (value === undefined || value === null || value === "") {
      missingRequired.push(field.label)
    }
  }

  if (missingRequired.length > 0) {
    throw new ActionError(
      `Campos obrigatorios nao preenchidos: ${missingRequired.join(", ")}`
    )
  }

  const updated = await db.formResponse.update({
    where: { id },
    data: {
      status: "completed",
      completedAt: new Date(),
      completedBy: userId,
    },
  })

  await logAudit({
    workspaceId,
    userId,
    action: "formResponse.completed",
    entityType: "FormResponse",
    entityId: id,
    details: {
      templateName: existing.template.name,
      patientId: existing.patientId,
    },
  })

  return { id: updated.id, status: updated.status }
})
