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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  FileText,
  Search,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  DollarSign,
  Package,
  Calendar,
  User,
} from "lucide-react"
import { getTissGuides, getTissGuide, updateTissGuideStatus, generateTissBatch, createTissGuide, searchAppointmentsForTiss } from "@/server/actions/tiss"
import { getOperadoras } from "@/server/actions/operadora"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"

const formatBRL = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const formatDateBR = (date: Date | string) =>
  new Date(date).toLocaleDateString("pt-BR")

type GuideItem = Awaited<ReturnType<typeof getTissGuides>>["guides"][number]
type OperadoraOption = { id: string; nome: string; registroAns: string }
type AppointmentResult = Awaited<ReturnType<typeof searchAppointmentsForTiss>>[number]

const statusBadge: Record<string, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "border-slate-300 bg-slate-50 text-slate-600" },
  submitted: { label: "Enviada", className: "border-blue-300 bg-blue-50 text-blue-700" },
  paid: { label: "Paga", className: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  denied: { label: "Glosada", className: "border-red-300 bg-red-50 text-red-700" },
  cancelled: { label: "Cancelada", className: "border-gray-300 bg-gray-50 text-gray-500" },
}

const typeLabel: Record<string, string> = {
  consulta: "Consulta",
  sp_sadt: "SP/SADT",
}

export function TissTab() {
  const [loading, setLoading] = useState(true)
  const [guides, setGuides] = useState<GuideItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [operadoraFilter, setOperadoraFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [operadoras, setOperadoras] = useState<OperadoraOption[]>([])

  // Action states
  const [actionId, setActionId] = useState<string | null>(null)
  const [xmlViewOpen, setXmlViewOpen] = useState(false)
  const [xmlContent, setXmlContent] = useState("")
  const [xmlGuideNumber, setXmlGuideNumber] = useState("")
  const [paidDialogOpen, setPaidDialogOpen] = useState(false)
  const [paidGuideId, setPaidGuideId] = useState<string | null>(null)
  const [paidAmount, setPaidAmount] = useState("")

  // Create guide dialog
  const [createOpen, setCreateOpen] = useState(false)

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [result, ops] = await Promise.all([
        getTissGuides({
          status: statusFilter !== "all" ? statusFilter : undefined,
          operadoraId: operadoraFilter !== "all" ? operadoraFilter : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page,
          pageSize: 20,
        }),
        getOperadoras(),
      ])
      setGuides(result.guides)
      setTotal(result.total)
      setTotalPages(result.totalPages)
      if (ops && !("error" in ops)) {
        setOperadoras(ops.map((o) => ({ id: o.id, nome: o.nome, registroAns: o.registroAns })))
      }
    } catch {
      toast.error("Erro ao carregar guias TISS")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, operadoraFilter, startDate, endDate, page])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter by patient name client-side
  const filteredGuides = debouncedSearch
    ? guides.filter((g) =>
        g.patient.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : guides

  const handleViewXml = async (guide: GuideItem) => {
    try {
      const detail = await getTissGuide(guide.id)
      if (!detail || !detail.xmlContent) {
        toast.error("XML nao disponivel para esta guia")
        return
      }
      setXmlContent(detail.xmlContent)
      setXmlGuideNumber(detail.numeroGuia)
      setXmlViewOpen(true)
    } catch {
      toast.error("Erro ao carregar XML")
    }
  }

  const handleDownloadXml = async (guide: GuideItem) => {
    try {
      const detail = await getTissGuide(guide.id)
      if (!detail || !detail.xmlContent) {
        toast.error("XML nao disponivel para esta guia")
        return
      }
      const blob = new Blob([detail.xmlContent], { type: "application/xml" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `guia-tiss-${detail.numeroGuia}.xml`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Erro ao baixar XML")
    }
  }

  const handleStatusChange = async (id: string, status: string, extra?: { paidAmount?: number }) => {
    setActionId(id)
    try {
      const result = await updateTissGuideStatus(id, status, extra)
      if (result && "error" in result) { toast.error(result.error); return }
      toast.success("Status atualizado")
      loadData()
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao atualizar status"))
    } finally {
      setActionId(null)
    }
  }

  const handleMarkPaid = () => {
    if (!paidGuideId) return
    const guide = guides.find((g) => g.id === paidGuideId)
    if (!guide) return
    const amount = paidAmount
      ? Math.round(parseFloat(paidAmount.replace(",", ".")) * 100)
      : guide.valorTotal
    handleStatusChange(paidGuideId, "paid", { paidAmount: amount })
    setPaidDialogOpen(false)
    setPaidGuideId(null)
    setPaidAmount("")
  }

  const handleBatchExport = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) {
      toast.error("Selecione ao menos uma guia")
      return
    }
    setBatchLoading(true)
    try {
      const result = await generateTissBatch(ids)
      if (result && "error" in result) { toast.error(result.error); return }
      // Download batch XML
      const blob = new Blob([result.xml], { type: "application/xml" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `lote-tiss-${result.numeroLote}.xml`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Lote gerado com ${result.guideCount} guia(s)`)
      setSelectedIds(new Set())
      loadData()
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao gerar lote"))
    } finally {
      setBatchLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const draftIds = filteredGuides.filter((g) => g.status === "draft").map((g) => g.id)
    if (draftIds.every((id) => selectedIds.has(id))) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(draftIds))
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-vox-primary" />
          <h3 className="text-base font-medium">Guias TISS</h3>
          {total > 0 && (
            <Badge variant="secondary" className="ml-1">
              {total}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchExport}
              disabled={batchLoading}
            >
              {batchLoading ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Package className="mr-1.5 size-3.5" />
              )}
              Exportar Lote ({selectedIds.size})
            </Button>
          )}
          <Button onClick={() => setCreateOpen(true)} className="bg-vox-primary hover:bg-vox-primary/90">
            <Plus className="mr-2 size-4" />
            Nova Guia TISS
          </Button>
        </div>
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
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="submitted">Enviada</SelectItem>
            <SelectItem value="paid">Paga</SelectItem>
            <SelectItem value="denied">Glosada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        {operadoras.length > 0 && (
          <Select value={operadoraFilter} onValueChange={(v) => { setOperadoraFilter(v ?? "all"); setPage(1) }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Operadora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Operadoras</SelectItem>
              {operadoras.map((op) => (
                <SelectItem key={op.id} value={op.id}>
                  {op.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
          className="w-36"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
          className="w-36"
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
      {!loading && filteredGuides.length === 0 && (
        <Card className="rounded-2xl border-border/40">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              Nenhuma guia TISS encontrada
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crie sua primeira guia TISS a partir de uma consulta realizada
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-2 size-4" />
              Nova Guia TISS
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!loading && filteredGuides.length > 0 && (
        <Card className="overflow-hidden rounded-2xl border-border/40">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={
                        filteredGuides.filter((g) => g.status === "draft").length > 0 &&
                        filteredGuides.filter((g) => g.status === "draft").every((g) => selectedIds.has(g.id))
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Guia</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Paciente</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Operadora</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Data</th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">Valor</th>
                  <th className="px-3 py-3 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuides.map((guide) => {
                  const badge = statusBadge[guide.status] ?? statusBadge.draft
                  return (
                    <tr key={guide.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-3">
                        {guide.status === "draft" && (
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedIds.has(guide.id)}
                            onChange={() => toggleSelect(guide.id)}
                          />
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">
                        {guide.numeroGuia}
                      </td>
                      <td className="px-3 py-3">{guide.patient.name}</td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {guide.operadora.nome}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="secondary" className="text-xs">
                          {typeLabel[guide.type] ?? guide.type}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {formatDateBR(guide.dataAtendimento)}
                      </td>
                      <td className="px-3 py-3 text-right font-medium">
                        {formatBRL(guide.valorTotal)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Badge variant="outline" className={badge.className}>
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* View XML */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => handleViewXml(guide)}
                            title="Ver XML"
                          >
                            <Eye className="size-3.5" />
                          </Button>

                          {/* Download XML */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => handleDownloadXml(guide)}
                            title="Download XML"
                          >
                            <Download className="size-3.5" />
                          </Button>

                          {/* Mark as Submitted */}
                          {guide.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => handleStatusChange(guide.id, "submitted")}
                              disabled={actionId === guide.id}
                              title="Marcar como Enviada"
                            >
                              {actionId === guide.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Send className="size-3.5 text-blue-600" />
                              )}
                            </Button>
                          )}

                          {/* Mark as Paid */}
                          {guide.status === "submitted" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => {
                                setPaidGuideId(guide.id)
                                setPaidAmount((guide.valorTotal / 100).toFixed(2).replace(".", ","))
                                setPaidDialogOpen(true)
                              }}
                              title="Marcar como Paga"
                            >
                              <DollarSign className="size-3.5 text-emerald-600" />
                            </Button>
                          )}

                          {/* Cancel */}
                          {(guide.status === "draft" || guide.status === "submitted") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => handleStatusChange(guide.id, "cancelled")}
                              disabled={actionId === guide.id}
                              title="Cancelar"
                            >
                              <XCircle className="size-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
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
            Mostrando {filteredGuides.length} de {total} guias
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

      {/* XML View Dialog */}
      <Dialog open={xmlViewOpen} onOpenChange={setXmlViewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5 text-vox-primary" />
              XML da Guia {xmlGuideNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh] rounded-xl border bg-muted/30 p-4">
            <pre className="text-xs font-mono whitespace-pre-wrap break-all">
              {xmlContent}
            </pre>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                const blob = new Blob([xmlContent], { type: "application/xml" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `guia-tiss-${xmlGuideNumber}.xml`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              }}
            >
              <Download className="mr-2 size-4" />
              Download
            </Button>
            <Button onClick={() => setXmlViewOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={paidDialogOpen} onOpenChange={setPaidDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Marcar como Paga</DialogTitle>
            <DialogDescription>
              Informe o valor recebido da operadora
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium">Valor Recebido (R$)</label>
              <Input
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0,00"
                className="text-right"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaidDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMarkPaid} className="bg-vox-success hover:bg-vox-success/90">
              <CheckCircle className="mr-2 size-4" />
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Guide Dialog */}
      <CreateTissGuideDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        operadoras={operadoras}
        onSuccess={loadData}
      />
    </div>
  )
}

// ─── Create TISS Guide Dialog ───

function CreateTissGuideDialog({
  open,
  onOpenChange,
  operadoras,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  operadoras: OperadoraOption[]
  onSuccess: () => void
}) {
  const [step, setStep] = useState<"type" | "search" | "details" | "success">("type")
  const [guideType, setGuideType] = useState<"consulta" | "sp_sadt">("consulta")
  const [searchQuery, setSearchQuery] = useState("")
  const [appointments, setAppointments] = useState<AppointmentResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<AppointmentResult | null>(null)
  const [creating, setCreating] = useState(false)

  // Guide details
  const [operadoraId, setOperadoraId] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [valorStr, setValorStr] = useState("")
  const [observacao, setObservacao] = useState("")
  const [result, setResult] = useState<{ numeroGuia: string } | null>(null)

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep("type")
      setGuideType("consulta")
      setSearchQuery("")
      setAppointments([])
      setSelected(null)
      setCreating(false)
      setOperadoraId("")
      setCardNumber("")
      setValorStr("")
      setObservacao("")
      setResult(null)
    }
  }, [open])

  // Auto-search with debounce
  useEffect(() => {
    const query = searchQuery.trim()
    if (query.length < 2) { setAppointments([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchAppointmentsForTiss(query)
        if (results && !("error" in results)) {
          setAppointments(results as AppointmentResult[])
        }
      } catch {
        toast.error("Erro ao buscar consultas")
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSelectAppointment = (appt: AppointmentResult) => {
    setSelected(appt)
    // Pre-fill from patient insurance data
    const insData = appt.patient.insuranceData as { cardNumber?: string; operadoraId?: string } | null
    if (insData?.cardNumber) setCardNumber(insData.cardNumber)
    if (insData?.operadoraId) setOperadoraId(insData.operadoraId)
    if (appt.price) setValorStr((appt.price / 100).toFixed(2).replace(".", ","))
    setStep("details")
  }

  const handleCreate = async () => {
    if (!selected || !operadoraId || !cardNumber.trim()) {
      toast.error("Preencha todos os campos obrigatorios")
      return
    }
    const valor = Math.round(parseFloat(valorStr.replace(",", ".")) * 100)
    if (isNaN(valor) || valor <= 0) {
      toast.error("Informe um valor valido")
      return
    }

    setCreating(true)
    try {
      const res = await createTissGuide({
        type: guideType,
        operadoraId,
        patientId: selected.patient.id,
        appointmentId: selected.id,
        numeroCarteira: cardNumber,
        dataAtendimento: selected.date,
        valorTotal: valor,
        observacao: observacao || undefined,
      })
      if (res && "error" in res) { toast.error(res.error); return }
      setResult({ numeroGuia: res.numeroGuia })
      setStep("success")
      onSuccess()
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao criar guia"))
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5 text-vox-primary" />
            Nova Guia TISS
          </DialogTitle>
          <DialogDescription>
            {step === "type" && "Selecione o tipo de guia"}
            {step === "search" && "Busque a consulta do paciente"}
            {step === "details" && "Preencha os dados da guia"}
            {step === "success" && "Guia criada com sucesso"}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Type */}
        {step === "type" && (
          <div className="space-y-3">
            <button
              className={`w-full rounded-xl border p-4 text-left transition-colors hover:bg-muted/30 ${
                guideType === "consulta" ? "border-vox-primary bg-vox-primary/5" : ""
              }`}
              onClick={() => setGuideType("consulta")}
            >
              <p className="text-sm font-medium">Guia de Consulta</p>
              <p className="text-xs text-muted-foreground">Consultas medicas, psicologicas, nutricionais</p>
            </button>
            <button
              className={`w-full rounded-xl border p-4 text-left transition-colors hover:bg-muted/30 ${
                guideType === "sp_sadt" ? "border-vox-primary bg-vox-primary/5" : ""
              }`}
              onClick={() => setGuideType("sp_sadt")}
            >
              <p className="text-sm font-medium">Guia SP/SADT</p>
              <p className="text-xs text-muted-foreground">Procedimentos, exames, terapias</p>
            </button>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setStep("search")} className="bg-vox-primary hover:bg-vox-primary/90">
                Proximo
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Search appointment */}
        {step === "search" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nome do paciente..."
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {searching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!searching && appointments.length === 0 && searchQuery.length >= 2 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma consulta encontrada
                </p>
              )}
              {appointments.map((appt) => (
                <button
                  key={appt.id}
                  className={`w-full rounded-xl border p-3 text-left transition-colors hover:bg-muted/30 ${
                    appt.hasTissGuide ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  }`}
                  disabled={appt.hasTissGuide}
                  onClick={() => handleSelectAppointment(appt)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{appt.patient.name}</span>
                    </div>
                    {appt.hasTissGuide && (
                      <Badge variant="outline" className="text-xs border-emerald-300 bg-emerald-50 text-emerald-700">
                        Guia existente
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDateBR(appt.date)}
                    </span>
                    {appt.patient.insurance && (
                      <span>{appt.patient.insurance}</span>
                    )}
                    {appt.price != null && (
                      <span className="font-medium text-foreground">{formatBRL(appt.price)}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("type")}>
                Voltar
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && selected && (
          <div className="space-y-4">
            {/* Selected appointment summary */}
            <div className="rounded-xl border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="size-4 text-muted-foreground" />
                <span className="font-medium">{selected.patient.name}</span>
                <span className="text-muted-foreground">-</span>
                <span className="text-muted-foreground">{formatDateBR(selected.date)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium">Operadora</label>
                <Select value={operadoraId || undefined} onValueChange={(v) => setOperadoraId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a operadora" />
                  </SelectTrigger>
                  <SelectContent>
                    {operadoras.map((op) => (
                      <SelectItem key={op.id} value={op.id}>
                        {op.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Numero da Carteira</label>
                <Input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="Numero da carteirinha do convenio"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Valor (R$)</label>
                <Input
                  value={valorStr}
                  onChange={(e) => setValorStr(e.target.value)}
                  placeholder="150,00"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Observacao (opcional)</label>
                <Input
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Observacoes adicionais..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("search")}>
                Voltar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !operadoraId || !cardNumber.trim()}
                className="bg-vox-primary hover:bg-vox-primary/90"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 size-4" />
                    Criar Guia
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && result && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="size-6 text-emerald-600" />
              </div>
              <p className="text-center text-sm font-medium">
                Guia TISS criada com sucesso!
              </p>
              <p className="text-sm text-muted-foreground">
                Numero: <span className="font-mono font-medium text-foreground">{result.numeroGuia}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Status: Rascunho - Envie para a operadora quando estiver pronto
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Fechar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
