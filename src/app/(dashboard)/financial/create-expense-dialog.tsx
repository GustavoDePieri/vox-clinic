"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { createExpense } from "@/server/actions/expense"

const PAYMENT_METHODS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "credito", label: "Credito" },
  { value: "debito", label: "Debito" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferencia" },
  { value: "outro", label: "Outro" },
]

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Nenhuma" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
]

interface CreateExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Array<{
    id: string
    name: string
    icon: string | null
    color: string | null
  }>
  onCreated: () => void
}

export default function CreateExpenseDialog({
  open,
  onOpenChange,
  categories,
  onCreated,
}: CreateExpenseDialogProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    description: "",
    amount: "",
    categoryId: "",
    dueDate: new Date().toISOString().split("T")[0],
    recurrence: "none",
    recurrenceEnd: "",
    paymentMethod: "",
    notes: "",
  })

  const resetForm = () => {
    setForm({
      description: "",
      amount: "",
      categoryId: "",
      dueDate: new Date().toISOString().split("T")[0],
      recurrence: "none",
      recurrenceEnd: "",
      paymentMethod: "",
      notes: "",
    })
  }

  const handleSubmit = async () => {
    if (!form.description.trim()) {
      toast.error("Informe a descricao")
      return
    }

    const amountReais = parseFloat(form.amount.replace(",", "."))
    if (isNaN(amountReais) || amountReais <= 0) {
      toast.error("Informe um valor valido")
      return
    }

    if (!form.dueDate) {
      toast.error("Informe a data de vencimento")
      return
    }

    const amountCentavos = Math.round(amountReais * 100)

    setSaving(true)
    try {
      const result = await createExpense({
        description: form.description.trim(),
        amount: amountCentavos,
        categoryId: form.categoryId || undefined,
        dueDate: form.dueDate,
        recurrence:
          form.recurrence !== "none"
            ? (form.recurrence as "monthly" | "weekly" | "yearly")
            : undefined,
        recurrenceEnd: form.recurrenceEnd || undefined,
        paymentMethod: form.paymentMethod || undefined,
        notes: form.notes.trim() || undefined,
      })
      if ('error' in result) { toast.error(result.error); return }

      toast.success("Despesa criada com sucesso")
      resetForm()
      onOpenChange(false)
      onCreated()
    } catch {
      toast.error("Erro ao criar despesa")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-desc" className="text-sm">
              Descricao *
            </Label>
            <Input
              id="exp-desc"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Ex: Aluguel do consultorio"
              className="rounded-xl"
            />
          </div>

          {/* Amount + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount" className="text-sm">
                Valor (R$) *
              </Label>
              <Input
                id="exp-amount"
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="0,00"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Categoria</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, categoryId: v ?? "" }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        {cat.color && (
                          <span
                            className="inline-block size-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                        )}
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-due" className="text-sm">
              Data de Vencimento *
            </Label>
            <Input
              id="exp-due"
              type="date"
              value={form.dueDate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, dueDate: e.target.value }))
              }
              className="rounded-xl"
            />
          </div>

          {/* Recurrence */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Recorrencia</Label>
              <Select
                value={form.recurrence}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, recurrence: v ?? "none" }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.recurrence !== "none" && (
              <div className="space-y-1.5">
                <Label htmlFor="exp-rec-end" className="text-sm">
                  Fim da Recorrencia
                </Label>
                <Input
                  id="exp-rec-end"
                  type="date"
                  value={form.recurrenceEnd}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, recurrenceEnd: e.target.value }))
                  }
                  className="rounded-xl"
                />
              </div>
            )}
          </div>

          {/* Payment Method (mark as paid immediately) */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Metodo de Pagamento
              <span className="text-muted-foreground ml-1 font-normal">
                (preencher = marcar como pago)
              </span>
            </Label>
            <Select
              value={form.paymentMethod}
              onValueChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  paymentMethod: !v || v === "none" ? "" : v,
                }))
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Deixe vazio para pendente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum (pendente)</SelectItem>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-notes" className="text-sm">
              Observacoes
            </Label>
            <Textarea
              id="exp-notes"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Observacoes opcionais..."
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-xl bg-vox-primary hover:bg-vox-primary/90"
          >
            {saving ? "Salvando..." : "Criar Despesa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
