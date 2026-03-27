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
  endHour: number
): Promise<SlotResult[]> {
  const duration = Math.max(durationMinutes || 30, 15)
  const targetDate = new Date(date)
  const dayStart = new Date(targetDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(targetDate)
  dayEnd.setHours(23, 59, 59, 999)
  const now = new Date()

  // 1. Generate candidate slots
  const slots: Date[] = []
  const cursor = new Date(targetDate)
  cursor.setHours(startHour, 0, 0, 0)
  const endTime = new Date(targetDate)
  endTime.setHours(endHour, 0, 0, 0)

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
      return { time: formatTime(slotStart), available: false }
    }

    // Appointment overlap check
    for (const appt of appointments) {
      const apptStart = new Date(appt.date)
      const apptDuration = getApptDuration(appt.procedures) || 30
      const apptEnd = new Date(apptStart.getTime() + apptDuration * 60000)
      if (slotStart < apptEnd && slotEnd > apptStart) {
        return { time: formatTime(slotStart), available: false }
      }
    }

    // Blocked slot overlap check
    for (const blocked of blockedRanges) {
      if (slotStart < blocked.end && slotEnd > blocked.start) {
        return { time: formatTime(slotStart), available: false }
      }
    }

    return { time: formatTime(slotStart), available: true }
  })
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

function getApptDuration(procedures: any): number {
  if (!Array.isArray(procedures)) return 30
  for (const p of procedures) {
    if (typeof p === "object" && p?.duration) return p.duration
  }
  return 30
}
