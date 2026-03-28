"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ERR_UNAUTHORIZED, ERR_WORKSPACE_NOT_CONFIGURED, ActionError, safeAction } from "@/lib/error-messages"
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
 * Get TISS config for workspace
 */
export async function getTissConfig() {
  const { workspaceId } = await getAuthContext()

  const config = await db.tissConfig.findUnique({
    where: { workspaceId },
  })

  if (!config) return null

  return {
    id: config.id,
    cnes: config.cnes,
    codigoPrestador: config.codigoPrestador,
    cbos: config.cbos,
    conselhoProfissional: config.conselhoProfissional,
    numeroConselho: config.numeroConselho,
    ufConselho: config.ufConselho,
    versaoTiss: config.versaoTiss,
    sequencialGuia: config.sequencialGuia,
    isActive: config.isActive,
  }
}

/**
 * Save (upsert) TISS config for workspace
 */
export const saveTissConfig = safeAction(async (data: {
  cnes?: string
  codigoPrestador?: string
  cbos?: string
  conselhoProfissional?: string
  numeroConselho?: string
  ufConselho?: string
}) => {
  const { workspaceId, userId } = await getAuthContext()

  // Validate CNES: 7 digits if provided
  if (data.cnes) {
    const cnesDigits = data.cnes.replace(/\D/g, "")
    if (cnesDigits.length !== 7) {
      throw new ActionError("CNES deve ter exatamente 7 digitos.")
    }
    data.cnes = cnesDigits
  }

  // Validate CBO: 6 digits if provided
  if (data.cbos) {
    const cbosDigits = data.cbos.replace(/\D/g, "")
    if (cbosDigits.length !== 6) {
      throw new ActionError("Codigo CBOS deve ter exatamente 6 digitos.")
    }
    data.cbos = cbosDigits
  }

  // Validate UF: 2 letters if provided
  if (data.ufConselho) {
    const uf = data.ufConselho.trim().toUpperCase()
    if (!/^[A-Z]{2}$/.test(uf)) {
      throw new ActionError("UF do conselho deve ter exatamente 2 letras.")
    }
    data.ufConselho = uf
  }

  const config = await db.tissConfig.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      cnes: data.cnes || null,
      codigoPrestador: data.codigoPrestador?.trim() || null,
      cbos: data.cbos || null,
      conselhoProfissional: data.conselhoProfissional?.trim() || null,
      numeroConselho: data.numeroConselho?.trim() || null,
      ufConselho: data.ufConselho || null,
    },
    update: {
      cnes: data.cnes || null,
      codigoPrestador: data.codigoPrestador?.trim() || null,
      cbos: data.cbos || null,
      conselhoProfissional: data.conselhoProfissional?.trim() || null,
      numeroConselho: data.numeroConselho?.trim() || null,
      ufConselho: data.ufConselho || null,
    },
  })

  logAudit({
    workspaceId,
    userId,
    action: "tiss_config.save",
    entityType: "TissConfig",
    entityId: config.id,
    details: { cnes: data.cnes, cbos: data.cbos, conselho: data.conselhoProfissional },
  })

  return {
    id: config.id,
    cnes: config.cnes,
    codigoPrestador: config.codigoPrestador,
    cbos: config.cbos,
    conselhoProfissional: config.conselhoProfissional,
    numeroConselho: config.numeroConselho,
    ufConselho: config.ufConselho,
    versaoTiss: config.versaoTiss,
    sequencialGuia: config.sequencialGuia,
    isActive: config.isActive,
  }
})
