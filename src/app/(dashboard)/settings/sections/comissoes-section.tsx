"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
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
  Plus,
  Loader2,
  Pencil,
  Trash2,
  DollarSign,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"
import {
  getCommissionRules,
  createCommissionRule,
  updateCommissionRule,
  deleteCommissionRule,
} from "@/server/actions/commission"
import { getTeamMembers } from "@/server/actions/team"
import { getWorkspace } from "@/server/actions/workspace"
import type { Procedure } from "@/types"

type Rule = Awaited<ReturnType<typeof getCommissionRules>>[number]

type Member = { id: string; name: string; role: string }

export function ComissoesSection() {
  const [loading, setLoading] = useState(true)
  const [rules, setRules] = useState<Rule[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({ open: false, title: "", description: "", onConfirm: () => {} })

  // Form state
  const [formMemberId, setFormMemberId] = useState<string>("all")
  const [formProcedure, setFormProcedure] = useState<string>("all")
  const [formType, setFormType] = useState<"percentage" | "fixed">("percentage")
  const [formPercentage, setFormPercentage] = useState("")
  const [formFixedAmount, setFormFixedAmount] = useState("")

  const loadData = useCallback(async () => {
    try {
      const [rulesData, teamData, wsData] = await Promise.all([
        getCommissionRules(),
        getTeamMembers(),
        getWorkspace(),
      ])
      setRules(rulesData)
      // Map team members from the response (using WorkspaceMember IDs)
      const memberList: Member[] = []
      if (teamData.members) {
        for (const m of teamData.members) {
          memberList.push({ id: m.id, name: m.name, role: m.role })
        }
      }
      // If owner is not in members list, they won't appear in commission rules
      // (owner needs a WorkspaceMember record to be assignable)
      setMembers(memberList)
      setProcedures(wsData.procedures ?? [])
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao carregar regras de comissao"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function openCreate() {
    setEditingRule(null)
    setFormMemberId("all")
    setFormProcedure("all")
    setFormType("percentage")
    setFormPercentage("")
    setFormFixedAmount("")
    setDialogOpen(true)
  }

  function openEdit(rule: Rule) {
    setEditingRule(rule)
    setFormMemberId(rule.memberId ?? "all")
    setFormProcedure(rule.procedureName ?? "all")
    setFormType(rule.type as "percentage" | "fixed")
    setFormPercentage(rule.percentage != null ? String(rule.percentage) : "")
    setFormFixedAmount(
      rule.fixedAmount != null ? String(rule.fixedAmount / 100) : ""
    )
    setDialogOpen(true)
  }

  async function handleSave() {
    setActionLoading("save")
    try {
      const data = {
        memberId: formMemberId === "all" ? null : formMemberId,
        procedureName: formProcedure === "all" ? null : formProcedure,
        type: formType as "percentage" | "fixed",
        percentage:
          formType === "percentage" ? parseFloat(formPercentage) : null,
        fixedAmount:
          formType === "fixed"
            ? Math.round(parseFloat(formFixedAmount) * 100)
            : null,
      }

      if (editingRule) {
        const result = await updateCommissionRule(editingRule.id, data)
        if ("error" in result) {
          toast.error(result.error)
          return
        }
        toast.success("Regra atualizada")
      } else {
        const result = await createCommissionRule(data)
        if ("error" in result) {
          toast.error(result.error)
          return
        }
        toast.success("Regra criada")
      }

      setDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id)
    try {
      const result = await deleteCommissionRule(id)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Regra excluida")
      await loadData()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setActionLoading(null)
    }
  }

  const formatBRL = (centavos: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(centavos / 100)

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-border/40 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Percent className="size-4 text-vox-primary" />
            Regras de Comissao
          </CardTitle>
          <Button
            size="sm"
            onClick={openCreate}
            className="bg-vox-primary text-white hover:bg-vox-primary/90"
          >
            <Plus className="size-4" />
            Nova Regra
          </Button>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/50 mb-3">
                <Percent className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Nenhuma regra de comissao configurada
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Crie regras para calcular automaticamente o repasse dos
                profissionais
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-8 items-center justify-center rounded-lg ${
                        rule.type === "percentage"
                          ? "bg-vox-primary/10"
                          : "bg-vox-success/10"
                      }`}
                    >
                      {rule.type === "percentage" ? (
                        <Percent className="size-3.5 text-vox-primary" />
                      ) : (
                        <DollarSign className="size-3.5 text-vox-success" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {rule.memberName ?? "Todos os profissionais"}
                        </span>
                        {!rule.memberId && !rule.procedureName && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Padrao
                          </Badge>
                        )}
                        {!rule.isActive && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Inativa
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {rule.procedureName ?? "Todos os procedimentos"}
                        {" — "}
                        {rule.type === "percentage"
                          ? `${rule.percentage}%`
                          : formatBRL(rule.fixedAmount ?? 0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => openEdit(rule)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      disabled={actionLoading === rule.id}
                      onClick={() =>
                        setConfirmDialog({
                          open: true,
                          title: "Excluir regra",
                          description:
                            "Tem certeza que deseja excluir esta regra de comissao? As comissoes ja calculadas nao serao afetadas.",
                          onConfirm: () => handleDelete(rule.id),
                        })
                      }
                    >
                      {actionLoading === rule.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Editar Regra" : "Nova Regra de Comissao"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Profissional</Label>
              <Select value={formMemberId} onValueChange={(v) => setFormMemberId(v ?? "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os profissionais</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Procedimento</Label>
              <Select value={formProcedure} onValueChange={(v) => setFormProcedure(v ?? "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os procedimentos</SelectItem>
                  {procedures.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="flex rounded-xl bg-muted/50 p-0.5">
                <button
                  onClick={() => setFormType("percentage")}
                  className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    formType === "percentage"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Percentual
                </button>
                <button
                  onClick={() => setFormType("fixed")}
                  className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    formType === "fixed"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Valor Fixo
                </button>
              </div>
            </div>

            {formType === "percentage" ? (
              <div className="space-y-2">
                <Label>Percentual (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={formPercentage}
                  onChange={(e) => setFormPercentage(e.target.value)}
                  placeholder="Ex: 50"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Valor Fixo (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formFixedAmount}
                  onChange={(e) => setFormFixedAmount(e.target.value)}
                  placeholder="Ex: 80.00"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={actionLoading === "save"}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={actionLoading === "save"}
              className="bg-vox-primary text-white hover:bg-vox-primary/90"
            >
              {actionLoading === "save" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando...
                </>
              ) : editingRule ? (
                "Salvar"
              ) : (
                "Criar Regra"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  )
}
