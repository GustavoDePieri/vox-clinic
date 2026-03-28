"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ERR_UNAUTHORIZED, ERR_WORKSPACE_NOT_CONFIGURED } from "@/lib/error-messages"

// ─── Auth helper (inline — Vercel bundler constraint) ────────────────────────

async function getWorkspaceContext() {
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

// ─── Cash Flow Data ──────────────────────────────────────────────────────────

export async function getCashFlowData(
  period: "month" | "year",
  date: string
) {
  const { workspaceId } = await getWorkspaceContext()

  const baseDate = new Date(date)

  let startDate: Date
  let endDate: Date

  if (period === "month") {
    startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
    endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59)
  } else {
    startDate = new Date(baseDate.getFullYear(), 0, 1)
    endDate = new Date(baseDate.getFullYear(), 11, 31, 23, 59, 59)
  }

  // Fetch paid payments (inflows)
  const payments = await db.payment.findMany({
    where: {
      workspaceId,
      status: "paid",
      paidAt: { gte: startDate, lte: endDate },
    },
    include: {
      charge: {
        include: { patient: { select: { name: true } } },
      },
    },
    orderBy: { paidAt: "desc" },
  })

  // Fetch paid expenses (outflows)
  const expenses = await db.expense.findMany({
    where: {
      workspaceId,
      status: "paid",
      paidAt: { gte: startDate, lte: endDate },
    },
    include: { category: true },
    orderBy: { paidAt: "desc" },
  })

  // Group by date key
  const groupMap = new Map<string, { inflows: number; outflows: number }>()

  const getKey = (d: Date) => {
    if (period === "month") {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    } else {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    }
  }

  // Pre-fill all keys so chart has continuous data
  if (period === "month") {
    const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      groupMap.set(key, { inflows: 0, outflows: 0 })
    }
  } else {
    for (let m = 0; m < 12; m++) {
      const key = `${baseDate.getFullYear()}-${String(m + 1).padStart(2, "0")}`
      groupMap.set(key, { inflows: 0, outflows: 0 })
    }
  }

  // Aggregate inflows
  for (const p of payments) {
    if (!p.paidAt) continue
    const key = getKey(new Date(p.paidAt))
    const entry = groupMap.get(key)
    if (entry) {
      entry.inflows += p.paidAmount ?? p.amount
    }
  }

  // Aggregate outflows
  for (const e of expenses) {
    if (!e.paidAt) continue
    const key = getKey(new Date(e.paidAt))
    const entry = groupMap.get(key)
    if (entry) {
      entry.outflows += e.paidAmount ?? e.amount
    }
  }

  // Build entries with cumulative balance
  let cumulative = 0
  const entries = Array.from(groupMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, data]) => {
      cumulative += data.inflows - data.outflows
      return {
        date: dateKey,
        inflows: data.inflows,
        outflows: data.outflows,
        balance: cumulative,
      }
    })

  const totalInflows = entries.reduce((sum, e) => sum + e.inflows, 0)
  const totalOutflows = entries.reduce((sum, e) => sum + e.outflows, 0)

  // Pending summary
  const [pendingReceivables, overdueReceivables, pendingExpenses] = await Promise.all([
    db.payment.aggregate({
      where: { workspaceId, status: "pending" },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: { workspaceId, status: "overdue" },
      _sum: { amount: true },
    }),
    db.expense.aggregate({
      where: { workspaceId, status: { in: ["pending", "overdue"] } },
      _sum: { amount: true },
    }),
  ])

  // Build transaction list (combined, sorted by date desc)
  const transactions = [
    ...payments.map((p) => ({
      id: p.id,
      type: "inflow" as const,
      date: p.paidAt!.toISOString(),
      description: p.charge.description,
      category: p.charge.patient?.name ?? "Paciente",
      amount: p.paidAmount ?? p.amount,
      paymentMethod: p.paymentMethod,
    })),
    ...expenses.map((e) => ({
      id: e.id,
      type: "outflow" as const,
      date: e.paidAt!.toISOString(),
      description: e.description,
      category: e.category?.name ?? "Sem categoria",
      amount: e.paidAmount ?? e.amount,
      paymentMethod: e.paymentMethod,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return {
    entries,
    totals: {
      inflows: totalInflows,
      outflows: totalOutflows,
      net: totalInflows - totalOutflows,
    },
    summary: {
      pendingReceivables: pendingReceivables._sum.amount ?? 0,
      overdueReceivables: overdueReceivables._sum.amount ?? 0,
      pendingExpenses: pendingExpenses._sum.amount ?? 0,
    },
    transactions,
  }
}

// ─── Cash Flow Projection ────────────────────────────────────────────────────

export async function getCashFlowProjection(months: number = 6) {
  const { workspaceId } = await getWorkspaceContext()

  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  const endDate = new Date(now.getFullYear(), now.getMonth() + months, 0, 23, 59, 59)

  // Future scheduled appointments with prices (projected inflows)
  const appointments = await db.appointment.findMany({
    where: {
      workspaceId,
      date: { gte: startDate, lte: endDate },
      status: "scheduled",
      price: { not: null },
    },
    select: { date: true, price: true },
  })

  // Pending/future expenses (projected outflows)
  const expenses = await db.expense.findMany({
    where: {
      workspaceId,
      dueDate: { gte: startDate, lte: endDate },
      status: { in: ["pending", "overdue"] },
    },
    select: { dueDate: true, amount: true },
  })

  // Group by month
  const monthMap = new Map<string, { projectedInflows: number; projectedOutflows: number }>()

  for (let m = 0; m < months; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() + m, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    monthMap.set(key, { projectedInflows: 0, projectedOutflows: 0 })
  }

  for (const apt of appointments) {
    const d = new Date(apt.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const entry = monthMap.get(key)
    if (entry) {
      entry.projectedInflows += apt.price ?? 0 // already in centavos
    }
  }

  for (const exp of expenses) {
    const d = new Date(exp.dueDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const entry = monthMap.get(key)
    if (entry) {
      entry.projectedOutflows += exp.amount
    }
  }

  let cumulativeBalance = 0
  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      cumulativeBalance += data.projectedInflows - data.projectedOutflows
      return {
        month,
        projectedInflows: data.projectedInflows,
        projectedOutflows: data.projectedOutflows,
        projectedBalance: cumulativeBalance,
      }
    })
}
