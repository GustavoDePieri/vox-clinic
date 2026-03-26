"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core"
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  List,
  Plus,
  Clock,
  X,
  Check,
  XCircle,
  AlertTriangle,
  Search,
  Loader2,
  Calendar as CalendarIcon,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  getAppointmentsByDateRange,
  scheduleAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  rescheduleAppointment,
} from "@/server/actions/appointment"
import { searchPatients } from "@/server/actions/patient"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// ────────────────────── Types ──────────────────────

interface AppointmentItem {
  id: string
  date: string
  patient: { id: string; name: string }
  procedures: string[]
  notes: string | null
  status: string
}

interface PatientOption {
  id: string
  name: string
  phone: string | null
  document: string | null
  updatedAt: Date
}

type ViewMode = "month" | "week" | "day" | "list"

// ────────────────────── Helpers ──────────────────────

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]
const MONTH_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]
const DAY_FULL = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"]
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7h to 20h

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function formatDateBR(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

function isToday(date: Date) {
  return isSameDay(date, new Date())
}

function getMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function getMonthGrid(year: number, month: number) {
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

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Agendado", className: "bg-vox-primary/10 text-vox-primary" },
  completed: { label: "Concluido", className: "bg-vox-success/10 text-vox-success" },
  cancelled: { label: "Cancelado", className: "bg-vox-error/10 text-vox-error" },
  no_show: { label: "Faltou", className: "bg-vox-warning/10 text-vox-warning" },
}

const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-vox-primary",
  completed: "bg-vox-success",
  cancelled: "bg-vox-error",
  no_show: "bg-vox-warning",
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

// ────────────────────── Drag & Drop Components ──────────────────────

function DraggableAppointment({ appointment, children }: { appointment: AppointmentItem; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: appointment.id,
    data: appointment,
  })

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? "opacity-50" : ""}>
      {children}
    </div>
  )
}

function DroppableCell({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div ref={setNodeRef} className={`${className ?? ""} ${isOver ? "bg-vox-primary/10 ring-1 ring-vox-primary/30" : ""}`}>
      {children}
    </div>
  )
}

// ────────────────────── Main Component ──────────────────────

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [currentDate, setCurrentDate] = useState(now) // used for week/day
  const [view, setView] = useState<ViewMode>("week")
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const router = useRouter()

  // Schedule form
  const [patientQuery, setPatientQuery] = useState("")
  const [patientResults, setPatientResults] = useState<PatientOption[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null)
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [scheduleNotes, setScheduleNotes] = useState("")
  const [searchingPatients, setSearchingPatients] = useState(false)

  // Compute date range based on view
  const getDateRange = useCallback((): [Date, Date] => {
    if (view === "week") {
      const monday = getMonday(currentDate)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)
      return [monday, sunday]
    }
    if (view === "day") {
      const start = new Date(currentDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(currentDate)
      end.setHours(23, 59, 59, 999)
      return [start, end]
    }
    // month / list
    return [new Date(year, month, 1), new Date(year, month + 1, 0, 23, 59, 59, 999)]
  }, [view, currentDate, year, month])

  const loadAppointments = useCallback(() => {
    setLoading(true)
    const [start, end] = getDateRange()
    startTransition(async () => {
      try {
        const data = await getAppointmentsByDateRange(start.toISOString(), end.toISOString())
        setAppointments(data)
      } catch {
        setAppointments([])
      } finally {
        setLoading(false)
      }
    })
  }, [getDateRange])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  // Patient search with debounce
  useEffect(() => {
    if (!patientQuery.trim() || patientQuery.length < 2) { setPatientResults([]); return }
    const timeout = setTimeout(async () => {
      setSearchingPatients(true)
      try { setPatientResults(await searchPatients(patientQuery)) } catch { setPatientResults([]) }
      finally { setSearchingPatients(false) }
    }, 300)
    return () => clearTimeout(timeout)
  }, [patientQuery])

  // ── Navigation ──
  function navigatePrev() {
    if (view === "month" || view === "list") {
      if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1)
      setSelectedDay(null)
    } else if (view === "week") {
      setCurrentDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
    } else {
      setCurrentDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
    }
  }

  function navigateNext() {
    if (view === "month" || view === "list") {
      if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1)
      setSelectedDay(null)
    } else if (view === "week") {
      setCurrentDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
    } else {
      setCurrentDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })
    }
  }

  function goToday() {
    const today = new Date()
    setYear(today.getFullYear())
    setMonth(today.getMonth())
    setCurrentDate(today)
    setSelectedDay(null)
  }

  // ── Title ──
  function getTitle() {
    if (view === "month" || view === "list") return `${MONTH_NAMES[month]} ${year}`
    if (view === "week") {
      const monday = getMonday(currentDate)
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
      if (monday.getMonth() === sunday.getMonth()) {
        return `${monday.getDate()} – ${sunday.getDate()} ${MONTH_SHORT[monday.getMonth()]} ${monday.getFullYear()}`
      }
      return `${monday.getDate()} ${MONTH_SHORT[monday.getMonth()]} – ${sunday.getDate()} ${MONTH_SHORT[sunday.getMonth()]} ${sunday.getFullYear()}`
    }
    return `${DAY_FULL[currentDate.getDay()]}, ${currentDate.getDate()} de ${MONTH_NAMES[currentDate.getMonth()]}`
  }

  function getAppointmentsForDay(day: number) {
    return appointments.filter((a) => {
      const d = new Date(a.date)
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
    })
  }

  function getAppointmentsForDate(date: Date) {
    return appointments.filter((a) => isSameDay(new Date(a.date), date))
  }

  async function handleSchedule(forceSchedule = false) {
    if (!selectedPatient || !scheduleDate || !scheduleTime) return
    const dateTime = new Date(`${scheduleDate}T${scheduleTime}:00`)
    try {
      await scheduleAppointment({
        patientId: selectedPatient.id,
        date: dateTime.toISOString(),
        notes: scheduleNotes || undefined,
        forceSchedule,
      })
      setShowScheduleForm(false)
      resetScheduleForm()
      loadAppointments()
    } catch (err: any) {
      const msg = err.message || "Erro ao agendar consulta"
      if (msg.startsWith("CONFLICT:")) {
        if (confirm(msg.replace("CONFLICT:", ""))) handleSchedule(true)
      } else toast.error(msg)
    }
  }

  function resetScheduleForm() {
    setPatientQuery(""); setPatientResults([]); setSelectedPatient(null)
    setScheduleDate(""); setScheduleTime(""); setScheduleNotes("")
  }

  async function handleStatusChange(appointmentId: string, status: string) {
    try { await updateAppointmentStatus(appointmentId, status); loadAppointments(); toast.success("Status atualizado") }
    catch (err: any) { toast.error(err.message || "Erro ao atualizar status") }
  }

  function handleDelete(appointmentId: string) {
    setDeleteTarget(appointmentId)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try { await deleteAppointment(deleteTarget); loadAppointments(); toast.success("Consulta excluída") }
    catch (err: any) { toast.error(err.message || "Erro ao excluir consulta") }
    finally { setDeleteTarget(null) }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return
    const droppableId = over.id as string
    // droppableId format: "ISO_DATE-HOUR"
    const lastDash = droppableId.lastIndexOf("-")
    const dateIso = droppableId.substring(0, lastDash)
    const hour = parseInt(droppableId.substring(lastDash + 1), 10)

    const appointment = appointments.find((a) => a.id === active.id)
    if (!appointment) return

    // Check if it's the same slot
    const oldDate = new Date(appointment.date)
    const newDate = new Date(dateIso)
    newDate.setHours(hour, oldDate.getMinutes(), 0, 0)
    if (oldDate.getTime() === newDate.getTime()) return

    try {
      await rescheduleAppointment(appointment.id, newDate.toISOString())
      loadAppointments()
    } catch (err: any) {
      alert(err.message || "Erro ao reagendar consulta")
    }
  }

  const cells = getMonthGrid(year, month)
  const selectedDayAppointments = selectedDay ? getAppointmentsForDay(selectedDay) : []

  // Group by date for list view
  const groupedByDate = appointments.reduce<Record<string, AppointmentItem[]>>((acc, a) => {
    const key = a.date.slice(0, 10); if (!acc[key]) acc[key] = []; acc[key].push(a); return acc
  }, {})
  const sortedDateKeys = Object.keys(groupedByDate).sort()

  // Week data
  const weekDays = view === "week" ? getWeekDays(getMonday(currentDate)) : []

  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button onClick={navigatePrev} className="flex size-8 items-center justify-center rounded-xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-4" />
          </button>
          <h1 className="text-base font-semibold tracking-tight min-w-[200px] text-center">
            {getTitle()}
          </h1>
          <button onClick={navigateNext} className="flex size-8 items-center justify-center rounded-xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground">
            <ChevronRight className="size-4" />
          </button>
          <Button variant="outline" size="sm" onClick={goToday} className="ml-1 text-[11px] h-7 px-2.5">
            Hoje
          </Button>
          <Badge variant="secondary" className="ml-1 text-[10px] tabular-nums hidden sm:inline-flex">
            {appointments.length} consultas
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl bg-muted/50 p-0.5">
            {([
              { key: "day" as const, label: "Dia", icon: Sun },
              { key: "week" as const, label: "Semana", icon: CalendarIcon },
              { key: "month" as const, label: "Mes", icon: CalendarDays },
              { key: "list" as const, label: "Lista", icon: List },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setView(key)
                  if ((key === "month" || key === "list") && (view === "week" || view === "day")) {
                    setYear(currentDate.getFullYear())
                    setMonth(currentDate.getMonth())
                  }
                  if ((key === "week" || key === "day") && (view === "month" || view === "list")) {
                    setCurrentDate(new Date(year, month, selectedDay ?? new Date().getDate()))
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
                  view === key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <Button
            onClick={() => setShowScheduleForm(true)}
            className="bg-vox-primary hover:bg-vox-primary/90 text-white rounded-xl text-xs gap-1.5 shadow-sm shadow-vox-primary/15 active:scale-[0.98]"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Agendar</span>
          </Button>
        </div>
      </div>

      {/* ─── Schedule Form ─── */}
      {showScheduleForm && (
        <ScheduleForm
          patientQuery={patientQuery} setPatientQuery={setPatientQuery}
          patientResults={patientResults} searchingPatients={searchingPatients}
          selectedPatient={selectedPatient} setSelectedPatient={setSelectedPatient}
          setPatientResults={setPatientResults}
          scheduleDate={scheduleDate} setScheduleDate={setScheduleDate}
          scheduleTime={scheduleTime} setScheduleTime={setScheduleTime}
          scheduleNotes={scheduleNotes} setScheduleNotes={setScheduleNotes}
          onSchedule={() => handleSchedule()} onCancel={() => { setShowScheduleForm(false); resetScheduleForm() }}
        />
      )}

      {/* ─── Loading ─── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="size-5 animate-spin text-vox-primary" />
          <p className="text-xs text-muted-foreground">Carregando agenda...</p>
        </div>
      )}

      {/* ─── Week View ─── */}
      {!loading && view === "week" && (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Card className="rounded-2xl border border-border/40 overflow-hidden">
           <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/40 min-w-[600px]">
              <div className="py-2" />
              {weekDays.map((d) => {
                const today = isToday(d)
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => { setCurrentDate(d); setView("day") }}
                    className={`flex flex-col items-center gap-0.5 py-2 transition-colors hover:bg-muted/40 ${today ? "bg-vox-primary/5" : ""}`}
                  >
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">{DAY_NAMES[d.getDay()]}</span>
                    <span className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                      today ? "bg-vox-primary text-white" : "text-foreground"
                    }`}>
                      {d.getDate()}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Time grid */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] max-h-[calc(100vh-280px)] overflow-y-auto min-w-[600px]">
              {HOURS.map((hour) => (
                <div key={hour} className="contents">
                  {/* Hour label */}
                  <div className="flex items-start justify-end pr-2 pt-1 text-[10px] text-muted-foreground h-16 border-b border-border/10">
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  {/* Day columns */}
                  {weekDays.map((d) => {
                    const dayAppts = getAppointmentsForDate(d).filter((a) => {
                      const h = new Date(a.date).getHours()
                      return h === hour
                    })
                    const cellId = `${d.toISOString()}-${hour}`
                    return (
                      <DroppableCell
                        key={cellId}
                        id={cellId}
                        className={`h-16 border-b border-l border-border/10 px-0.5 py-0.5 transition-colors ${isToday(d) ? "bg-vox-primary/[0.02]" : ""}`}
                      >
                        {dayAppts.map((a) => (
                          <DraggableAppointment key={a.id} appointment={a}>
                            <div
                              onClick={() => router.push(`/patients/${a.patient.id}`)}
                              className={`block truncate rounded-md px-1.5 py-1 text-[10px] font-medium leading-tight mb-0.5 cursor-grab active:cursor-grabbing transition-opacity hover:opacity-80 ${
                                STATUS_CONFIG[a.status]?.className ?? "bg-muted text-muted-foreground"
                              }`}
                            >
                              <span className="font-semibold">{formatTime(a.date)}</span>{" "}
                              {a.patient.name.split(" ")[0]}
                            </div>
                          </DraggableAppointment>
                        ))}
                      </DroppableCell>
                    )
                  })}
                </div>
              ))}
            </div>
           </div>
          </Card>

          {/* Drag overlay */}
          <DragOverlay>
            {activeDragId ? (() => {
              const a = appointments.find((ap) => ap.id === activeDragId)
              if (!a) return null
              return (
                <div className={`truncate rounded-md px-1.5 py-1 text-[10px] font-medium leading-tight shadow-lg ${
                  STATUS_CONFIG[a.status]?.className ?? "bg-muted text-muted-foreground"
                }`}>
                  <span className="font-semibold">{formatTime(a.date)}</span>{" "}
                  {a.patient.name.split(" ")[0]}
                </div>
              )
            })() : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* ─── Day View ─── */}
      {!loading && view === "day" && (
        <Card className="rounded-2xl border border-border/40 overflow-hidden">
          <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
            {HOURS.map((hour) => {
              const hourAppts = getAppointmentsForDate(currentDate).filter((a) => new Date(a.date).getHours() === hour)
              return (
                <div key={hour} className="flex border-b border-border/10">
                  {/* Hour label */}
                  <div className="flex w-16 shrink-0 items-start justify-end pr-3 pt-2 text-[11px] text-muted-foreground font-medium">
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  {/* Appointments */}
                  <div className="flex-1 min-h-[64px] border-l border-border/10 px-2 py-1 space-y-1">
                    {hourAppts.map((a) => (
                      <AppointmentCard
                        key={a.id}
                        appointment={a}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        compact
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ─── Month View ─── */}
      {!loading && view === "month" && (
        <>
          <Card className="rounded-2xl border border-border/40 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border/40">
              {DAY_NAMES.map((d) => (
                <div key={d} className="py-2.5 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px] border-b border-r border-border/20 bg-muted/20" />
                const dayDate = new Date(year, month, day)
                const dayAppts = getAppointmentsForDay(day)
                const today = isToday(dayDate)
                const isSelected = selectedDay === day
                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                    className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-border/20 p-1.5 text-left transition-all hover:bg-muted/40 ${isSelected ? "bg-vox-primary/5 ring-1 ring-vox-primary/30" : ""}`}
                  >
                    <div className={`flex items-center justify-center size-7 rounded-full text-xs font-medium mb-1 ${today ? "bg-vox-primary text-white" : "text-foreground"}`}>
                      {day}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {dayAppts.slice(0, 2).map((a) => (
                        <div key={a.id} className={`hidden sm:block truncate text-[10px] px-1.5 py-0.5 rounded-md ${STATUS_CONFIG[a.status]?.className ?? "bg-muted"}`}>
                          {formatTime(a.date)} {a.patient.name.split(" ")[0]}
                        </div>
                      ))}
                      {dayAppts.length > 0 && (
                        <div className="flex gap-0.5 sm:hidden mt-0.5">
                          {dayAppts.slice(0, 3).map((a) => (
                            <div key={a.id} className={`size-1.5 rounded-full ${STATUS_DOT[a.status] ?? "bg-muted-foreground"}`} />
                          ))}
                          {dayAppts.length > 3 && <span className="text-[9px] text-muted-foreground">+{dayAppts.length - 3}</span>}
                        </div>
                      )}
                      {dayAppts.length > 2 && <span className="hidden sm:block text-[10px] text-muted-foreground px-1.5">+{dayAppts.length - 2} mais</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          {selectedDay !== null && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">{selectedDay} de {MONTH_NAMES[month]} de {year}</h2>
              {selectedDayAppointments.length === 0 ? (
                <Card className="rounded-2xl border border-border/40 p-6">
                  <div className="text-center text-muted-foreground">
                    <CalendarDays className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Nenhuma consulta neste dia</p>
                    <Button
                      onClick={() => { setShowScheduleForm(true); setScheduleDate(`${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`) }}
                      variant="outline" className="mt-3 rounded-xl text-xs gap-1.5"
                    >
                      <Plus className="size-3.5" /> Agendar neste dia
                    </Button>
                  </div>
                </Card>
              ) : (
                selectedDayAppointments.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} onStatusChange={handleStatusChange} onDelete={handleDelete} />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* ─── List View ─── */}
      {!loading && view === "list" && (
        <div className="space-y-4">
          {sortedDateKeys.length === 0 ? (
            <Card className="rounded-2xl border border-border/40 p-8">
              <div className="text-center text-muted-foreground">
                <CalendarDays className="size-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">Nenhuma consulta agendada</p>
                <p className="text-xs mt-1">Nenhuma consulta encontrada neste mes.</p>
                <Button onClick={() => setShowScheduleForm(true)} className="mt-4 bg-vox-primary hover:bg-vox-primary/90 text-white rounded-xl text-xs gap-1.5">
                  <Plus className="size-3.5" /> Agendar Consulta
                </Button>
              </div>
            </Card>
          ) : (
            sortedDateKeys.map((dateKey) => (
              <div key={dateKey}>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{formatDateBR(dateKey + "T00:00:00")}</h3>
                <div className="space-y-2">
                  {groupedByDate[dateKey].map((a) => (
                    <AppointmentCard key={a.id} appointment={a} onStatusChange={handleStatusChange} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir consulta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta consulta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-vox-error text-white hover:bg-vox-error/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ────────────────────── Schedule Form ──────────────────────

function ScheduleForm(props: {
  patientQuery: string; setPatientQuery: (v: string) => void
  patientResults: PatientOption[]; searchingPatients: boolean
  selectedPatient: PatientOption | null; setSelectedPatient: (v: PatientOption | null) => void
  setPatientResults: (v: PatientOption[]) => void
  scheduleDate: string; setScheduleDate: (v: string) => void
  scheduleTime: string; setScheduleTime: (v: string) => void
  scheduleNotes: string; setScheduleNotes: (v: string) => void
  onSchedule: () => void; onCancel: () => void
}) {
  return (
    <Card className="rounded-2xl border border-border/40 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Agendar Nova Consulta</h2>
        <button onClick={props.onCancel} className="p-1 rounded-lg hover:bg-muted/60 text-muted-foreground">
          <X className="size-4" />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs">Paciente</Label>
          {props.selectedPatient ? (
            <div className="flex items-center gap-2 rounded-xl bg-vox-primary/5 border border-vox-primary/20 px-3 py-2">
              <span className="text-sm font-medium">{props.selectedPatient.name}</span>
              <button onClick={() => { props.setSelectedPatient(null); props.setPatientQuery("") }} className="ml-auto p-0.5 rounded hover:bg-muted/60">
                <X className="size-3.5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input placeholder="Buscar paciente por nome..." aria-label="Buscar paciente por nome" value={props.patientQuery} onChange={(e) => props.setPatientQuery(e.target.value)} className="pl-9 rounded-xl text-sm" />
              {(props.patientResults.length > 0 || props.searchingPatients) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border/60 rounded-xl shadow-lg z-10 overflow-hidden">
                  {props.searchingPatients ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />Buscando...</div>
                  ) : (
                    props.patientResults.map((p) => (
                      <button key={p.id} onClick={() => { props.setSelectedPatient(p); props.setPatientQuery(""); props.setPatientResults([]) }}
                        className="w-full text-left px-3 py-2.5 hover:bg-muted/60 transition-colors border-b border-border/30 last:border-0">
                        <div className="text-sm font-medium">{p.name}</div>
                        {p.phone && <div className="text-[11px] text-muted-foreground">{p.phone}</div>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Data</Label>
          <Input type="date" value={props.scheduleDate} onChange={(e) => props.setScheduleDate(e.target.value)} className="rounded-xl text-sm" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Horario</Label>
          <Input type="time" value={props.scheduleTime} onChange={(e) => props.setScheduleTime(e.target.value)} className="rounded-xl text-sm" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs">Observacoes (opcional)</Label>
          <Textarea value={props.scheduleNotes} onChange={(e) => props.setScheduleNotes(e.target.value)} placeholder="Notas sobre a consulta..." className="rounded-xl text-sm min-h-[80px]" />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={props.onCancel} className="rounded-xl text-xs">Cancelar</Button>
        <Button onClick={props.onSchedule} disabled={!props.selectedPatient || !props.scheduleDate || !props.scheduleTime}
          className="bg-vox-primary hover:bg-vox-primary/90 text-white rounded-xl text-xs">Agendar</Button>
      </div>
    </Card>
  )
}

// ────────────────────── Appointment Card ──────────────────────

function AppointmentCard({
  appointment, onStatusChange, onDelete, compact,
}: {
  appointment: AppointmentItem
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
  compact?: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  if (compact) {
    return (
      <Link
        href={`/patients/${appointment.patient.id}`}
        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] transition-all hover:shadow-sm ${STATUS_CONFIG[appointment.status]?.className ?? "bg-muted"}`}
      >
        <span className="font-semibold tabular-nums">{formatTime(appointment.date)}</span>
        <span className="truncate font-medium">{appointment.patient.name}</span>
        <div className={`size-1.5 rounded-full ml-auto shrink-0 ${STATUS_DOT[appointment.status] ?? "bg-muted-foreground"}`} />
      </Link>
    )
  }

  return (
    <Card
      className="group rounded-2xl border border-border/40 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] overflow-hidden cursor-pointer transition-all hover:border-border hover:shadow-[0_4px_12px_0_rgb(0_0_0/0.06)]"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
              <Clock className="size-3.5" />
              <span className="text-xs font-medium">{formatTime(appointment.date)}</span>
            </div>
            <div className="min-w-0">
              <Link href={`/patients/${appointment.patient.id}`} onClick={(e) => e.stopPropagation()}
                className="text-sm font-medium hover:text-vox-primary transition-colors truncate block">
                {appointment.patient.name}
              </Link>
            </div>
          </div>
          <StatusBadge status={appointment.status} />
        </div>
        {appointment.procedures.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {(appointment.procedures as any[]).map((proc, i) => {
              const name = typeof proc === "string" ? proc : (proc as any)?.name || String(proc)
              return <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-medium text-muted-foreground">{name}</span>
            })}
          </div>
        )}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border/30 space-y-3" onClick={(e) => e.stopPropagation()}>
            {appointment.notes && <p className="text-xs text-muted-foreground">{appointment.notes}</p>}
            <div className="flex flex-wrap gap-2">
              {appointment.status === "scheduled" && (
                <>
                  <Button size="sm" onClick={() => onStatusChange(appointment.id, "completed")} className="rounded-xl text-[11px] h-7 gap-1 bg-vox-success hover:bg-vox-success/90 text-white">
                    <Check className="size-3" />Concluir
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onStatusChange(appointment.id, "cancelled")} className="rounded-xl text-[11px] h-7 gap-1 text-vox-error border-vox-error/30 hover:bg-vox-error/5">
                    <XCircle className="size-3" />Cancelar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onStatusChange(appointment.id, "no_show")} className="rounded-xl text-[11px] h-7 gap-1 text-vox-warning border-vox-warning/30 hover:bg-vox-warning/5">
                    <AlertTriangle className="size-3" />Faltou
                  </Button>
                </>
              )}
              {appointment.status !== "scheduled" && (
                <Button size="sm" variant="outline" onClick={() => onStatusChange(appointment.id, "scheduled")} className="rounded-xl text-[11px] h-7 gap-1">Reagendar</Button>
              )}
              <Button size="sm" variant="outline" onClick={() => onDelete(appointment.id)} className="rounded-xl text-[11px] h-7 gap-1 text-vox-error border-vox-error/30 hover:bg-vox-error/5 ml-auto">
                <X className="size-3" />Excluir
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
