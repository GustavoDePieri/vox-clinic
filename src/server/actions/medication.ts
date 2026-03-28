"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ERR_UNAUTHORIZED, ERR_USER_NOT_FOUND, ERR_WORKSPACE_NOT_CONFIGURED, ActionError, safeAction } from "@/lib/error-messages"

async function getAuthContext() {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true, memberships: { select: { workspaceId: true }, take: 1 } },
  })
  if (!user) throw new Error(ERR_USER_NOT_FOUND)
  const workspaceId = user.workspace?.id ?? user.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error(ERR_WORKSPACE_NOT_CONFIGURED)

  return { userId, user, workspaceId }
}

/**
 * Search medications in database, falling back to static JSON if table is empty.
 */
export async function searchMedications(query: string, limit = 20) {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)

  const q = query.trim()
  if (q.length < 2) return []

  // Try DB first
  const dbCount = await db.medicationDatabase.count()

  if (dbCount > 0) {
    // DB-backed search (accent-insensitive via PostgreSQL)
    const results = await db.medicationDatabase.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { activeIngredient: { contains: q, mode: "insensitive" } },
        ],
      },
      take: Math.min(limit, 50),
      orderBy: [{ name: "asc" }],
    })

    return results.map((m) => ({
      anvisaCode: m.anvisaCode,
      name: m.name,
      activeIngredient: m.activeIngredient,
      concentration: m.concentration,
      pharmaceuticalForm: m.pharmaceuticalForm,
      manufacturer: m.manufacturer,
      category: m.category,
      controlType: m.controlType,
    }))
  }

  // Fallback to static JSON
  const { searchMedications: searchStatic } = await import("@/data/medications-index")
  return searchStatic(q, limit)
}

/**
 * Get user's favorite medications, sorted by usage count.
 */
export async function getMedicationFavorites() {
  const { userId, workspaceId } = await getAuthContext()

  const favorites = await db.medicationFavorite.findMany({
    where: { workspaceId, userId },
    orderBy: [{ usageCount: "desc" }, { lastUsedAt: "desc" }],
    take: 20,
  })

  return favorites.map((f) => ({
    id: f.id,
    medicationName: f.medicationName,
    activeIngredient: f.activeIngredient,
    defaultDosage: f.defaultDosage,
    defaultFrequency: f.defaultFrequency,
    defaultQuantity: f.defaultQuantity,
    usageCount: f.usageCount,
  }))
}

/**
 * Add or increment a medication favorite.
 */
export const upsertMedicationFavorite = safeAction(async (data: {
  medicationName: string
  activeIngredient?: string
  defaultDosage?: string
  defaultFrequency?: string
  defaultQuantity?: string
}) => {
  const { userId, workspaceId } = await getAuthContext()

  if (!data.medicationName?.trim()) throw new ActionError("Nome do medicamento e obrigatorio.")

  const favorite = await db.medicationFavorite.upsert({
    where: {
      workspaceId_userId_medicationName: {
        workspaceId,
        userId,
        medicationName: data.medicationName,
      },
    },
    update: {
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
      activeIngredient: data.activeIngredient ?? undefined,
      defaultDosage: data.defaultDosage ?? undefined,
      defaultFrequency: data.defaultFrequency ?? undefined,
      defaultQuantity: data.defaultQuantity ?? undefined,
    },
    create: {
      workspaceId,
      userId,
      medicationName: data.medicationName,
      activeIngredient: data.activeIngredient ?? null,
      defaultDosage: data.defaultDosage ?? null,
      defaultFrequency: data.defaultFrequency ?? null,
      defaultQuantity: data.defaultQuantity ?? null,
    },
  })

  return { id: favorite.id }
})

/**
 * Remove a medication favorite.
 */
export const removeMedicationFavorite = safeAction(async (id: string) => {
  const { userId, workspaceId } = await getAuthContext()

  const favorite = await db.medicationFavorite.findFirst({
    where: { id, workspaceId, userId },
  })
  if (!favorite) throw new ActionError("Favorito nao encontrado.")

  await db.medicationFavorite.delete({ where: { id } })
  return { success: true }
})
