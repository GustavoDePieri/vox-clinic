"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

async function getWorkspaceContext() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true, memberships: { select: { workspaceId: true }, take: 1 } },
  })

  const workspaceId = user?.workspace?.id ?? user?.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error("Workspace not configured")

  return { workspaceId, clerkId: userId }
}

// ─── createCharge ────────────────────────────────────────────

interface CreateChargeInput {
  patientId: string
  appointmentId?: string
  treatmentPlanId?: string
  description: string
  totalAmount: number // centavos
  discount: number // centavos
  installments: number // 1-24
  firstDueDate: string // ISO date string
  notes?: string
}

export async function createCharge(input: CreateChargeInput) {
  const { workspaceId, clerkId } = await getWorkspaceContext()

  const {
    patientId,
    appointmentId,
    treatmentPlanId,
    description,
    totalAmount,
    discount,
    installments,
    firstDueDate,
    notes,
  } = input

  if (totalAmount <= 0) throw new Error("Valor total deve ser maior que zero")
  if (discount < 0) throw new Error("Desconto nao pode ser negativo")
  if (discount > totalAmount) throw new Error("Desconto nao pode ser maior que o valor total")
  if (installments < 1 || installments > 24) throw new Error("Parcelas devem ser entre 1 e 24")
  if (!description.trim()) throw new Error("Descricao e obrigatoria")

  const netAmount = totalAmount - discount

  // Split into installments — first absorbs remainder
  const baseAmount = Math.floor(netAmount / installments)
  const remainder = netAmount - baseAmount * installments
  const amounts: number[] = []
  for (let i = 0; i < installments; i++) {
    amounts.push(i === 0 ? baseAmount + remainder : baseAmount)
  }

  const firstDate = new Date(firstDueDate)

  return db.$transaction(async (tx) => {
    const charge = await tx.charge.create({
      data: {
        workspaceId,
        patientId,
        appointmentId: appointmentId || null,
        treatmentPlanId: treatmentPlanId || null,
        description: description.trim(),
        totalAmount,
        discount,
        netAmount,
        status: "pending",
        createdBy: clerkId,
        notes: notes?.trim() || null,
      },
    })

    for (let i = 0; i < installments; i++) {
      const dueDate = new Date(firstDate)
      dueDate.setMonth(dueDate.getMonth() + i)

      await tx.payment.create({
        data: {
          chargeId: charge.id,
          workspaceId,
          installmentNumber: i + 1,
          totalInstallments: installments,
          amount: amounts[i],
          dueDate,
          status: "pending",
        },
      })
    }

    return tx.charge.findUnique({
      where: { id: charge.id },
      include: { payments: { orderBy: { installmentNumber: "asc" } }, patient: { select: { id: true, name: true } } },
    })
  })
}

// ─── recordPayment ───────────────────────────────────────────

interface RecordPaymentInput {
  paidAmount: number // centavos
  paymentMethod: string
  paidAt?: string // ISO date string
  notes?: string
}

export async function recordPayment(paymentId: string, input: RecordPaymentInput) {
  const { workspaceId } = await getWorkspaceContext()

  const { paidAmount, paymentMethod, paidAt, notes } = input

  if (paidAmount <= 0) throw new Error("Valor pago deve ser maior que zero")

  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { charge: true },
    })

    if (!payment) throw new Error("Pagamento nao encontrado")
    if (payment.workspaceId !== workspaceId) throw new Error("Unauthorized")
    if (payment.status === "paid") throw new Error("Pagamento ja registrado")
    if (payment.status === "cancelled") throw new Error("Pagamento cancelado")

    await tx.payment.update({
      where: { id: paymentId },
      data: {
        paidAmount,
        paymentMethod,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        status: "paid",
        notes: notes?.trim() || null,
      },
    })

    // Check siblings to update charge status
    const siblings = await tx.payment.findMany({
      where: { chargeId: payment.chargeId },
    })

    const allPaid = siblings.every((s) => s.id === paymentId ? true : s.status === "paid")
    const somePaid = siblings.some((s) => s.id === paymentId ? true : s.status === "paid")

    let chargeStatus: string
    if (allPaid) {
      chargeStatus = "paid"
    } else if (somePaid) {
      chargeStatus = "partial"
    } else {
      chargeStatus = payment.charge.status
    }

    await tx.charge.update({
      where: { id: payment.chargeId },
      data: { status: chargeStatus },
    })

    return { success: true }
  })
}

// ─── getCharges ──────────────────────────────────────────────

interface GetChargesInput {
  status?: string
  patientId?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export async function getCharges(input: GetChargesInput = {}) {
  const { workspaceId } = await getWorkspaceContext()

  const { status, patientId, startDate, endDate, page = 1, pageSize = 20 } = input

  // Update overdue payments first
  const now = new Date()
  await db.payment.updateMany({
    where: {
      workspaceId,
      status: "pending",
      dueDate: { lt: now },
    },
    data: { status: "overdue" },
  })

  // Update charges that have overdue payments
  const chargesWithOverdue = await db.payment.findMany({
    where: {
      workspaceId,
      status: "overdue",
    },
    select: { chargeId: true },
    distinct: ["chargeId"],
  })

  if (chargesWithOverdue.length > 0) {
    await db.charge.updateMany({
      where: {
        id: { in: chargesWithOverdue.map((p) => p.chargeId) },
        status: { in: ["pending"] },
      },
      data: { status: "overdue" },
    })
  }

  // Build where clause
  const where: Record<string, unknown> = { workspaceId }
  if (status && status !== "all") {
    where.status = status
  }
  if (patientId) {
    where.patientId = patientId
  }
  if (startDate || endDate) {
    where.createdAt = {} as Record<string, Date>
    if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate)
    if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate)
  }

  const [charges, total] = await Promise.all([
    db.charge.findMany({
      where,
      include: {
        payments: { orderBy: { installmentNumber: "asc" } },
        patient: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.charge.count({ where }),
  ])

  return { charges, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// ─── getCharge ───────────────────────────────────────────────

export async function getCharge(chargeId: string) {
  const { workspaceId } = await getWorkspaceContext()

  const charge = await db.charge.findUnique({
    where: { id: chargeId },
    include: {
      payments: { orderBy: { installmentNumber: "asc" } },
      patient: { select: { id: true, name: true, phone: true, email: true } },
    },
  })

  if (!charge || charge.workspaceId !== workspaceId) {
    throw new Error("Cobranca nao encontrada")
  }

  return charge
}

// ─── getPatientBalance ───────────────────────────────────────

export async function getPatientBalance(patientId: string) {
  const { workspaceId } = await getWorkspaceContext()

  const payments = await db.payment.findMany({
    where: {
      workspaceId,
      charge: { patientId },
      status: { in: ["pending", "overdue"] },
    },
    select: { amount: true, status: true },
  })

  let pending = 0
  let overdue = 0
  for (const p of payments) {
    if (p.status === "pending") pending += p.amount
    if (p.status === "overdue") overdue += p.amount
  }

  return { pending, overdue, total: pending + overdue }
}

// ─── getReceivablesSummary ───────────────────────────────────

export async function getReceivablesSummary() {
  const { workspaceId } = await getWorkspaceContext()

  // Update overdue first
  const now = new Date()
  await db.payment.updateMany({
    where: {
      workspaceId,
      status: "pending",
      dueDate: { lt: now },
    },
    data: { status: "overdue" },
  })

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [pendingPayments, overduePayments, paidThisMonth, paidTotal, overdueTotal] = await Promise.all([
    db.payment.aggregate({
      where: { workspaceId, status: "pending" },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: { workspaceId, status: "overdue" },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: {
        workspaceId,
        status: "paid",
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { paidAmount: true },
    }),
    db.payment.count({
      where: { workspaceId, status: "paid" },
    }),
    db.payment.count({
      where: { workspaceId, status: "overdue" },
    }),
  ])

  const totalPending = pendingPayments._sum.amount ?? 0
  const totalOverdue = overduePayments._sum.amount ?? 0
  const receivedThisMonth = paidThisMonth._sum.paidAmount ?? 0
  const inadimplenciaRate =
    paidTotal + overdueTotal > 0
      ? Math.round((overdueTotal / (paidTotal + overdueTotal)) * 10000) / 100
      : 0

  return { totalPending, totalOverdue, receivedThisMonth, inadimplenciaRate }
}

// ─── cancelCharge ────────────────────────────────────────────

export async function cancelCharge(chargeId: string) {
  const { workspaceId } = await getWorkspaceContext()

  return db.$transaction(async (tx) => {
    const charge = await tx.charge.findUnique({
      where: { id: chargeId },
    })

    if (!charge || charge.workspaceId !== workspaceId) {
      throw new Error("Cobranca nao encontrada")
    }

    if (charge.status === "cancelled") {
      throw new Error("Cobranca ja cancelada")
    }

    await tx.payment.updateMany({
      where: {
        chargeId,
        status: { in: ["pending", "overdue"] },
      },
      data: { status: "cancelled" },
    })

    await tx.charge.update({
      where: { id: chargeId },
      data: { status: "cancelled" },
    })

    return { success: true }
  })
}
