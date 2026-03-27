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
  FileText,
  Search,
  RefreshCw,
  XCircle,
  Download,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import { getNfseList, cancelNfse, refreshNfseStatus } from "@/server/actions/nfse"
import { toast } from "sonner"
import { EmitNfseDialog } from "./emit-nfse-dialog"

const formatBRL = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const formatDateBR = (date: Date | string) =>
  new Date(date).toLocaleDateString("pt-BR")

const statusBadge: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "border-amber-300 bg-amber-50 text-amber-700" },
  processing: { label: "Processando", className: "border-blue-300 bg-blue-50 text-blue-700" },
  authorized: { label: "Autorizada", className: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  error: { label: "Erro", className: "border-red-300 bg-red-50 text-red-700" },
  cancelled: { label: "Cancelada", className: "border-gray-300 bg-gray-50 text-gray-500" },
}

type NfseItem = NonNullable<Awaited<ReturnType<typeof getNfseList>>>["nfses"][number]

export function NfseTab() {
  const [loading, setLoading] = useState(true)
  const [nfses, setNfses] = useState<NfseItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [emitOpen, setEmitOpen] = useState(false)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelMotivo, setCancelMotivo] = useState("")
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getNfseList({
        status: statusFilter !== "all" ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        pageSize: 20,
      })
      setNfses(result.nfses)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch {
      toast.error("Erro ao carregar notas fiscais")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, startDate, endDate, page])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter by patient name client-side (since we already have the data)
  const filteredNfses = debouncedSearch
    ? nfses.filter((n) =>
        n.patient.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : nfses

  const handleRefresh = async (nfseId: string) => {
    setRefreshingId(nfseId)
    try {
      await refreshNfseStatus(nfseId)
      toast.success("Status atualizado")
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar status")
    } finally {
      setRefreshingId(null)
    }
  }

  const handleCancel = async (nfseId: string) => {
    if (!cancelMotivo.trim()) {
      toast.error("Informe o motivo do cancelamento")
      return
    }
    setCancellingId(nfseId)
    try {
      await cancelNfse(nfseId, cancelMotivo)
      toast.success("NFS-e cancelada com sucesso")
      setShowCancelConfirm(null)
      setCancelMotivo("")
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cancelar NFS-e")
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-vox-primary" />
          <h3 className="text-base font-medium">Notas Fiscais (NFS-e)</h3>
          {total > 0 && (
            <Badge variant="secondary" className="ml-1">
              {total}
            </Badge>
          )}
        </div>
        <Button onClick={() => setEmitOpen(true)} className="bg-vox-primary hover:bg-vox-primary/90">
          <Plus className="mr-2 size-4" />
          Emitir NFS-e
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="processing">Processando</SelectItem>
            <SelectItem value="authorized">Autorizada</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
          className="w-36"
          placeholder="Data inicio"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
          className="w-36"
          placeholder="Data fim"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredNfses.length === 0 && (
        <Card className="rounded-2xl border-border/40">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              Nenhuma nota fiscal encontrada
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Emita sua primeira NFS-e a partir de uma consulta realizada
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setEmitOpen(true)}
            >
              <Plus className="mr-2 size-4" />
              Emitir NFS-e
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!loading && filteredNfses.length > 0 && (
        <Card className="overflow-hidden rounded-2xl border-border/40">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Numero</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Paciente</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredNfses.map((nfse) => {
                  const badge = statusBadge[nfse.status] ?? statusBadge.pending
                  return (
                    <tr key={nfse.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs">
                        {nfse.numero || "-"}
                      </td>
                      <td className="px-4 py-3">{nfse.patient.name}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatBRL(nfse.valor)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={badge.className}>
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateBR(nfse.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* PDF download */}
                          {nfse.pdfUrl && (
                            <a
                              href={nfse.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Download PDF"
                              className="inline-flex size-7 items-center justify-center rounded-lg hover:bg-muted"
                            >
                              <Download className="size-4" />
                            </a>
                          )}

                          {/* Refresh status */}
                          {nfse.status !== "cancelled" && nfse.status !== "authorized" && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleRefresh(nfse.id)}
                              disabled={refreshingId === nfse.id}
                              title="Atualizar status"
                            >
                              {refreshingId === nfse.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <RefreshCw className="size-4" />
                              )}
                            </Button>
                          )}

                          {/* Cancel */}
                          {nfse.status !== "cancelled" && (
                            <>
                              {showCancelConfirm === nfse.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={cancelMotivo}
                                    onChange={(e) => setCancelMotivo(e.target.value)}
                                    placeholder="Motivo..."
                                    className="h-7 w-32 text-xs"
                                  />
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleCancel(nfse.id)}
                                    disabled={cancellingId === nfse.id}
                                  >
                                    {cancellingId === nfse.id ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      "Cancelar"
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      setShowCancelConfirm(null)
                                      setCancelMotivo("")
                                    }}
                                  >
                                    Nao
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => setShowCancelConfirm(nfse.id)}
                                  title="Cancelar NFS-e"
                                >
                                  <XCircle className="size-4 text-destructive" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>

                        {/* Error message */}
                        {nfse.status === "error" && nfse.errorMessage && (
                          <div className="mt-1 flex items-start gap-1 text-xs text-red-600">
                            <AlertCircle className="mt-0.5 size-3 shrink-0" />
                            <span>{nfse.errorMessage}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Mostrando {filteredNfses.length} de {total} notas
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Emit dialog */}
      <EmitNfseDialog
        open={emitOpen}
        onOpenChange={setEmitOpen}
        onSuccess={loadData}
      />
    </div>
  )
}
