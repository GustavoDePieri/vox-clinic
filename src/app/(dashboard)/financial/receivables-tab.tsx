"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  CreditCard,
  XCircle,
} from "lucide-react"
import { getCharges, getReceivablesSummary, cancelCharge } from "@/server/actions/receivable"
import { toast } from "sonner"
import { CreateChargeDialog } from "./create-charge-dialog"
import { RegisterPaymentDialog } from "./register-payment-dialog"

const formatBRL = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const formatDateBR = (date: Date | string) =>
  new Date(date).toLocaleDateString("pt-BR")

const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  pending: { label: "Pendente", variant: "outline", className: "border-amber-300 bg-amber-50 text-amber-700" },
  paid: { label: "Pago", variant: "outline", className: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  overdue: { label: "Vencido", variant: "outline", className: "border-red-300 bg-red-50 text-red-700" },
  partial: { label: "Parcial", variant: "outline", className: "border-blue-300 bg-blue-50 text-blue-700" },
  cancelled: { label: "Cancelado", variant: "outline", className: "border-gray-300 bg-gray-50 text-gray-500" },
}

type ChargeWithPayments = NonNullable<Awaited<ReturnType<typeof getCharges>>>["charges"][number]
type PaymentItem = ChargeWithPayments["payments"][number]

export function ReceivablesTab() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getReceivablesSummary>> | null>(null)
  const [chargesData, setChargesData] = useState<Awaited<ReturnType<typeof getCharges>> | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [expandedCharge, setExpandedCharge] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [paymentDialogPayment, setPaymentDialogPayment] = useState<PaymentItem | null>(null)
  const [page, setPage] = useState(1)
  const [cancelling, setCancelling] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [summaryData, charges] = await Promise.all([
        getReceivablesSummary(),
        getCharges({
          status: statusFilter !== "all" ? statusFilter : undefined,
          page,
          pageSize: 20,
        }),
      ])
      setSummary(summaryData)
      setChargesData(charges)
    } catch {
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Reset page when filter changes
  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  const handleCancelCharge = async (chargeId: string) => {
    setCancelling(chargeId)
    try {
      await cancelCharge(chargeId)
      toast.success("Cobranca cancelada")
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cancelar")
    } finally {
      setCancelling(null)
    }
  }

  const filteredCharges = chargesData?.charges.filter((c) => {
    if (!debouncedSearch) return true
    const q = debouncedSearch.toLowerCase()
    return (
      c.patient.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    )
  }) ?? []

  if (loading && !chargesData) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Card className="group relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Pendente
                </p>
                <p className="text-xl font-bold mt-0.5 text-amber-600 tabular-nums">
                  {formatBRL(summary?.totalPending ?? 0)}
                </p>
              </div>
              <div className="flex size-8 items-center justify-center rounded-xl bg-amber-100">
                <Clock className="size-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-500/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Vencido
                </p>
                <p className="text-xl font-bold mt-0.5 text-red-600 tabular-nums">
                  {formatBRL(summary?.totalOverdue ?? 0)}
                </p>
              </div>
              <div className="flex size-8 items-center justify-center rounded-xl bg-red-100">
                <AlertTriangle className="size-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Recebido este mes
                </p>
                <p className="text-xl font-bold mt-0.5 text-emerald-600 tabular-nums">
                  {formatBRL(summary?.receivedThisMonth ?? 0)}
                </p>
              </div>
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100">
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + New button */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente ou descricao..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="overdue">Vencido</SelectItem>
              <SelectItem value="partial">Parcial</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5 bg-vox-primary hover:bg-vox-primary/90">
          <Plus className="size-4" />
          Nova Cobranca
        </Button>
      </div>

      {/* Charges List */}
      {filteredCharges.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma cobranca encontrada.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredCharges.map((charge) => {
            const paidCount = charge.payments.filter((p) => p.status === "paid").length
            const totalPayments = charge.payments.length
            const isExpanded = expandedCharge === charge.id
            const badge = statusBadge[charge.status] ?? statusBadge.pending

            return (
              <Card key={charge.id} className="rounded-2xl overflow-hidden">
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedCharge(isExpanded ? null : charge.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{charge.patient.name}</p>
                      <Badge variant={badge.variant} className={`text-[10px] px-1.5 py-0 ${badge.className}`}>
                        {badge.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {charge.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums">{formatBRL(charge.netAmount)}</p>
                    {totalPayments > 1 && (
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {paidCount}/{totalPayments} pagas
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums w-16 text-right">
                    {formatDateBR(charge.createdAt)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="size-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t px-4 py-3 space-y-2 bg-muted/10">
                    {charge.notes && (
                      <p className="text-xs text-muted-foreground italic mb-2">{charge.notes}</p>
                    )}

                    {/* Payments table */}
                    <div className="space-y-1">
                      {charge.payments.map((payment) => {
                        const pBadge = statusBadge[payment.status] ?? statusBadge.pending
                        return (
                          <div
                            key={payment.id}
                            className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted/40 transition-colors text-sm"
                          >
                            <span className="text-xs text-muted-foreground w-16 shrink-0 tabular-nums">
                              Parcela {payment.installmentNumber}/{payment.totalInstallments}
                            </span>
                            <span className="text-xs text-muted-foreground w-20 shrink-0 tabular-nums">
                              Venc: {formatDateBR(payment.dueDate)}
                            </span>
                            <span className="font-medium tabular-nums shrink-0 w-24 text-right">
                              {formatBRL(payment.amount)}
                            </span>
                            <Badge variant={pBadge.variant} className={`text-[10px] px-1.5 py-0 ${pBadge.className}`}>
                              {pBadge.label}
                            </Badge>
                            {payment.paymentMethod && (
                              <span className="text-[10px] text-muted-foreground">{payment.paymentMethod}</span>
                            )}
                            <div className="flex-1" />
                            {(payment.status === "pending" || payment.status === "overdue") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setPaymentDialogPayment(payment)
                                }}
                              >
                                <CreditCard className="size-3" />
                                Registrar
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Cancel button */}
                    {charge.status !== "cancelled" && charge.status !== "paid" && (
                      <div className="flex justify-end pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                          disabled={cancelling === charge.id}
                          onClick={() => handleCancelCharge(charge.id)}
                        >
                          <XCircle className="size-3" />
                          {cancelling === charge.id ? "Cancelando..." : "Cancelar Cobranca"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {chargesData && chargesData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {page} / {chargesData.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= chargesData.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Proximo
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <CreateChargeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={loadData}
      />

      {paymentDialogPayment && (
        <RegisterPaymentDialog
          payment={paymentDialogPayment}
          open={!!paymentDialogPayment}
          onOpenChange={(open) => { if (!open) setPaymentDialogPayment(null) }}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}
