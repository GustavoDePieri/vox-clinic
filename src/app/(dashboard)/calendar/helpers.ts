import type { AppointmentItem } from "./types"
import type { BlockedSlotItem } from "@/server/actions/blocked-slot"

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]
export const MONTH_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
export const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]
export const DAY_FULL = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"]
export const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7h to 20h

export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Agendado", className: "bg-vox-primary/10 text-vox-primary" },
  completed: { label: "Concluido", className: "bg-vox-success/10 text-vox-success" },
  cancelled: { label: "Cancelado", className: "bg-vox-error/10 text-vox-error" },
  no_show: { label: "Faltou", className: "bg-vox-warning/10 text-vox-warning" },
}

export const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-vox-primary",
  completed: "bg-vox-success",
  cancelled: "bg-vox-error",
  no_show: "bg-vox-warning",
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export function formatDateBR(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

export function isToday(date: Date) {
  return isSameDay(date, new Date())
}

export function getMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

// Pre-index appointments by "YYYY-MM-DD-HH" key for O(1) lookup
export function buildAppointmentIndex(appointments: AppointmentItem[]): Map<string, AppointmentItem[]> {
  const index = new Map<string, AppointmentItem[]>()
  for (const a of appointments) {
    const d = new Date(a.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}-${d.getHours()}`
    const existing = index.get(key)
    if (existing) existing.push(a)
    else index.set(key, [a])
  }
  return index
}

// Pre-index appointments by date key "YYYY-MM-DD"
export function buildDayIndex(appointments: AppointmentItem[]): Map<string, AppointmentItem[]> {
  const index = new Map<string, AppointmentItem[]>()
  for (const a of appointments) {
    const key = a.date.slice(0, 10)
    const existing = index.get(key)
    if (existing) existing.push(a)
    else index.set(key, [a])
  }
  return index
}

// Get blocked slots for a specific hour on a specific date
export function getBlockedSlotsForHour(blockedSlots: BlockedSlotItem[], date: Date, hour: number): BlockedSlotItem[] {
  return blockedSlots.filter((s) => {
    if (s.allDay) {
      const dateStart = new Date(date); dateStart.setHours(0, 0, 0, 0)
      const dateEnd = new Date(date); dateEnd.setHours(23, 59, 59, 999)
      const start = new Date(s.startDate)
      const end = new Date(s.endDate)
      return start <= dateEnd && end >= dateStart
    }
    const start = new Date(s.startDate)
    const end = new Date(s.endDate)
    const hourStart = new Date(date); hourStart.setHours(hour, 0, 0, 0)
    const hourEnd = new Date(date); hourEnd.setHours(hour, 59, 59, 999)
    return start <= hourEnd && end >= hourStart
  })
}

// Convert hex color to rgba with given opacity (for agenda-colored backgrounds)
export function agendaColorBg(hex: string | undefined, opacity = 0.1): string {
  if (!hex || hex.length < 7) return `rgba(20, 184, 166, ${opacity})` // default teal
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Default appointment duration in ms (30 min)
const DEFAULT_DURATION_MS = 30 * 60 * 1000

function getAppointmentEndMs(a: AppointmentItem): number {
  return new Date(a.date).getTime() + DEFAULT_DURATION_MS
}

export interface OverlapPosition {
  column: number
  totalColumns: number
}

// Calculate side-by-side layout for overlapping appointments within an hour bucket.
// Returns a Map from appointment id to its column position and total columns in its group.
export function calculateOverlapLayout(appointments: AppointmentItem[]): Map<string, OverlapPosition> {
  const layout = new Map<string, OverlapPosition>()
  if (appointments.length === 0) return layout

  // Sort by start time, then by id for stable ordering
  const sorted = [...appointments].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
    return diff !== 0 ? diff : a.id.localeCompare(b.id)
  })

  // Group overlapping appointments
  const groups: AppointmentItem[][] = []
  for (const appt of sorted) {
    const apptStart = new Date(appt.date).getTime()

    let placed = false
    for (const group of groups) {
      // Check if this appointment overlaps with any in the group
      const groupEnd = Math.max(...group.map(getAppointmentEndMs))
      if (apptStart < groupEnd) {
        group.push(appt)
        placed = true
        break
      }
    }
    if (!placed) {
      groups.push([appt])
    }
  }

  // Assign columns within each group
  for (const group of groups) {
    const totalColumns = group.length
    group.forEach((appt, idx) => {
      layout.set(appt.id, { column: idx, totalColumns })
    })
  }

  return layout
}

// Get blocked slots for a full date
export function getBlockedSlotsForDate(blockedSlots: BlockedSlotItem[], date: Date): BlockedSlotItem[] {
  return blockedSlots.filter((s) => {
    const start = new Date(s.startDate)
    const end = new Date(s.endDate)
    if (s.allDay) {
      const dateStart = new Date(date); dateStart.setHours(0, 0, 0, 0)
      const dateEnd = new Date(date); dateEnd.setHours(23, 59, 59, 999)
      return start <= dateEnd && end >= dateStart
    }
    return isSameDay(start, date) || isSameDay(end, date) || (start < date && end > date)
  })
}
