"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { ActionError, safeAction } from "@/lib/error-messages"
import type { FormField, FormSection } from "@/types/forms"

// ─── Helpers ───

async function getWorkspaceId() {
  const { userId } = await auth()
  if (!userId) throw new Error("Nao autorizado")
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true },
  })
  if (!user?.workspace) throw new Error("Workspace nao encontrado")
  return user.workspace.id
}

// ─── Get all templates for workspace ───

export const getFormTemplates = safeAction(async () => {
  const workspaceId = await getWorkspaceId()
  const templates = await db.formTemplate.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      fields: true,
      isActive: true,
      isDefault: true,
      version: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { responses: true } },
    },
  })
  const items = templates.map((t) => ({
    ...t,
    responseCount: t._count.responses,
    fieldCount: Array.isArray(t.fields)
      ? (t.fields as unknown as FormField[]).filter(
          (f) => f.type !== "section_header" && f.type !== "rich_text"
        ).length
      : 0,
  }))
  return { items }
})

// ─── Get single template ───

export const getFormTemplate = safeAction(async (id: string) => {
  const workspaceId = await getWorkspaceId()
  const template = await db.formTemplate.findFirst({
    where: { id, workspaceId },
  })
  if (!template) throw new ActionError("Formulario nao encontrado")
  return template
})

// ─── Create template ───

export const createFormTemplate = safeAction(
  async (data: {
    name: string
    description?: string
    category?: string
    fields?: FormField[]
    sections?: FormSection[]
  }) => {
    const workspaceId = await getWorkspaceId()
    if (!data.name.trim()) throw new ActionError("Nome e obrigatorio")

    const template = await db.formTemplate.create({
      data: {
        workspaceId,
        name: data.name.trim(),
        description: data.description ?? null,
        category: data.category ?? "custom",
        fields: (data.fields ?? []) as unknown as Prisma.InputJsonValue,
        sections: (data.sections ?? []) as unknown as Prisma.InputJsonValue,
      },
    })
    return { id: template.id, name: template.name }
  }
)

// ─── Update template ───

export const updateFormTemplate = safeAction(
  async (
    id: string,
    data: {
      name?: string
      description?: string
      category?: string
      fields?: FormField[]
      sections?: FormSection[]
      isActive?: boolean
      isDefault?: boolean
    }
  ) => {
    const workspaceId = await getWorkspaceId()
    const existing = await db.formTemplate.findFirst({
      where: { id, workspaceId },
    })
    if (!existing) throw new ActionError("Formulario nao encontrado")

    const update: Prisma.FormTemplateUpdateInput = {}
    if (data.name !== undefined) update.name = data.name.trim()
    if (data.description !== undefined) update.description = data.description
    if (data.category !== undefined) update.category = data.category
    if (data.fields !== undefined)
      update.fields = data.fields as unknown as Prisma.InputJsonValue
    if (data.sections !== undefined)
      update.sections = data.sections as unknown as Prisma.InputJsonValue
    if (data.isActive !== undefined) update.isActive = data.isActive
    if (data.isDefault !== undefined) {
      if (data.isDefault) {
        // Unset previous default
        await db.formTemplate.updateMany({
          where: { workspaceId, isDefault: true },
          data: { isDefault: false },
        })
      }
      update.isDefault = data.isDefault
    }

    const template = await db.formTemplate.update({
      where: { id },
      data: update,
    })
    return { id: template.id, name: template.name }
  }
)

// ─── Duplicate template ───

export const duplicateFormTemplate = safeAction(async (id: string) => {
  const workspaceId = await getWorkspaceId()
  const source = await db.formTemplate.findFirst({
    where: { id, workspaceId },
  })
  if (!source) throw new ActionError("Formulario nao encontrado")

  const template = await db.formTemplate.create({
    data: {
      workspaceId,
      name: `${source.name} (copia)`,
      description: source.description,
      category: source.category,
      fields: source.fields as unknown as Prisma.InputJsonValue,
      sections: source.sections as unknown as Prisma.InputJsonValue,
    },
  })
  return { id: template.id, name: template.name }
})

// ─── Delete template ───

export const deleteFormTemplate = safeAction(async (id: string) => {
  const workspaceId = await getWorkspaceId()
  const existing = await db.formTemplate.findFirst({
    where: { id, workspaceId },
    select: { id: true, _count: { select: { responses: true } } },
  })
  if (!existing) throw new ActionError("Formulario nao encontrado")
  if (existing._count.responses > 0) {
    throw new ActionError(
      "Nao e possivel excluir um formulario com respostas. Desative-o em vez disso."
    )
  }
  await db.formTemplate.delete({ where: { id } })
  return { success: true }
})

// ─── Import from library ───

export const importFromLibrary = safeAction(
  async (data: {
    name: string
    description?: string
    category: string
    fields: FormField[]
    sections?: FormSection[]
  }) => {
    const workspaceId = await getWorkspaceId()
    const template = await db.formTemplate.create({
      data: {
        workspaceId,
        name: data.name,
        description: data.description ?? null,
        category: data.category,
        fields: data.fields as unknown as Prisma.InputJsonValue,
        sections: (data.sections ?? []) as unknown as Prisma.InputJsonValue,
      },
    })
    return { id: template.id, name: template.name }
  }
)
