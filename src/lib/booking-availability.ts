import { db } from "@/lib/db"

interface SlotResult {
  time: string // "08:00"
  available: boolean
}

/**
 * Compute available time slots for a given date, agenda, and procedure duration.
 * Pure database query function — no auth required.
 */
export async function getAvailableSlots(
  date: string,
  durationMinutes: number,
  agendaId: string,
  workspaceId: string,
  startHour: number,
  endHour: number,
  timezone: string = "America/Sao_Paulo"
): Promise<SlotResult[]> {
  const duration = Math.max(durationMinutes || 30, 15)

  // Parse the date string as a date in the workspace timezone.
  // On Vercel (UTC), new Date("2026-04-01") = midnight UTC, not local.
  // We use Intl.DateTimeFormat to compute the correct UTC offset for the workspace timezone.
  const tzOffsetMs = getTimezoneOffsetMs(date, timezone)

  // dayStart/dayEnd in UTC that correspond to midnight..23:59 in the workspace timezone
  const dayStartUtc = new Date(new Date(date).getTime() - tzOffsetMs)
  dayStartUtc.setUTCHours(0, 0, 0, 0)
  const adjustedDayStart = new Date(dayStartUtc.getTime() - tzOffsetMs)

  const dayStart = adjustedDayStart
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1)
  const now = new Date()

  // 1. Generate candidate slots in workspace-local time (stored as UTC)
  const slots: Date[] = []
  const cursor = new Date(dayStart.getTime() + startHour * 60 * 60 * 1000)
  const endTime = new Date(dayStart.getTime() + endHour * 60 * 60 * 1000)

  while (cursor.getTime() + duration * 60000 <= endTime.getTime()) {
    slots.push(new Date(cursor))
    cursor.setMinutes(cursor.getMinutes() + duration)
  }

  // 2. Fetch existing appointments for this agenda on this date
  const appointments = await db.appointment.findMany({
    where: {
      workspaceId,
      agendaId,
      date: { gte: dayStart, lte: dayEnd },
      status: { in: ["scheduled", "completed"] },
    },
    select: { date: true, procedures: true },
  })

  // 3. Fetch blocked slots (one-time + recurring)
  const [oneTimeBlocked, recurringBlocked] = await Promise.all([
    db.blockedSlot.findMany({
      where: {
        workspaceId,
        agendaId,
        recurring: null,
        startDate: { lte: dayEnd },
        endDate: { gte: dayStart },
      },
    }),
    db.blockedSlot.findMany({
      where: {
        workspaceId,
        agendaId,
        recurring: "weekly",
        startDate: { lte: dayEnd },
      },
    }),
  ])

  // Expand recurring blocked slots for this date
  const blockedRanges: Array<{ start: Date; end: Date }> = []

  for (const slot of oneTimeBlocked) {
    blockedRanges.push({ start: slot.startDate, end: slot.endDate })
  }

  for (const slot of recurringBlocked) {
    const slotStart = new Date(slot.startDate)
    const slotEnd = new Date(slot.endDate)
    const durationMs = slotEnd.getTime() - slotStart.getTime()

    const diffMs = dayStart.getTime() - slotStart.getTime()
    const weeksOffset = Math.max(0, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)))

    for (let i = 0; i < 3; i++) {
      const occStart = new Date(slotStart.getTime() + (weeksOffset + i) * 7 * 24 * 60 * 60 * 1000)
      const occEnd = new Date(occStart.getTime() + durationMs)
      if (occStart.getTime() > dayEnd.getTime()) break
      if (occEnd.getTime() >= dayStart.getTime()) {
        blockedRanges.push({ start: occStart, end: occEnd })
      }
    }
  }

  // 4. Check each slot for conflicts
  return slots.map((slotStart) => {
    const slotEnd = new Date(slotStart.getTime() + duration * 60000)

    // Past slot check
    if (slotStart.getTime() <= now.getTime()) {
      return { time: formatTime(slotStart, timezone), available: false }
    }

    // Appointment overlap check
    for (const appt of appointments) {
      const apptStart = new Date(appt.date)
      const apptDuration = getApptDuration(appt.procedures) || 30
      const apptEnd = new Date(apptStart.getTime() + apptDuration * 60000)
      if (slotStart < apptEnd && slotEnd > apptStart) {
        return { time: formatTime(slotStart, timezone), available: false }
      }
    }

    // Blocked slot overlap check
    for (const blocked of blockedRanges) {
      if (slotStart < blocked.end && slotEnd > blocked.start) {
        return { time: formatTime(slotStart, timezone), available: false }
      }
    }

    return { time: formatTime(slotStart, timezone), available: true }
  })
}

function formatTime(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).formatToParts(date)
  const hour = parts.find(p => p.type === "hour")?.value ?? "00"
  const minute = parts.find(p => p.type === "minute")?.value ?? "00"
  return `${hour}:${minute}`
}

function getApptDuration(procedures: any): number {
  if (!Array.isArray(procedures)) return 30
  for (const p of procedures) {
    if (typeof p === "object" && p?.duration) return p.duration
  }
  return 30
}

/**
 * Get the UTC offset in milliseconds for a given date string in a timezone.
 * E.g., "America/Sao_Paulo" is typically UTC-3, so returns -10800000.
 */
function getTimezoneOffsetMs(dateStr: string, timezone: string): number {
  const date = new Date(dateStr + "T12:00:00Z") // noon UTC to avoid DST edge
  const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" })
  const tzStr = date.toLocaleString("en-US", { timeZone: timezone })
  const utcDate = new Date(utcStr)
  const tzDate = new Date(tzStr)
  return tzDate.getTime() - utcDate.getTime()
}
