"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"
import {
  ERR_UNAUTHORIZED,
  ERR_WORKSPACE_NOT_CONFIGURED,
  ERR_PATIENT_NOT_FOUND,
  ERR_WAITLIST_ENTRY_NOT_FOUND,
  ERR_WAITLIST_PATIENT_ALREADY_WAITING,
  ActionError,
  safeAction,
} from "@/lib/error-messages"
import { getWorkspaceIdCached } from "@/lib/workspace-cache"

// ────────────────────── Auth helper ──────────────────────

async function getWorkspaceContext() {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)
  const workspaceId = await getWorkspaceIdCached(userId)
  if (!workspaceId) throw new Error(ERR_WORKSPACE_NOT_CONFIGURED)
  return { userId, workspaceId }
}

// ────────────────────── Day-of-week helper ──────────────────────

const DAY_ABBR = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const

function getDayAbbr(date: Date): string {
  return DAY_ABBR[date.getDay()]
}

function formatTimeHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

// ────────────────────── Queries ──────────────────────

export async function getWaitlistEntries(filters?: {
  status?: string
  agendaId?: string
  priority?: number
}) {
  const { workspaceId } = await getWorkspaceContext()

  const where: Record<string, unknown> = { workspaceId }
  if (filters?.status) where.status = filters.status
  if (filters?.agendaId) where.agendaId = filters.agendaId
  if (filters?.priority !== undefined) where.priority = filters.priority

  const entries = await db.waitlistEntry.findMany({
    where,
    include: {
      patient: { select: { id: true, name: true, phone: true, email: true } },
      agenda: { select: { id: true, name: true, color: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  })

  return entries.map((e) => ({
    id: e.id,
    patient: e.patient,
    agenda: e.agenda,
    agendaId: e.agendaId,
    procedureName: e.procedureName,
    preferredDays: e.preferredDays,
    preferredTimeStart: e.preferredTimeStart,
    preferredTimeEnd: e.preferredTimeEnd,
    priority: e.priority,
    status: e.status,
    notes: e.notes,
    notifiedAt: e.notifiedAt?.toISOString() ?? null,
    notifiedVia: e.notifiedVia,
    scheduledAppointmentId: e.scheduledAppointmentId,
    createdAt: e.createdAt.toISOString(),
    expiresAt: e.expiresAt?.toISOString() ?? null,
  }))
}

export async function getWaitlistCount() {
  const { workspaceId } = await getWorkspaceContext()

  return db.waitlistEntry.count({
    where: { workspaceId, status: "waiting" },
  })
}

// ────────────────────── Mutations ──────────────────────

export const addToWaitlist = safeAction(async (data: {
  patientId: string
  agendaId?: string | null
  procedureName?: string | null
  preferredDays?: string[]
  preferredTimeStart?: string | null
  preferredTimeEnd?: string | null
  priority?: number
  notes?: string | null
  expiresAt?: string | null
}) => {
  const { userId, workspaceId } = await getWorkspaceContext()

  // Validate patient exists in workspace
  const patient = await db.patient.findFirst({
    where: { id: data.patientId, workspaceId, isActive: true },
  })
  if (!patient) throw new ActionError(ERR_PATIENT_NOT_FOUND)

  // Check if patient already has a waiting entry for same agenda/procedure
  const existing = await db.waitlistEntry.findFirst({
    where: {
      workspaceId,
      patientId: data.patientId,
      status: "waiting",
      agendaId: data.agendaId ?? null,
      procedureName: data.procedureName ?? null,
    },
  })
  if (existing) throw new ActionError(ERR_WAITLIST_PATIENT_ALREADY_WAITING)

  const entry = await db.waitlistEntry.create({
    data: {
      workspaceId,
      patientId: data.patientId,
      agendaId: data.agendaId ?? null,
      procedureName: data.procedureName ?? null,
      preferredDays: data.preferredDays ?? [],
      preferredTimeStart: data.preferredTimeStart ?? null,
      preferredTimeEnd: data.preferredTimeEnd ?? null,
      priority: data.priority ?? 0,
      notes: data.notes ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      createdBy: userId,
    },
  })

  await logAudit({
    workspaceId,
    userId,
    action: "waitlist.created",
    entityType: "WaitlistEntry",
    entityId: entry.id,
    details: { patientId: data.patientId, priority: data.priority ?? 0 },
  })

  return { id: entry.id }
})

export const updateWaitlistEntry = safeAction(async (
  id: string,
  data: {
    agendaId?: string | null
    procedureName?: string | null
    preferredDays?: string[]
    preferredTimeStart?: string | null
    preferredTimeEnd?: string | null
    priority?: number
    notes?: string | null
    expiresAt?: string | null
  },
) => {
  const { userId, workspaceId } = await getWorkspaceContext()

  const entry = await db.waitlistEntry.findFirst({
    where: { id, workspaceId },
  })
  if (!entry) throw new ActionError(ERR_WAITLIST_ENTRY_NOT_FOUND)

  await db.waitlistEntry.update({
    where: { id },
    data: {
      ...(data.agendaId !== undefined && { agendaId: data.agendaId }),
      ...(data.procedureName !== undefined && { procedureName: data.procedureName }),
      ...(data.preferredDays !== undefined && { preferredDays: data.preferredDays }),
      ...(data.preferredTimeStart !== undefined && { preferredTimeStart: data.preferredTimeStart }),
      ...(data.preferredTimeEnd !== undefined && { preferredTimeEnd: data.preferredTimeEnd }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }),
    },
  })

  await logAudit({
    workspaceId,
    userId,
    action: "waitlist.updated",
    entityType: "WaitlistEntry",
    entityId: id,
  })

  return { id }
})

export const cancelWaitlistEntry = safeAction(async (id: string) => {
  const { userId, workspaceId } = await getWorkspaceContext()

  const entry = await db.waitlistEntry.findFirst({
    where: { id, workspaceId },
  })
  if (!entry) throw new ActionError(ERR_WAITLIST_ENTRY_NOT_FOUND)

  await db.waitlistEntry.update({
    where: { id },
    data: { status: "cancelled" },
  })

  await logAudit({
    workspaceId,
    userId,
    action: "waitlist.cancelled",
    entityType: "WaitlistEntry",
    entityId: id,
  })

  return { id }
})

// ────────────────────── Slot Matching ──────────────────────

export async function findMatchesForSlot(
  workspaceId: string,
  cancelledDate: Date,
  agendaId: string,
) {
  const dayOfWeek = getDayAbbr(cancelledDate)
  const timeStr = formatTimeHHMM(cancelledDate)

  const candidates = await db.waitlistEntry.findMany({
    where: {
      workspaceId,
      status: "waiting",
      AND: [
        { OR: [{ agendaId: null }, { agendaId }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      ],
    },
    include: {
      patient: { select: { id: true, name: true, phone: true, email: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  })

  return candidates.filter((entry) => {
    // Day preference check
    if (entry.preferredDays.length > 0 && !entry.preferredDays.includes(dayOfWeek)) return false
    // Time preference check (inclusive)
    if (entry.preferredTimeStart && timeStr < entry.preferredTimeStart) return false
    if (entry.preferredTimeEnd && timeStr > entry.preferredTimeEnd) return false
    return true
  })
}

// ────────────────────── Schedule from waitlist ──────────────────────

export const scheduleFromWaitlist = safeAction(async (
  entryId: string,
  appointmentId: string,
) => {
  const { userId, workspaceId } = await getWorkspaceContext()

  const entry = await db.waitlistEntry.findFirst({
    where: { id: entryId, workspaceId },
  })
  if (!entry) throw new ActionError(ERR_WAITLIST_ENTRY_NOT_FOUND)

  await db.waitlistEntry.update({
    where: { id: entryId },
    data: {
      status: "scheduled",
      scheduledAppointmentId: appointmentId,
    },
  })

  await logAudit({
    workspaceId,
    userId,
    action: "waitlist.scheduled",
    entityType: "WaitlistEntry",
    entityId: entryId,
    details: { appointmentId },
  })

  return { id: entryId }
})
