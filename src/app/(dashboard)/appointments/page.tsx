import { getAppointments } from "@/server/actions/appointment"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, ClipboardList } from "lucide-react"
import Link from "next/link"
import { AppointmentsFilter } from "./appointments-filter"

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Agendado", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  completed: { label: "Concluido", className: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelado", className: "bg-red-100 text-red-700 border-red-200" },
  no_show: { label: "Faltou", className: "bg-amber-100 text-amber-700 border-amber-200" },
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <ClipboardList className="size-5 text-vox-primary" />
          Atendimentos
          <span className="text-sm font-normal text-muted-foreground">
            ({data.total})
          </span>
        </h1>
        <Link
          href="/appointments/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-vox-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-vox-primary/90 transition-colors"
        >
          <CalendarDays className="size-3.5" />
          Nova Consulta
        </Link>
      </div>

      <AppointmentsFilter currentStatus={status} />

      {data.appointments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="size-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum atendimento encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.appointments.map((apt) => {
            const sc = statusConfig[apt.status] ?? statusConfig.completed
            return (
              <Card key={apt.id} className="rounded-2xl">
                <CardContent className="flex items-start justify-between gap-4 py-4">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {formatDate(apt.date)}
                      </span>
                      <Badge
                        variant="outline"
                        className={sc.className}
                      >
                        {sc.label}
                      </Badge>
                    </div>
                    <div>
                      <Link
                        href={`/patients/${apt.patient.id}`}
                        className="text-sm font-medium text-vox-primary hover:underline"
                      >
                        {apt.patient.name}
                      </Link>
                    </div>
                    {apt.procedures.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {apt.procedures.map((proc, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {proc}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {apt.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {apt.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          {page > 1 ? (
            <Link
              href={`/appointments?page=${page - 1}${status !== "all" ? `&status=${status}` : ""}`}
              className="text-sm font-medium text-vox-primary hover:underline"
            >
              Anterior
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">Anterior</span>
          )}
          <span className="text-sm text-muted-foreground">
            Pagina {page} de {data.totalPages}
          </span>
          {page < data.totalPages ? (
            <Link
              href={`/appointments?page=${page + 1}${status !== "all" ? `&status=${status}` : ""}`}
              className="text-sm font-medium text-vox-primary hover:underline"
            >
              Proximo
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">Proximo</span>
          )}
        </div>
      )}
    </div>
  )
}
