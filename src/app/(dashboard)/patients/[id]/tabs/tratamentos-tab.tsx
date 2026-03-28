"use client"

import React, { useState } from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Loader2,
  CheckCircle,
  ClipboardList,
  PauseCircle,
  Trash2,
  RotateCcw,
} from "lucide-react"
import {
  getTreatmentPlans,
  createTreatmentPlan,
  addSessionToTreatment,
  updateTreatmentPlanStatus,
  deleteTreatmentPlan,
} from "@/server/actions/treatment"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"
import type { TreatmentPlanItem } from "./types"

const TREATMENT_STATUS: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-vox-primary/10 text-vox-primary" },
  completed: { label: "Concluido", className: "bg-vox-success/10 text-vox-success" },
  cancelled: { label: "Cancelado", className: "bg-vox-error/10 text-vox-error" },
  paused: { label: "Pausado", className: "bg-vox-warning/10 text-vox-warning" },
}

export default function TratamentosTab({ patientId }: { patientId: string }) {
  const [plans, setPlans] = useState<TreatmentPlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formSessions, setFormSessions] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formSaving, setFormSaving] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({ open: false, title: "", description: "", onConfirm: () => {} })
  const showConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, description, onConfirm })
  }

  const loadPlans = React.useCallback(async () => {
    try {
      const data = await getTreatmentPlans(patientId)
      setPlans(data)
    } catch {
      setPlans([])
    } finally {
      setLoading(false)
    }
  }, [patientId])

  React.useEffect(() => {
    loadPlans()
  }, [loadPlans])

  async function handleCreate() {
    if (!formName.trim() || !formSessions) return
    setFormSaving(true)
    try {
      const result = await createTreatmentPlan({
        patientId,
        name: formName.trim(),
        procedures: [],
        totalSessions: parseInt(formSessions),
        notes: formNotes.trim() || undefined,
      })
      if ('error' in result) { toast.error(result.error); return }
      setFormName(""); setFormSessions(""); setFormNotes("")
      setShowForm(false)
      loadPlans()
      toast.success("Plano de tratamento criado")
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao criar plano"))
    } finally {
      setFormSaving(false)
    }
  }

  async function handleAddSession(planId: string) {
    setActionLoading(planId)
    try {
      const result = await addSessionToTreatment(planId)
      if ('error' in result) { toast.error(result.error); return }
      loadPlans()
      toast.success("Sessao registrada")
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao registrar sessao"))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleStatusChange(planId: string, status: string) {
    setActionLoading(planId)
    try {
      const result = await updateTreatmentPlanStatus(planId, status)
      if ('error' in result) { toast.error(result.error); return }
      loadPlans()
      toast.success("Status do plano atualizado")
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao atualizar status"))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(planId: string) {
    showConfirm("Excluir plano de tratamento", "Tem certeza que deseja excluir este plano? Esta acao nao pode ser desfeita.", async () => {
      setActionLoading(planId)
      try {
        const result = await deleteTreatmentPlan(planId)
        if ('error' in result) { toast.error(result.error); return }
        loadPlans()
        toast.success("Plano de tratamento excluido")
      } catch (err) {
        toast.error(friendlyError(err, "Erro ao excluir plano"))
      } finally {
        setActionLoading(null)
      }
    })
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR")

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    )
  }

  const activePlans = plans.filter((p) => p.status === "active")
  const otherPlans = plans.filter((p) => p.status !== "active")

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="tabular-nums text-[10px]">{plans.length} planos</Badge>
          {activePlans.length > 0 && (
            <Badge className="bg-vox-primary/10 text-vox-primary border-vox-primary/20 text-[10px]">
              {activePlans.length} ativos
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-vox-primary text-white hover:bg-vox-primary/90 gap-1.5"
        >
          <Plus className="size-3.5" />
          Novo Plano
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Nome do Tratamento</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Clareamento dental, Fisioterapia lombar..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Total de Sessoes</Label>
                <Input
                  type="number"
                  min="1"
                  value={formSessions}
                  onChange={(e) => setFormSessions(e.target.value)}
                  placeholder="Ex: 6"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Observacoes (opcional)</Label>
                <Input
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Notas sobre o plano..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!formName.trim() || !formSessions || formSaving}
                className="bg-vox-primary text-white hover:bg-vox-primary/90"
              >
                {formSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                Criar Plano
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {plans.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted/60">
            <ClipboardList className="size-6 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-sm font-medium">Nenhum plano de tratamento</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Crie um plano para acompanhar o progresso do paciente
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="bg-vox-primary text-white hover:bg-vox-primary/90 gap-1.5 mt-1"
          >
            <Plus className="size-3.5" />
            Criar plano de tratamento
          </Button>
        </div>
      )}

      {/* Active plans */}
      {activePlans.map((plan) => {
        const progress = plan.totalSessions > 0 ? Math.round((plan.completedSessions / plan.totalSessions) * 100) : 0
        const isActionLoading = actionLoading === plan.id
        return (
          <Card key={plan.id} className="overflow-hidden">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold truncate">{plan.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${TREATMENT_STATUS[plan.status]?.className ?? ""}`}>
                      {TREATMENT_STATUS[plan.status]?.label ?? plan.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Inicio: {formatDate(plan.startDate)}
                    {plan.notes && <> — {plan.notes}</>}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(plan.id, "paused")}
                    disabled={isActionLoading}
                    className="h-7 w-7 p-0"
                    title="Pausar"
                  >
                    <PauseCircle className="size-3.5 text-vox-warning" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(plan.id)}
                    disabled={isActionLoading}
                    className="h-7 w-7 p-0"
                    title="Excluir"
                  >
                    <Trash2 className="size-3.5 text-vox-error" />
                  </Button>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">
                    {plan.completedSessions} de {plan.totalSessions} sessoes
                  </span>
                  <span className="font-semibold tabular-nums text-vox-primary">{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-vox-primary to-vox-primary/70 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Add session button */}
              <Button
                size="sm"
                onClick={() => handleAddSession(plan.id)}
                disabled={isActionLoading}
                className="w-full bg-vox-primary/10 text-vox-primary hover:bg-vox-primary/20 gap-1.5"
              >
                {isActionLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="size-3.5" />
                )}
                Registrar Sessao ({plan.completedSessions + 1}/{plan.totalSessions})
              </Button>
            </CardContent>
          </Card>
        )
      })}

      {/* Completed / Paused / Cancelled plans */}
      {otherPlans.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-1">
            Encerrados / Pausados
          </p>
          {otherPlans.map((plan) => {
            const progress = plan.totalSessions > 0 ? Math.round((plan.completedSessions / plan.totalSessions) * 100) : 0
            const isActionLoading = actionLoading === plan.id
            return (
              <Card key={plan.id} className="border-border/30 opacity-80">
                <CardContent className="pt-3 pb-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-sm font-medium truncate">{plan.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${TREATMENT_STATUS[plan.status]?.className ?? ""}`}>
                        {TREATMENT_STATUS[plan.status]?.label ?? plan.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {plan.status === "paused" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(plan.id, "active")}
                          disabled={isActionLoading}
                          className="h-7 text-[10px] gap-1 px-2"
                        >
                          <RotateCcw className="size-3" />
                          Retomar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(plan.id)}
                        disabled={isActionLoading}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="size-3.5 text-vox-error" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{plan.completedSessions}/{plan.totalSessions} sessoes ({progress}%)</span>
                    {plan.completedAt && <span>Concluido: {formatDate(plan.completedAt)}</span>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(prev => ({ ...prev, open: false })) }}
      />
    </div>
  )
}
