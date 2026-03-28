"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Percent,
  DollarSign,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  Loader2,
  Building2,
} from "lucide-react"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"
import {
  getCommissionReport,
  markCommissionsPaid,
} from "@/server/actions/commission"

type ReportData = Awaited<ReturnType<typeof getCommissionReport>>

const formatBRL = (centavos: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100)

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  paid: "Pago",
  cancelled: "Cancelado",
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
}

export function CommissionsTab() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportData | null>(null)
  const [period, setPeriod] = useState<"month" | "year">("month")
  const [expandedMember, setExpandedMember] = useState<string | null>(null)
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [payDate, setPayDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [paying, setPaying] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const now = new Date().toISOString()
      const report = await getCommissionReport(period, now)
      setData(report)
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao carregar comissoes"))
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    loadData()
  }, [loadData])

  function toggleEntry(entryId: string) {
    setSelectedEntries((prev) => {
      const next = new Set(prev)
      if (next.has(entryId)) next.delete(entryId)
      else next.add(entryId)
      return next
    })
  }

  function selectAllPending() {
    if (!data) return
    const pendingIds = data.entries
      .filter((e) => e.status === "pending" || e.status === "approved")
      .map((e) => e.id)
    setSelectedEntries(new Set(pendingIds))
  }

  async function handleMarkPaid() {
    if (selectedEntries.size === 0) return
    setPaying(true)
    try {
      const result = await markCommissionsPaid(
        Array.from(selectedEntries),
        payDate
      )
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(`${result.count} comissoes marcadas como pagas`)
      setSelectedEntries(new Set())
      setPayDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!data) return null

  const { summary, members, entries } = data

  return (
    <div className="space-y-4">
      {/* Period toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex rounded-xl bg-muted/50 p-0.5">
          <button
            onClick={() => setPeriod("month")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              period === "month"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Este Mes
          </button>
          <button
            onClick={() => setPeriod("year")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              period === "year"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Este Ano
          </button>
        </div>
        {selectedEntries.size > 0 && (
          <Button
            size="sm"
            onClick={() => setPayDialogOpen(true)}
            className="bg-vox-success text-white hover:bg-vox-success/90"
          >
            <CheckCircle2 className="size-4" />
            Marcar como Pago ({selectedEntries.size})
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Card className="group relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Pendente
                </p>
                <p className="text-2xl font-bold mt-0.5 text-amber-600 tabular-nums">
                  {formatBRL(summary.totalPending)}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100">
                <Clock className="size-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-vox-success/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Pago
                </p>
                <p className="text-2xl font-bold mt-0.5 text-vox-success tabular-nums">
                  {formatBRL(summary.totalPaid)}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-vox-success/10">
                <CheckCircle2 className="size-4 text-vox-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-vox-primary/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Retencao Clinica
                </p>
                <p className="text-2xl font-bold mt-0.5 tabular-nums">
                  {formatBRL(summary.clinicRetention)}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-vox-primary/10">
                <Building2 className="size-4 text-vox-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-professional table */}
      {members.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/50 mb-3">
                <Percent className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Nenhuma comissao neste periodo
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Comissoes sao calculadas automaticamente quando consultas com
                preco e profissional sao concluidas
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="size-4 text-vox-primary" />
              Por Profissional
            </CardTitle>
            {entries.some(
              (e) => e.status === "pending" || e.status === "approved"
            ) && (
              <Button variant="outline" size="sm" onClick={selectAllPending}>
                Selecionar Pendentes
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-1">
            {members.map((member) => {
              const isExpanded = expandedMember === member.memberId
              const memberEntries = entries.filter(
                (e) => e.memberId === member.memberId
              )

              return (
                <div key={member.memberId}>
                  {/* Member row */}
                  <button
                    onClick={() =>
                      setExpandedMember(isExpanded ? null : member.memberId)
                    }
                    className="w-full flex items-center justify-between rounded-xl px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground" />
                      )}
                      <div className="text-left">
                        <p className="text-sm font-medium">
                          {member.memberName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.totalAppointments} atendimento
                          {member.totalAppointments !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Receita Bruta
                        </p>
                        <p className="text-sm font-medium tabular-nums">
                          {formatBRL(member.grossRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Comissao
                        </p>
                        <p className="text-sm font-bold text-vox-primary tabular-nums">
                          {formatBRL(member.commissionAmount)}
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs text-muted-foreground">
                          Pendente
                        </p>
                        <p className="text-sm font-medium text-amber-600 tabular-nums">
                          {formatBRL(member.pendingAmount)}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Expanded entries */}
                  {isExpanded && memberEntries.length > 0 && (
                    <div className="ml-7 border-l-2 border-border/40 pl-4 space-y-1 pb-2">
                      {memberEntries.map((entry) => (
                        <label
                          key={entry.id}
                          className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/20 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            {(entry.status === "pending" ||
                              entry.status === "approved") && (
                              <input
                                type="checkbox"
                                checked={selectedEntries.has(entry.id)}
                                onChange={() => toggleEntry(entry.id)}
                                className="size-4 rounded border-border accent-vox-primary"
                              />
                            )}
                            <div>
                              <p className="text-xs font-medium">
                                {entry.patientName ?? "Paciente"} —{" "}
                                {entry.procedureName}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {entry.appointmentDate
                                  ? new Date(
                                      entry.appointmentDate
                                    ).toLocaleDateString("pt-BR")
                                  : ""}
                                {entry.percentage != null &&
                                  ` | ${entry.percentage}%`}
                                {entry.fixedAmount != null &&
                                  ` | Fixo ${formatBRL(entry.fixedAmount)}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              className={`text-[10px] px-1.5 py-0 ${
                                statusColors[entry.status] ?? ""
                              }`}
                            >
                              {statusLabels[entry.status] ?? entry.status}
                            </Badge>
                            <span className="text-sm font-medium tabular-nums">
                              {formatBRL(entry.amount)}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Mark as Paid Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Marcar como Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Voce esta marcando {selectedEntries.size} comissao
              {selectedEntries.size > 1 ? "es" : ""} como paga
              {selectedEntries.size > 1 ? "s" : ""}.
            </p>
            <div className="space-y-2">
              <Label>Data do Pagamento</Label>
              <Input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayDialogOpen(false)}
              disabled={paying}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMarkPaid}
              disabled={paying}
              className="bg-vox-success text-white hover:bg-vox-success/90"
            >
              {paying ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Confirmar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
