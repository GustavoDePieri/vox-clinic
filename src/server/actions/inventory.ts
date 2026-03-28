"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"
import {
  ERR_UNAUTHORIZED,
  ERR_WORKSPACE_NOT_CONFIGURED,
  ERR_INVENTORY_ITEM_NOT_FOUND,
  ERR_INVENTORY_INSUFFICIENT_STOCK,
  ERR_INVENTORY_CATEGORY_NOT_FOUND,
  ActionError,
  safeAction,
} from "@/lib/error-messages"

async function getAuthContext() {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true, memberships: { select: { workspaceId: true }, take: 1 } },
  })
  const workspaceId = user?.workspace?.id ?? user?.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error(ERR_WORKSPACE_NOT_CONFIGURED)

  return { userId, workspaceId }
}

// ============================================================
// Categories
// ============================================================

export async function getInventoryCategories() {
  const { workspaceId } = await getAuthContext()

  const categories = await db.inventoryCategory.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  })

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    itemCount: c._count.items,
  }))
}

export const createInventoryCategory = safeAction(async (data: {
  name: string
  icon?: string
  color?: string
}) => {
  const { userId, workspaceId } = await getAuthContext()

  if (!data.name.trim()) throw new ActionError("Nome da categoria e obrigatorio.")

  const existing = await db.inventoryCategory.findUnique({
    where: { workspaceId_name: { workspaceId, name: data.name.trim() } },
  })
  if (existing) throw new ActionError("Ja existe uma categoria com este nome.")

  const category = await db.inventoryCategory.create({
    data: {
      workspaceId,
      name: data.name.trim(),
      icon: data.icon || null,
      color: data.color || null,
    },
  })

  await logAudit({
    workspaceId,
    userId,
    action: "inventory_category.created",
    entityType: "InventoryCategory",
    entityId: category.id,
    details: { name: category.name },
  })

  return { id: category.id, name: category.name, icon: category.icon, color: category.color, itemCount: 0 }
})

// ============================================================
// Items
// ============================================================

export async function getInventoryItems(search?: string, categoryId?: string) {
  const { workspaceId } = await getAuthContext()

  const where: any = { workspaceId, isActive: true }
  if (categoryId) where.categoryId = categoryId
  if (search?.trim()) {
    where.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { sku: { contains: search.trim(), mode: "insensitive" } },
      { supplier: { contains: search.trim(), mode: "insensitive" } },
    ]
  }

  const items = await db.inventoryItem.findMany({
    where,
    orderBy: { name: "asc" },
    include: { category: { select: { id: true, name: true, color: true } } },
  })

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    unit: item.unit,
    currentStock: item.currentStock,
    minStock: item.minStock,
    costPerUnit: item.costPerUnit,
    supplier: item.supplier,
    notes: item.notes,
    isActive: item.isActive,
    isLowStock: item.currentStock < item.minStock,
    category: item.category,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }))
}

export async function getInventoryItem(id: string) {
  const { workspaceId } = await getAuthContext()

  const item = await db.inventoryItem.findFirst({
    where: { id, workspaceId },
    include: {
      category: { select: { id: true, name: true, color: true } },
      movements: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })
  if (!item) throw new Error(ERR_INVENTORY_ITEM_NOT_FOUND)

  return {
    id: item.id,
    name: item.name,
    sku: item.sku,
    unit: item.unit,
    currentStock: item.currentStock,
    minStock: item.minStock,
    costPerUnit: item.costPerUnit,
    supplier: item.supplier,
    notes: item.notes,
    isActive: item.isActive,
    isLowStock: item.currentStock < item.minStock,
    category: item.category,
    movements: item.movements.map((m) => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      reason: m.reason,
      notes: m.notes,
      createdBy: m.createdBy,
      createdAt: m.createdAt.toISOString(),
    })),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export const createInventoryItem = safeAction(async (data: {
  name: string
  categoryId?: string
  sku?: string
  unit?: string
  initialStock?: number
  minStock?: number
  costPerUnit?: number
  supplier?: string
  notes?: string
}) => {
  const { userId, workspaceId } = await getAuthContext()

  if (!data.name.trim()) throw new ActionError("Nome do item e obrigatorio.")

  const existing = await db.inventoryItem.findUnique({
    where: { workspaceId_name: { workspaceId, name: data.name.trim() } },
  })
  if (existing) throw new ActionError("Ja existe um item com este nome.")

  if (data.categoryId) {
    const category = await db.inventoryCategory.findFirst({
      where: { id: data.categoryId, workspaceId },
    })
    if (!category) throw new ActionError(ERR_INVENTORY_CATEGORY_NOT_FOUND)
  }

  const initialStock = data.initialStock ?? 0

  const item = await db.$transaction(async (tx) => {
    const created = await tx.inventoryItem.create({
      data: {
        workspaceId,
        name: data.name.trim(),
        categoryId: data.categoryId || null,
        sku: data.sku?.trim() || null,
        unit: data.unit || "un",
        currentStock: initialStock,
        minStock: data.minStock ?? 0,
        costPerUnit: data.costPerUnit != null ? Math.round(data.costPerUnit) : null,
        supplier: data.supplier?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    })

    // Create initial stock movement if stock > 0
    if (initialStock > 0) {
      await tx.inventoryMovement.create({
        data: {
          workspaceId,
          itemId: created.id,
          type: "in",
          quantity: initialStock,
          reason: "ajuste_manual",
          createdBy: userId,
          notes: "Estoque inicial",
        },
      })
    }

    return created
  })

  await logAudit({
    workspaceId,
    userId,
    action: "inventory_item.created",
    entityType: "InventoryItem",
    entityId: item.id,
    details: { name: item.name, initialStock },
  })

  return { id: item.id, name: item.name }
})

export const updateInventoryItem = safeAction(async (id: string, data: {
  name?: string
  categoryId?: string | null
  sku?: string
  unit?: string
  minStock?: number
  costPerUnit?: number | null
  supplier?: string
  notes?: string
}) => {
  const { userId, workspaceId } = await getAuthContext()

  const item = await db.inventoryItem.findFirst({ where: { id, workspaceId } })
  if (!item) throw new ActionError(ERR_INVENTORY_ITEM_NOT_FOUND)

  if (data.name?.trim() && data.name.trim() !== item.name) {
    const existing = await db.inventoryItem.findUnique({
      where: { workspaceId_name: { workspaceId, name: data.name.trim() } },
    })
    if (existing) throw new ActionError("Ja existe um item com este nome.")
  }

  if (data.categoryId) {
    const category = await db.inventoryCategory.findFirst({
      where: { id: data.categoryId, workspaceId },
    })
    if (!category) throw new ActionError(ERR_INVENTORY_CATEGORY_NOT_FOUND)
  }

  const updated = await db.inventoryItem.update({
    where: { id },
    data: {
      ...(data.name?.trim() ? { name: data.name.trim() } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId || null } : {}),
      ...(data.sku !== undefined ? { sku: data.sku?.trim() || null } : {}),
      ...(data.unit ? { unit: data.unit } : {}),
      ...(data.minStock != null ? { minStock: data.minStock } : {}),
      ...(data.costPerUnit !== undefined ? { costPerUnit: data.costPerUnit != null ? Math.round(data.costPerUnit) : null } : {}),
      ...(data.supplier !== undefined ? { supplier: data.supplier?.trim() || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
    },
  })

  await logAudit({
    workspaceId,
    userId,
    action: "inventory_item.updated",
    entityType: "InventoryItem",
    entityId: id,
    details: data,
  })

  return { id: updated.id, name: updated.name }
})

export const deactivateInventoryItem = safeAction(async (id: string) => {
  const { userId, workspaceId } = await getAuthContext()

  const item = await db.inventoryItem.findFirst({ where: { id, workspaceId } })
  if (!item) throw new ActionError(ERR_INVENTORY_ITEM_NOT_FOUND)

  await db.inventoryItem.update({ where: { id }, data: { isActive: false } })

  await logAudit({
    workspaceId,
    userId,
    action: "inventory_item.deactivated",
    entityType: "InventoryItem",
    entityId: id,
    details: { name: item.name },
  })

  return { success: true }
})

// ============================================================
// Movements
// ============================================================

export const recordMovement = safeAction(async (data: {
  itemId: string
  type: "in" | "out" | "adjustment"
  quantity: number
  reason: string
  appointmentId?: string
  notes?: string
}) => {
  const { userId, workspaceId } = await getAuthContext()

  if (data.quantity <= 0) throw new ActionError("Quantidade deve ser maior que zero.")

  const result = await db.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findFirst({ where: { id: data.itemId, workspaceId } })
    if (!item) throw new ActionError(ERR_INVENTORY_ITEM_NOT_FOUND)

    let newStock: number
    if (data.type === "in") {
      newStock = item.currentStock + data.quantity
    } else if (data.type === "out") {
      newStock = item.currentStock - data.quantity
      if (newStock < 0) throw new ActionError(ERR_INVENTORY_INSUFFICIENT_STOCK)
    } else {
      // adjustment: set absolute value
      newStock = data.quantity
    }

    await tx.inventoryItem.update({
      where: { id: data.itemId },
      data: { currentStock: newStock },
    })

    const movement = await tx.inventoryMovement.create({
      data: {
        workspaceId,
        itemId: data.itemId,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        appointmentId: data.appointmentId || null,
        createdBy: userId,
        notes: data.notes?.trim() || null,
      },
    })

    return { movementId: movement.id, newStock, itemName: item.name }
  })

  await logAudit({
    workspaceId,
    userId,
    action: "inventory_movement.created",
    entityType: "InventoryMovement",
    entityId: result.movementId,
    details: { itemId: data.itemId, itemName: result.itemName, type: data.type, quantity: data.quantity, reason: data.reason },
  })

  return { id: result.movementId, newStock: result.newStock }
})

export async function getMovements(itemId?: string, period?: "7d" | "30d" | "90d") {
  const { workspaceId } = await getAuthContext()

  const where: any = { workspaceId }
  if (itemId) where.itemId = itemId

  if (period) {
    const now = new Date()
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    where.createdAt = { gte: from }
  }

  const movements = await db.inventoryMovement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { item: { select: { id: true, name: true, unit: true } } },
  })

  return movements.map((m) => ({
    id: m.id,
    type: m.type,
    quantity: m.quantity,
    reason: m.reason,
    notes: m.notes,
    createdBy: m.createdBy,
    createdAt: m.createdAt.toISOString(),
    item: m.item,
  }))
}

// ============================================================
// Summary / Dashboard
// ============================================================

export async function getInventorySummary() {
  const { workspaceId } = await getAuthContext()

  const items = await db.inventoryItem.findMany({
    where: { workspaceId, isActive: true },
    select: { currentStock: true, minStock: true, costPerUnit: true },
  })

  const totalItems = items.length
  const lowStockCount = items.filter((i) => i.currentStock < i.minStock).length
  const totalValue = items.reduce((sum, i) => {
    if (i.costPerUnit != null) return sum + (i.currentStock * i.costPerUnit)
    return sum
  }, 0)

  return { totalItems, lowStockCount, totalValue }
}

export async function getLowStockItems() {
  const { workspaceId } = await getAuthContext()

  const items = await db.inventoryItem.findMany({
    where: { workspaceId, isActive: true },
    include: { category: { select: { id: true, name: true, color: true } } },
  })

  return items
    .filter((item) => item.currentStock < item.minStock)
    .map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      currentStock: item.currentStock,
      minStock: item.minStock,
      category: item.category,
    }))
}
