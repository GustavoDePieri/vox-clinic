"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { recordPayment } from "@/server/actions/receivable"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"

const formatBRL = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

function parseBRL(value: string): number {
  // If has comma, treat as Brazilian format: "1.234,56" → 1234.56
  if (value.includes(',')) {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
  }
  // Otherwise standard format: "300.00" → 300.00
  return parseFloat(value) || 0
}

const formatDateBR = (date: Date | string) =>
  new Date(date).toLocaleDateString("pt-BR")

const paymentMethods = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "credito", label: "Cartao Credito" },
  { value: "debito", label: "Cartao Debito" },
  { value: "boleto", label: "Boleto" },
  { value: "convenio", label: "Convenio" },
  { value: "transferencia", label: "Transferencia" },
  { value: "outro", label: "Outro" },
]

interface PaymentData {
  id: string
  installmentNumber: number
  totalInstallments: number
  amount: number
  dueDate: Date | string
  status: string
}

interface Props {
  payment: PaymentData
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function RegisterPaymentDialog({ payment, open, onOpenChange, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [paidAmountStr, setPaidAmountStr] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")

  // Pre-fill amount when payment changes
  useEffect(() => {
    if (payment) {
      setPaidAmountStr((payment.amount / 100).toFixed(2))
      setPaymentMethod("")
      setPaidAt(new Date().toISOString().split("T")[0])
      setNotes("")
    }
  }, [payment])

  const paidCentavos = Math.round(parseBRL(paidAmountStr || "0") * 100)
  const canSubmit = paidCentavos > 0 && paymentMethod

  function handleSubmit() {
    if (!canSubmit) return

    startTransition(async () => {
      try {
        const result = await recordPayment(payment.id, {
          paidAmount: paidCentavos,
          paymentMethod,
          paidAt,
          notes: notes.trim() || undefined,
        })
        if ('error' in result) { toast.error(result.error); return }
        toast.success("Pagamento registrado")
        onOpenChange(false)
        onSuccess()
      } catch (err) {
        toast.error(friendlyError(err, "Erro ao registrar pagamento"))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Payment info */}
          <div className="rounded-xl bg-muted/40 px-3 py-2.5 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parcela</span>
              <span className="font-medium">{payment.installmentNumber}/{payment.totalInstallments}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor esperado</span>
              <span className="font-medium tabular-nums">{formatBRL(payment.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vencimento</span>
              <span className="tabular-nums">{formatDateBR(payment.dueDate)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label>Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={(v) => v && setPaymentMethod(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label>Valor Pago (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={paidAmountStr}
              onChange={(e) => setPaidAmountStr(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Data do Pagamento</Label>
            <Input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Observacoes (opcional)</Label>
            <Textarea
              placeholder="Anotacoes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isPending}
              className="bg-vox-primary hover:bg-vox-primary/90 gap-1.5"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Confirmar Pagamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
