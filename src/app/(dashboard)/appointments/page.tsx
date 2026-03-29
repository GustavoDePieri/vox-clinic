import { getAppointments } from "@/server/actions/appointment"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  CalendarDays,
  ClipboardList,
  Mic,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { AppointmentsFilter } from "./appointments-filter"

const statusConfig: Record<string, { label: string; dot: string; className: string }> = {
  scheduled: { label: "Agendado", dot: "bg-vox-primary", className: "bg-vox-primary/10 text-vox-primary" },
  completed: { label: "Concluído", dot: "bg-vox-success", className: "bg-vox-success/10 text-vox-success" },
  cancelled: { label: "Cancelado", dot: "bg-vox-error", className: "bg-vox-error/10 text-vox-error" },
  no_show: { label: "Faltou", dot: "bg-vox-warning", className: "bg-vox-warning/10 text-vox-warning" },
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDateGroupKey(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatDateGroupLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()

  const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" })
  const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

  if (isSameDay(d, today)) return `Hoje — ${dateStr}`
  if (isSameDay(d, tomorrow)) return `Amanhã — ${dateStr}`
  if (isSameDay(d, yesterday)) return `Ontem — ${dateStr}`
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} — ${dateStr}`
}

type Appointment = Awaited<ReturnType<typeof getAppointments>>["appointments"][number]

function groupByDate(appointments: Appointment[]) {
  const groups: { key: string; label: string; items: Appointment[] }[] = []
  const map = new Map<string, Appointment[]>()

  for (const apt of appointments) {
    const key = formatDateGroupKey(apt.date)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(apt)
  }

  for (const [key, items] of map) {
    groups.push({
      key,
      label: formatDateGroupLabel(items[0].date),
      items,
    })
  }

  return groups
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page ?? "1", 10)
  const status = params.status ?? "all"

  const data = await getAppointments(page, status)
  const groups = groupByDate(data.appointments)

  return (
    <div data-testid="page-appointments" className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            Atendimentos
            <Badge variant="secondary" className="text-[11px] tabular-nums font-semibold">
              {data.total}
            </Badge>
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Histórico de consultas e atendimentos
          </p>
        </div>
        <Link
          href="/appointments/new"
          aria-label="Nova Consulta"
          className="inline-flex items-center gap-2 rounded-xl bg-vox-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-vox-primary/20 transition-all hover:bg-vox-primary/90 hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-vox-primary/50 focus-visible:ring-offset-2"
        >
          <Mic className="size-4" />
          Nova Consulta
        </Link>
      </div>

      {/* Filters */}
      <AppointmentsFilter currentStatus={status} />

      {/* List */}
      {data.appointments.length === 0 ? (
        <div data-testid="empty-appointments" className="text-center py-16">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
            <ClipboardList className="size-6 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Nenhum atendimento encontrado
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {status !== "all" ? "Tente alterar o filtro de status" : "Registre sua primeira consulta"}
          </p>
        </div>
      ) : (
        <div data-testid="appointment-list" className="space-y-4">
          {groups.map((group) => (
            <div key={group.key}>
              {/* Date group header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  <span className="text-[13px] font-semibold text-foreground">
                    {group.label}
                  </span>
                </div>
                <Badge variant="secondary" className="text-[10px] tabular-nums">
                  {group.items.length}
                </Badge>
                <div className="flex-1 h-px bg-border/40" />
              </div>

              {/* Appointment rows */}
              <Card className="divide-y divide-border/40">
                {group.items.map((apt) => {
                  const sc = statusConfig[apt.status] ?? statusConfig.completed
                  return (
                    <Link
                      key={apt.id}
                      href={`/patients/${apt.patient.id}`}
                      data-testid="appointment-item"
                      aria-label={`Consulta de ${apt.patient.name} às ${formatTime(apt.date)}`}
                      className="group flex items-center gap-3 px-4 py-3 first:rounded-t-xl last:rounded-b-xl transition-colors hover:bg-accent cursor-pointer focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vox-primary/50 outline-none"
                    >
                      {/* Time */}
                      <div className="flex size-10 items-center justify-center rounded-xl bg-vox-primary/[0.08] text-[12px] font-bold text-vox-primary tabular-nums shrink-0">
                        {formatTime(apt.date)}
                      </div>

                      {/* Avatar initial */}
                      <div className="flex size-9 items-center justify-center rounded-full bg-vox-primary/[0.08] text-[13px] font-bold text-vox-primary shrink-0">
                        {apt.patient.name.charAt(0)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold truncate group-hover:text-vox-primary transition-colors">
                            {apt.patient.name}
                          </span>
                        </div>
                        {apt.procedures.length > 0 && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {(apt.procedures as any[]).map((p) => typeof p === "string" ? p : p?.name || String(p)).join(", ")}
                          </p>
                        )}
                      </div>

                      {/* Procedures badges (desktop) */}
                      <div className="hidden lg:flex gap-1.5 shrink-0">
                        {(apt.procedures as any[]).slice(0, 2).map((proc, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] font-medium">
                            {typeof proc === "string" ? proc : (proc as any)?.name || String(proc)}
                          </Badge>
                        ))}
                        {apt.procedures.length > 2 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{apt.procedures.length - 2}
                          </Badge>
                        )}
                      </div>

                      {/* Status */}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${sc.className}`}>
                        {sc.label}
                      </span>
                    </Link>
                  )
                })}
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 ? (
            <Link
              href={`/appointments?page=${page - 1}${status !== "all" ? `&status=${status}` : ""}`}
              aria-label="Página anterior"
              className="inline-flex items-center gap-1 rounded-xl border border-border/50 bg-card px-3 py-1.5 text-sm font-medium transition-all hover:bg-accent hover:border-border/70 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-vox-primary/50 focus-visible:ring-offset-2"
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-xl border border-border/30 px-3 py-1.5 text-sm text-muted-foreground">
              <ChevronLeft className="size-4" />
              Anterior
            </span>
          )}

          <span className="text-sm text-muted-foreground tabular-nums px-2">
            {page} / {data.totalPages}
          </span>

          {page < data.totalPages ? (
            <Link
              href={`/appointments?page=${page + 1}${status !== "all" ? `&status=${status}` : ""}`}
              aria-label="Próxima página"
              className="inline-flex items-center gap-1 rounded-xl border border-border/50 bg-card px-3 py-1.5 text-sm font-medium transition-all hover:bg-accent hover:border-border/70 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-vox-primary/50 focus-visible:ring-offset-2"
            >
              Próximo
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-xl border border-border/30 px-3 py-1.5 text-sm text-muted-foreground">
              Próximo
              <ChevronRight className="size-4" />
            </span>
          )}
        </div>
      )}
    </div>
  )
}
