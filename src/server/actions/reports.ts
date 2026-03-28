"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { checkFeatureAccess } from "@/lib/plan-enforcement"
import { ERR_UNAUTHORIZED, ERR_WORKSPACE_NOT_CONFIGURED, ActionError, safeAction } from "@/lib/error-messages"

async function getWorkspaceId() {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true, memberships: { select: { workspaceId: true }, take: 1 } },
  })
  const workspaceId = user?.workspace?.id ?? user?.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error(ERR_WORKSPACE_NOT_CONFIGURED)
  return workspaceId
}

export const getReportsData = safeAction(async (period: "3m" | "6m" | "12m") => {
  const workspaceId = await getWorkspaceId()

  // Plan enforcement: check reports feature access
  const workspace = await db.workspace.findUnique({ where: { id: workspaceId }, select: { plan: true } })
  const planCheck = checkFeatureAccess(workspace?.plan ?? "free", "reports")
  if (!planCheck.allowed) throw new ActionError(planCheck.reason!)

  const now = new Date()

  const monthsBack = period === "3m" ? 3 : period === "6m" ? 6 : 12
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
  const startDateISO = startDate.toISOString()

  // ── SQL aggregations (run in parallel) ──
  const [
    monthlyRevenueRows,
    procedureRows,
    statusRows,
    totalPatients,
    newPatientsRows,
    hourAndPatientRows,
    npsResponses,
  ] = await Promise.all([
    // 1. Monthly revenue — SQL GROUP BY month
    db.$queryRawUnsafe<{ month_label: string; revenue: number; count: bigint }[]>(
      `SELECT
        to_char(date, 'MM/YYYY') AS month_label,
        COALESCE(SUM(price), 0)::float AS revenue,
        COUNT(*)::bigint AS count
      FROM "Appointment"
      WHERE "workspaceId" = $1
        AND date >= $2::timestamp
        AND status IN ('completed', 'scheduled', 'no_show')
      GROUP BY to_char(date, 'YYYY-MM'), to_char(date, 'MM/YYYY')
      ORDER BY to_char(date, 'YYYY-MM') ASC`,
      workspaceId,
      startDateISO,
    ),

    // 2. Procedure ranking — SQL with jsonb_array_elements_text for string arrays,
    //    and jsonb_array_elements for object arrays (extracting ->>'name')
    db.$queryRawUnsafe<{ name: string; count: bigint }[]>(
      `SELECT proc_name AS name, COUNT(*)::bigint AS count FROM (
        SELECT jsonb_array_elements_text(procedures) AS proc_name
        FROM "Appointment"
        WHERE "workspaceId" = $1
          AND date >= $2::timestamp
          AND status IN ('completed', 'scheduled', 'no_show')
          AND jsonb_typeof(procedures) = 'array'
          AND jsonb_array_length(procedures) > 0
          AND jsonb_typeof(procedures->0) = 'string'
        UNION ALL
        SELECT jsonb_array_elements(procedures)->>'name' AS proc_name
        FROM "Appointment"
        WHERE "workspaceId" = $1
          AND date >= $2::timestamp
          AND status IN ('completed', 'scheduled', 'no_show')
          AND jsonb_typeof(procedures) = 'array'
          AND jsonb_array_length(procedures) > 0
          AND jsonb_typeof(procedures->0) = 'object'
      ) sub
      WHERE proc_name IS NOT NULL
      GROUP BY proc_name
      ORDER BY count DESC
      LIMIT 10`,
      workspaceId,
      startDateISO,
    ),

    // 3. Status distribution — SQL GROUP BY status
    db.$queryRawUnsafe<{ status: string; count: bigint }[]>(
      `SELECT status, COUNT(*)::bigint AS count
      FROM "Appointment"
      WHERE "workspaceId" = $1
        AND date >= $2::timestamp
        AND status IN ('completed', 'scheduled', 'no_show', 'cancelled')
      GROUP BY status`,
      workspaceId,
      startDateISO,
    ),

    // 4. Total patients
    db.patient.count({ where: { workspaceId, isActive: true } }),

    // 5. New patients per month
    db.$queryRawUnsafe<{ month_label: string; count: bigint }[]>(
      `SELECT
        to_char("createdAt", 'MM/YYYY') AS month_label,
        COUNT(*)::bigint AS count
      FROM "Patient"
      WHERE "workspaceId" = $1
        AND "createdAt" >= $2::timestamp
      GROUP BY to_char("createdAt", 'YYYY-MM'), to_char("createdAt", 'MM/YYYY')
      ORDER BY to_char("createdAt", 'YYYY-MM') ASC`,
      workspaceId,
      startDateISO,
    ),

    // 6. Hour heatmap + patient frequency/revenue (still needs per-row data for rankings)
    db.appointment.findMany({
      where: {
        workspaceId,
        date: { gte: startDate },
        status: { in: ["completed", "scheduled", "no_show"] },
      },
      select: {
        date: true,
        price: true,
        patient: { select: { id: true, name: true } },
      },
    }),

    // 7. NPS data
    db.npsSurvey.findMany({
      where: { workspaceId, answeredAt: { not: null }, sentAt: { gte: startDate } },
      select: { score: true },
    }),
  ])

  // ── Build monthly revenue array (fill missing months with 0) ──
  const revenueByMonth = new Map(monthlyRevenueRows.map(r => [r.month_label, r]))
  const monthlyRevenue: { month: string; revenue: number; count: number }[] = []
  const newPatientsByMonth = new Map(newPatientsRows.map(r => [r.month_label, Number(r.count)]))
  const monthlyPatients: { month: string; newPatients: number }[] = []

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`

    const row = revenueByMonth.get(label)
    monthlyRevenue.push({
      month: label,
      revenue: row ? row.revenue : 0,
      count: row ? Number(row.count) : 0,
    })

    monthlyPatients.push({
      month: label,
      newPatients: newPatientsByMonth.get(label) ?? 0,
    })
  }

  // ── Status counts from SQL ──
  const statusCounts: Record<string, number> = { completed: 0, scheduled: 0, cancelled: 0, no_show: 0 }
  for (const row of statusRows) {
    statusCounts[row.status] = Number(row.count)
  }

  // ── Top procedures from SQL ──
  const topProcedures = procedureRows.map(r => ({ name: r.name, count: Number(r.count) }))

  // ── Totals from status counts ──
  const totalAll = Object.values(statusCounts).reduce((s, v) => s + v, 0)
  const totalRevenue = monthlyRevenue.reduce((s, r) => s + r.revenue, 0)

  // ── Hour heatmap + patient ranking (JS — complex to express in SQL) ──
  const hourCounts: Record<number, number> = {}
  const patientStats: Record<string, { name: string; visits: number; revenue: number }> = {}

  for (const apt of hourAndPatientRows) {
    // Hour heatmap
    const hour = new Date(apt.date).getHours()
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1

    // Patient frequency + revenue
    if (!patientStats[apt.patient.id]) {
      patientStats[apt.patient.id] = { name: apt.patient.name, visits: 0, revenue: 0 }
    }
    patientStats[apt.patient.id].visits++
    patientStats[apt.patient.id].revenue += apt.price ?? 0
  }

  const hourDistribution = Array.from({ length: 14 }, (_, i) => ({
    hour: `${String(i + 7).padStart(2, "0")}h`,
    count: hourCounts[i + 7] ?? 0,
  }))

  // Return rate (patients with 2+ appointments)
  const patientFreqValues = Object.values(patientStats)
  const returningPatients = patientFreqValues.filter((p) => p.visits >= 2).length
  const uniquePatients = patientFreqValues.length
  const returnRate = uniquePatients > 0 ? Math.round((returningPatients / uniquePatients) * 100) : 0

  // No-show rate
  const totalNoShow = statusCounts.no_show ?? 0
  const noShowRate = totalAll > 0 ? Math.round((totalNoShow / totalAll) * 100) : 0

  // NPS data
  const npsScores = npsResponses.filter(r => r.score !== null).map(r => r.score!)
  const npsAvg = npsScores.length > 0 ? Math.round(npsScores.reduce((s, v) => s + v, 0) / npsScores.length * 10) / 10 : null
  const npsPromoters = npsScores.filter(s => s >= 9).length
  const npsDetractors = npsScores.filter(s => s <= 6).length
  const npsScore = npsScores.length > 0 ? Math.round(((npsPromoters - npsDetractors) / npsScores.length) * 100) : null

  // Patient rankings
  const topPatientsByFrequency = Object.values(patientStats)
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10)

  const topPatientsByRevenue = Object.values(patientStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  return {
    totalPatients,
    totalAppointments: totalAll,
    totalRevenue,
    returnRate,
    noShowRate,
    monthlyRevenue,
    monthlyPatients,
    topProcedures,
    hourDistribution,
    statusCounts,
    topPatientsByFrequency,
    topPatientsByRevenue,
    nps: { score: npsScore, average: npsAvg, total: npsScores.length, promoters: npsPromoters, detractors: npsDetractors },
  }
})

export async function getNpsSurveys(period: string = "6m") {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true, memberships: { select: { workspaceId: true }, take: 1 } },
  })
  const workspaceId = user?.workspace?.id ?? user?.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error(ERR_WORKSPACE_NOT_CONFIGURED)

  const months = period === "3m" ? 3 : period === "12m" ? 12 : 6
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const surveys = await db.npsSurvey.findMany({
    where: {
      workspaceId,
      answeredAt: { not: null },
      sentAt: { gte: startDate },
    },
    orderBy: { answeredAt: "desc" },
    take: 50,
  })

  // Manual join since NpsSurvey has no Prisma relation to Patient
  const patientIds = [...new Set(surveys.map(s => s.patientId))]
  const patients = patientIds.length > 0
    ? await db.patient.findMany({
        where: { id: { in: patientIds } },
        select: { id: true, name: true },
      })
    : []
  const patientMap = new Map(patients.map(p => [p.id, p]))

  return surveys.map(s => {
    const patient = patientMap.get(s.patientId)
    return {
      id: s.id,
      patientName: patient?.name || "Paciente",
      patientId: patient?.id,
      score: s.score!,
      comment: s.comment,
      answeredAt: s.answeredAt!.toISOString(),
    }
  })
}
