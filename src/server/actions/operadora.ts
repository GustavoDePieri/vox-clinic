"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ERR_UNAUTHORIZED, ERR_WORKSPACE_NOT_CONFIGURED, ERR_OPERADORA_NOT_FOUND, ERR_OPERADORA_DUPLICATE_ANS, ActionError, safeAction } from "@/lib/error-messages"
import { logAudit } from "@/lib/audit"

async function getAuthContext() {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true, memberships: { select: { workspaceId: true }, take: 1 } },
  })

  const workspaceId = user?.workspace?.id ?? user?.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error(ERR_WORKSPACE_NOT_CONFIGURED)

  return { workspaceId, userId: user!.id }
}

/**
 * List all operadoras for workspace
 */
export async function getOperadoras() {
  const { workspaceId } = await getAuthContext()

  const operadoras = await db.operadora.findMany({
    where: { workspaceId },
    orderBy: { nome: "asc" },
    include: { _count: { select: { guides: true } } },
  })

  return operadoras.map((op) => ({
    id: op.id,
    registroAns: op.registroAns,
    nome: op.nome,
    cnpj: op.cnpj,
    isActive: op.isActive,
    guidesCount: op._count.guides,
    createdAt: op.createdAt.toISOString(),
  }))
}

/**
 * Create a new operadora
 */
export const createOperadora = safeAction(async (data: {
  registroAns: string
  nome: string
  cnpj?: string
}) => {
  const { workspaceId, userId } = await getAuthContext()

  // Validate ANS: 6 digits
  const ansDigits = data.registroAns.replace(/\D/g, "")
  if (ansDigits.length !== 6) {
    throw new ActionError("Registro ANS deve ter exatamente 6 digitos.")
  }

  if (!data.nome.trim()) {
    throw new ActionError("Nome da operadora e obrigatorio.")
  }

  // Check duplicate ANS in workspace
  const existing = await db.operadora.findUnique({
    where: { workspaceId_registroAns: { workspaceId, registroAns: ansDigits } },
  })
  if (existing) {
    throw new ActionError(ERR_OPERADORA_DUPLICATE_ANS)
  }

  const operadora = await db.operadora.create({
    data: {
      workspaceId,
      registroAns: ansDigits,
      nome: data.nome.trim(),
      cnpj: data.cnpj?.replace(/\D/g, "") || null,
    },
  })

  logAudit({
    workspaceId,
    userId,
    action: "operadora.create",
    entityType: "Operadora",
    entityId: operadora.id,
    details: { registroAns: ansDigits, nome: data.nome.trim() },
  })

  return { id: operadora.id, nome: operadora.nome, registroAns: operadora.registroAns }
})

/**
 * Update an operadora
 */
export const updateOperadora = safeAction(async (id: string, data: {
  nome?: string
  cnpj?: string | null
  isActive?: boolean
}) => {
  const { workspaceId, userId } = await getAuthContext()

  const operadora = await db.operadora.findFirst({
    where: { id, workspaceId },
  })
  if (!operadora) throw new ActionError(ERR_OPERADORA_NOT_FOUND)

  const updateData: Record<string, unknown> = {}
  if (data.nome !== undefined) {
    if (!data.nome.trim()) throw new ActionError("Nome da operadora e obrigatorio.")
    updateData.nome = data.nome.trim()
  }
  if (data.cnpj !== undefined) {
    updateData.cnpj = data.cnpj?.replace(/\D/g, "") || null
  }
  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive
  }

  await db.operadora.update({
    where: { id },
    data: updateData,
  })

  logAudit({
    workspaceId,
    userId,
    action: "operadora.update",
    entityType: "Operadora",
    entityId: id,
    details: updateData,
  })

  return { success: true }
})

/**
 * Delete (soft-delete) an operadora by setting isActive = false.
 * Hard delete only if no guides are linked.
 */
export const deleteOperadora = safeAction(async (id: string) => {
  const { workspaceId, userId } = await getAuthContext()

  const operadora = await db.operadora.findFirst({
    where: { id, workspaceId },
    include: { _count: { select: { guides: true } } },
  })
  if (!operadora) throw new ActionError(ERR_OPERADORA_NOT_FOUND)

  if (operadora._count.guides > 0) {
    // Soft delete: set isActive = false
    await db.operadora.update({
      where: { id },
      data: { isActive: false },
    })
  } else {
    // Hard delete: no guides linked
    await db.operadora.delete({ where: { id } })
  }

  logAudit({
    workspaceId,
    userId,
    action: "operadora.delete",
    entityType: "Operadora",
    entityId: id,
    details: { hadGuides: operadora._count.guides > 0 },
  })

  return { success: true }
})
