import { getDashboardData } from "@/server/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  CalendarDays,
  Mic,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  CalendarCheck,
  AudioLines,
  UserPlus,
} from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const data = await getDashboardData()

  const formatDate = (date: Date | null) => {
    if (!date) return "Sem atendimento"
    return new Date(date).toLocaleDateString("pt-BR")
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDateShort = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    })
  }

  // Monthly trend
  const monthlyDiff = data.monthlyAppointments - data.lastMonthAppointments
  const monthlyTrend = data.lastMonthAppointments > 0
    ? Math.round((monthlyDiff / data.lastMonthAppointments) * 100)
    : data.monthlyAppointments > 0 ? 100 : 0

  const statusLabel: Record<string, string> = {
    scheduled: "Agendado",
    completed: "Concluído",
    cancelled: "Cancelado",
    no_show: "Faltou",
  }

  const statusColor: Record<string, string> = {
    scheduled: "bg-vox-primary/10 text-vox-primary",
    completed: "bg-vox-success/10 text-vox-success",
    cancelled: "bg-vox-error/10 text-vox-error",
    no_show: "bg-vox-warning/10 text-vox-warning",
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"

  // Next appointment today
  const now = new Date()
  const nextAppointment = data.todayAppointments.find(
    (a) => new Date(a.date) > now && a.status === "scheduled"
  )

  return (
    <div data-testid="page-dashboard" className="space-y-4">
      {/* ─── Hero + Stats combined ─── */}
      <div data-tour="hero-card" className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-vox-primary/[0.05] via-card to-vox-primary/[0.02] p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-vox-primary/[0.06] blur-3xl hidden sm:block" />

        {/* Top: greeting + CTA */}
        <div className="relative flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-[12px] text-muted-foreground font-medium">{greeting}</p>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              {data.clinicName}
            </h1>
            {nextAppointment && (
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Próxima consulta às <span className="font-semibold text-vox-primary">{formatTime(nextAppointment.date)}</span> — {nextAppointment.patient.name}
              </p>
            )}
          </div>
          <Link
            href="/appointments/new"
            aria-label="Nova Consulta"
            data-tour="cta-nova-consulta"
            className="inline-flex items-center gap-2 rounded-xl bg-vox-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-vox-primary/25 transition-all hover:bg-vox-primary/90 hover:shadow-xl hover:-translate-y-px active:translate-y-0 active:shadow-md shrink-0 focus-visible:ring-2 focus-visible:ring-vox-primary/50 focus-visible:ring-offset-2 outline-none"
          >
            <Mic className="size-4" />
            <span className="hidden sm:inline">Nova Consulta</span>
          </Link>
        </div>

        {/* Inline stats */}
        <div data-tour="stats-grid" data-testid="section-stats" className="relative grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Link href="/patients" aria-label={`Pacientes: ${data.totalPatients}`} className="group flex items-center gap-3 rounded-xl bg-background/60 backdrop-blur-sm px-3 py-2.5 border border-border/30 transition-all hover:border-border/50 hover:shadow-sm cursor-pointer">
            <div className="flex size-8 items-center justify-center rounded-lg bg-vox-primary/[0.08] transition-colors group-hover:bg-vox-primary/[0.12] shrink-0">
              <Users className="size-4 text-vox-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[18px] font-bold tabular-nums leading-none tracking-tight">{data.totalPatients}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Pacientes</p>
            </div>
          </Link>

          <Link href="/appointments" aria-label={`Consultas este mês: ${data.monthlyAppointments}`} className="group flex items-center gap-3 rounded-xl bg-background/60 backdrop-blur-sm px-3 py-2.5 border border-border/30 transition-all hover:border-border/50 hover:shadow-sm cursor-pointer">
            <div className="flex size-8 items-center justify-center rounded-lg bg-vox-success/[0.08] transition-colors group-hover:bg-vox-success/[0.12] shrink-0">
              <Stethoscope className="size-4 text-vox-success" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[18px] font-bold tabular-nums leading-none tracking-tight">{data.monthlyAppointments}</p>
                {monthlyTrend !== 0 && (
                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${monthlyTrend > 0 ? "text-vox-success" : "text-vox-error"}`}>
                    {monthlyTrend > 0 ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
                    {monthlyTrend > 0 ? "+" : ""}{monthlyTrend}%
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Este mês</p>
            </div>
          </Link>

          <Link href="/calendar" aria-label={`Consultas agendadas: ${data.scheduledAppointments}`} className="group flex items-center gap-3 rounded-xl bg-background/60 backdrop-blur-sm px-3 py-2.5 border border-border/30 transition-all hover:border-border/50 hover:shadow-sm cursor-pointer">
            <div className="flex size-8 items-center justify-center rounded-lg bg-vox-warning/[0.08] transition-colors group-hover:bg-vox-warning/[0.12] shrink-0">
              <CalendarCheck className="size-4 text-vox-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-[18px] font-bold tabular-nums leading-none tracking-tight">{data.scheduledAppointments}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Agendados</p>
            </div>
          </Link>

          <Link href="/appointments" aria-label={`Gravações: ${data.totalRecordings} áudios salvos`} className="group flex items-center gap-3 rounded-xl bg-background/60 backdrop-blur-sm px-3 py-2.5 border border-border/30 transition-all hover:border-border/50 hover:shadow-sm cursor-pointer">
            <div className="flex size-8 items-center justify-center rounded-lg bg-vox-primary/[0.08] transition-colors group-hover:bg-vox-primary/[0.12] shrink-0">
              <AudioLines className="size-4 text-vox-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[18px] font-bold tabular-nums leading-none tracking-tight">{data.totalRecordings}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Gravações</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ─── Today's Agenda + Quick Actions side by side ─── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        {/* Today's Agenda */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <div className="flex size-6 items-center justify-center rounded-lg bg-vox-primary/10">
                <Clock className="size-3.5 text-vox-primary" />
              </div>
              Agenda de Hoje
              {data.todayAppointments.length > 0 && (
                <Badge variant="secondary" className="text-[10px] tabular-nums">
                  {data.todayAppointments.length}
                </Badge>
              )}
            </CardTitle>
            <Link
              href="/calendar"
              aria-label="Ver agenda completa"
              className="text-xs font-medium text-vox-primary hover:text-vox-primary/80 flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-vox-primary/5 transition-colors focus-visible:ring-2 focus-visible:ring-vox-primary/50 focus-visible:ring-offset-2 outline-none"
            >
              Ver agenda <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.todayAppointments.length === 0 ? (
              <div data-testid="empty-today-appointments" className="text-center py-6">
                <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-muted/50">
                  <CalendarDays className="size-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhuma consulta para hoje
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sua agenda está livre
                </p>
              </div>
            ) : (
              <div data-testid="section-upcoming-appointments" className="divide-y divide-border/30">
                {data.todayAppointments.map((apt) => {
                  const isPast = new Date(apt.date) < now
                  return (
                    <Link
                      key={apt.id}
                      href={`/patients/${apt.patient.id}`}
                      aria-label={`Consulta de ${apt.patient.name} às ${formatTime(apt.date)}`}
                      className="group flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 hover:bg-accent -mx-3 px-3 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-vox-primary/50 focus-visible:ring-offset-2 outline-none"
                    >
                      {/* Time column */}
                      <div className={`text-[12px] font-bold tabular-nums shrink-0 w-11 text-center ${isPast ? "text-muted-foreground" : "text-vox-primary"}`}>
                        {formatTime(apt.date)}
                      </div>

                      {/* Timeline dot */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`size-2 rounded-full ${isPast ? "bg-muted-foreground/30" : "bg-vox-primary"}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-semibold truncate transition-colors ${isPast ? "text-muted-foreground" : "group-hover:text-vox-primary"}`}>
                          {apt.patient.name}
                        </p>
                        {apt.procedures.length > 0 && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {(apt.procedures as any[]).map((p) => typeof p === "string" ? p : p?.name || String(p)).join(", ")}
                          </p>
                        )}
                      </div>

                      {/* Status */}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor[apt.status] ?? "bg-muted text-muted-foreground"}`}>
                        {statusLabel[apt.status] ?? apt.status}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions (sidebar) */}
        <div data-tour="quick-actions" data-testid="section-quick-actions" className="flex flex-row lg:flex-col gap-2">
          {[
            { href: "/appointments/new", label: "Nova Consulta", icon: Stethoscope, accent: true },
            { href: "/patients/new/voice", label: "Cadastro por Voz", icon: Mic },
            { href: "/patients/new", label: "Novo Paciente", icon: UserPlus },
            { href: "/calendar", label: "Agendar Consulta", icon: CalendarDays },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              aria-label={action.label}
              className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[12px] font-medium transition-all active:scale-[0.98] flex-1 lg:flex-none focus-visible:ring-2 focus-visible:ring-vox-primary/50 focus-visible:ring-offset-2 outline-none ${
                action.accent
                  ? "border-vox-primary/20 bg-vox-primary/[0.05] text-vox-primary hover:bg-vox-primary/[0.10]"
                  : "border-border/50 bg-card hover:bg-accent hover:border-border/70"
              }`}
            >
              <div className={`flex size-7 items-center justify-center rounded-lg shrink-0 ${
                action.accent ? "bg-vox-primary/[0.12]" : "bg-muted"
              }`}>
                <action.icon className={`size-3.5 ${action.accent ? "text-vox-primary" : "text-muted-foreground"}`} />
              </div>
              <span className="truncate flex-1">{action.label}</span>
              <ArrowRight className={`size-3 shrink-0 opacity-0 -translate-x-1 transition-all group-hover:opacity-60 group-hover:translate-x-0 hidden lg:block ${action.accent ? "text-vox-primary" : "text-muted-foreground"}`} />
            </Link>
          ))}
        </div>
      </div>

      {/* ─── Activity + Recent Patients ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <div className="flex size-6 items-center justify-center rounded-lg bg-vox-primary/10">
                <CalendarDays className="size-3.5 text-vox-primary" />
              </div>
              Atividade Recente
            </CardTitle>
            <Link
              href="/appointments"
              aria-label="Ver toda atividade recente"
              className="text-xs font-medium text-vox-primary hover:text-vox-primary/80 flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-vox-primary/5 transition-colors focus-visible:ring-2 focus-visible:ring-vox-primary/50 focus-visible:ring-offset-2 outline-none"
            >
              Ver tudo <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentAppointments.length === 0 ? (
              <div className="text-center py-6">
                <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-muted/50">
                  <CalendarDays className="size-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhum atendimento registrado
                </p>
                <Link
                  href="/appointments/new"
                  aria-label="Registrar primeiro atendimento"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-vox-primary hover:text-vox-primary/80 rounded-lg px-3 py-1.5 hover:bg-vox-primary/5 transition-colors focus-visible:ring-2 focus-visible:ring-vox-primary/50 focus-visible:ring-offset-2 outline-none"
                >
                  <Stethoscope className="size-3" />
                  Registrar atendimento
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {data.recentAppointments.map((apt) => (
                  <Link
                    key={apt.id}
                    href={`/patients/${apt.patient.id}`}
                    aria-label={`Atendimento de ${apt.patient.name} em ${formatDateShort(apt.date)}`}
                    className="group flex items-center gap-3 py-2 first:pt-0 last:pb-0 hover:bg-accent -mx-3 px-3 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-vox-primary/50 focus-visible:ring-offset-2 outline-none"
                  >
                    <span className="text-[11px] text-muted-foreground w-11 shrink-0 tabular-nums font-medium">
                      {formatDateShort(apt.date)}
                    </span>
                    <div className="flex size-7 items-center justify-center rounded-full bg-vox-primary/[0.08] text-[10px] font-bold text-vox-primary shrink-0">
                      {apt.patient.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-medium truncate block group-hover:text-vox-primary transition-colors">
                        {apt.patient.name}
                      </span>
                    </div>
                    {apt.procedures.length > 0 && (
                      <div className="hidden sm:flex gap-1 shrink-0">
                        {apt.procedures.slice(0, 2).map((proc, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {typeof proc === "string" ? proc : (proc as any)?.name || String(proc)}
                          </Badge>
                        ))}
                        {apt.procedures.length > 2 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{apt.procedures.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor[apt.status] ?? "bg-muted text-muted-foreground"}`}>
                      {statusLabel[apt.status] ?? apt.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <div className="flex size-6 items-center justify-center rounded-lg bg-vox-primary/10">
                <Users className="size-3.5 text-vox-primary" />
              </div>
              Pacientes Recentes
            </CardTitle>
            <Link
              href="/patients"
              aria-label="Ver todos os pacientes"
              className="text-xs font-medium text-vox-primary hover:text-vox-primary/80 flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-vox-primary/5 transition-colors focus-visible:ring-2 focus-visible:ring-vox-primary/50 focus-visible:ring-offset-2 outline-none"
            >
              Ver todos <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentPatients.length === 0 ? (
              <div className="text-center py-6">
                <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-muted/50">
                  <Users className="size-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhum paciente cadastrado
                </p>
                <Link
                  href="/patients/new"
                  aria-label="Cadastrar paciente"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-vox-primary hover:text-vox-primary/80 rounded-lg px-3 py-1.5 hover:bg-vox-primary/5 transition-colors focus-visible:ring-2 focus-visible:ring-vox-primary/50 focus-visible:ring-offset-2 outline-none"
                >
                  <UserPlus className="size-3" />
                  Cadastrar paciente
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border/30">
                {data.recentPatients.map((patient) => (
                  <li key={patient.id}>
                    <Link
                      href={`/patients/${patient.id}`}
                      aria-label={`Ver paciente ${patient.name}`}
                      className="group flex items-center gap-3 py-2 first:pt-0 last:pb-0 hover:bg-accent -mx-3 px-3 rounded-lg text-sm transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-vox-primary/50 focus-visible:ring-offset-2 outline-none"
                    >
                      <div className="flex size-7 items-center justify-center rounded-full bg-vox-primary/[0.08] text-[10px] font-bold text-vox-primary shrink-0">
                        {patient.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block group-hover:text-vox-primary transition-colors text-[13px]">
                          {patient.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(patient.lastAppointment)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
