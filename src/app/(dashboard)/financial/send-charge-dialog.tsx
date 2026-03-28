"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  QrCode,
  FileText,
  CreditCard,
  Link2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
} from "lucide-react"
import {
  createGatewayCharge,
  checkGatewayStatus,
  cancelGatewayCharge,
} from "@/server/actions/gateway"
import type { GatewayPaymentMethod } from "@/lib/gateway"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"

const formatBRL = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

interface PaymentInfo {
  id: string
  amount: number
  dueDate: Date | string
  installmentNumber: number
  totalInstallments: number
  status: string
  gatewayChargeId?: string | null
  paymentLink?: string | null
  pixQrCode?: string | null
  pixCopiaECola?: string | null
  boletoUrl?: string | null
  boletoBarcode?: string | null
  gatewayStatus?: string | null
}

interface Props {
  payment: PaymentInfo
  patientName: string
  description: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const METHODS: {
  value: GatewayPaymentMethod
  label: string
  icon: typeof QrCode
  description: string
}[] = [
  {
    value: "pix",
    label: "PIX",
    icon: QrCode,
    description: "Pagamento instantaneo via QR code",
  },
  {
    value: "boleto",
    label: "Boleto",
    icon: FileText,
    description: "Boleto bancario com vencimento",
  },
  {
    value: "credit_card",
    label: "Cartao",
    icon: CreditCard,
    description: "Cartao de credito online",
  },
  {
    value: "undefined",
    label: "Link Completo",
    icon: Link2,
    description: "Paciente escolhe a forma de pagamento",
  },
]

export function SendChargeDialog({
  payment,
  patientName,
  description,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<"method" | "result">(
    payment.gatewayChargeId ? "result" : "method"
  )
  const [selectedMethod, setSelectedMethod] =
    useState<GatewayPaymentMethod>("pix")
  const [installments, setInstallments] = useState(1)
  const [creating, setCreating] = useState(false)
  const [checking, setChecking] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // Result state
  const [chargeResult, setChargeResult] = useState<{
    chargeId?: string
    paymentLink?: string | null
    pixQrCode?: string | null
    pixCopiaECola?: string | null
    boletoUrl?: string | null
    boletoBarcode?: string | null
    status?: string | null
  } | null>(
    payment.gatewayChargeId
      ? {
          chargeId: payment.gatewayChargeId,
          paymentLink: payment.paymentLink,
          pixQrCode: payment.pixQrCode,
          pixCopiaECola: payment.pixCopiaECola,
          boletoUrl: payment.boletoUrl,
          boletoBarcode: payment.boletoBarcode,
          status: payment.gatewayStatus,
        }
      : null
  )

  // Auto-poll status while dialog is open and charge exists
  const pollStatus = useCallback(async () => {
    if (!payment.id || !chargeResult?.chargeId) return
    setChecking(true)
    try {
      const result = await checkGatewayStatus(payment.id)
      if ("error" in result) return
      if (result.status === "paid") {
        setChargeResult((prev) => (prev ? { ...prev, status: "paid" } : prev))
        toast.success("Pagamento confirmado!")
        onSuccess?.()
      }
    } catch {
      // silent
    } finally {
      setChecking(false)
    }
  }, [payment.id, chargeResult?.chargeId, onSuccess])

  useEffect(() => {
    if (!open || !chargeResult?.chargeId || chargeResult.status === "paid")
      return

    const interval = setInterval(pollStatus, 5000)
    return () => clearInterval(interval)
  }, [open, chargeResult?.chargeId, chargeResult?.status, pollStatus])

  async function handleCreate() {
    setCreating(true)
    try {
      const result = await createGatewayCharge(payment.id, selectedMethod, selectedMethod === "credit_card" ? installments : undefined)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setChargeResult(result)
      setStep("result")
      if (!result.alreadyExists) {
        toast.success("Cobranca criada com sucesso!")
      }
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao criar cobranca"))
    } finally {
      setCreating(false)
    }
  }

  async function handleCancel() {
    setCancelling(true)
    try {
      const result = await cancelGatewayCharge(payment.id)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setChargeResult(null)
      setStep("method")
      toast.success("Cobranca cancelada")
      onSuccess?.()
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao cancelar"))
    } finally {
      setCancelling(false)
    }
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast.success(`${label} copiado!`)
    setTimeout(() => setCopied(null), 2000)
  }

  // Reset step when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (payment.gatewayChargeId) {
        setStep("result")
        setChargeResult({
          chargeId: payment.gatewayChargeId,
          paymentLink: payment.paymentLink,
          pixQrCode: payment.pixQrCode,
          pixCopiaECola: payment.pixCopiaECola,
          boletoUrl: payment.boletoUrl,
          boletoBarcode: payment.boletoBarcode,
          status: payment.gatewayStatus,
        })
      } else {
        setStep("method")
        setChargeResult(null)
      }
    }
  }, [open, payment])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Cobranca</DialogTitle>
          <DialogDescription>
            {patientName} - {description}
          </DialogDescription>
        </DialogHeader>

        {/* Payment info */}
        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5">
          <div>
            <p className="text-sm font-medium">{formatBRL(payment.amount)}</p>
            <p className="text-xs text-muted-foreground">
              Parcela {payment.installmentNumber}/{payment.totalInstallments}
              {" - "}
              Venc:{" "}
              {new Date(payment.dueDate).toLocaleDateString("pt-BR")}
            </p>
          </div>
          {chargeResult?.status && (
            <Badge
              className={
                chargeResult.status === "paid"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : chargeResult.status === "pending"
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-gray-300 bg-gray-50 text-gray-500"
              }
            >
              {chargeResult.status === "paid"
                ? "Pago"
                : chargeResult.status === "pending"
                  ? "Aguardando"
                  : chargeResult.status}
            </Badge>
          )}
        </div>

        {/* Step: Choose method */}
        {step === "method" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Selecione a forma de pagamento:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => {
                const Icon = m.icon
                const selected = selectedMethod === m.value
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setSelectedMethod(m.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                      selected
                        ? "border-vox-primary bg-vox-primary/5 ring-1 ring-vox-primary"
                        : "border-border hover:border-vox-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <Icon
                      className={`size-5 ${
                        selected ? "text-vox-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-xs font-medium">{m.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {m.description}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Installment selector for credit card */}
            {selectedMethod === "credit_card" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Parcelas no cartao</label>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 10, 12].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setInstallments(n)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        installments === n
                          ? "bg-vox-primary text-white"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {n}x {n === 1 ? "a vista" : formatBRL(Math.ceil(payment.amount / n))}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleCreate}
              disabled={creating}
              className="w-full bg-vox-primary hover:bg-vox-primary/90"
            >
              {creating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Criando cobranca...
                </>
              ) : (
                "Gerar Cobranca"
              )}
            </Button>
          </div>
        )}

        {/* Step: Show result */}
        {step === "result" && chargeResult && (
          <div className="space-y-4">
            {/* PIX QR Code */}
            {chargeResult.pixQrCode && (
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-xl border bg-white p-3">
                  <img
                    src={`data:image/png;base64,${chargeResult.pixQrCode}`}
                    alt="QR Code PIX"
                    className="size-48"
                  />
                </div>
                {chargeResult.pixCopiaECola && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 w-full"
                    onClick={() =>
                      handleCopy(chargeResult.pixCopiaECola!, "PIX Copia e Cola")
                    }
                  >
                    {copied === "PIX Copia e Cola" ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    Copiar PIX Copia e Cola
                  </Button>
                )}
              </div>
            )}

            {/* Boleto */}
            {chargeResult.boletoUrl && (
              <div className="space-y-2">
                <a
                  href={chargeResult.boletoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border bg-muted/30 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                >
                  <FileText className="size-4" />
                  Abrir Boleto PDF
                  <ExternalLink className="size-3" />
                </a>
                {chargeResult.boletoBarcode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 w-full"
                    onClick={() =>
                      handleCopy(chargeResult.boletoBarcode!, "Codigo de barras")
                    }
                  >
                    {copied === "Codigo de barras" ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    Copiar Codigo de Barras
                  </Button>
                )}
              </div>
            )}

            {/* Payment link */}
            {chargeResult.paymentLink && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="gap-1.5 w-full"
                  onClick={() =>
                    handleCopy(chargeResult.paymentLink!, "Link de pagamento")
                  }
                >
                  {copied === "Link de pagamento" ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Link2 className="size-3.5" />
                  )}
                  Copiar Link de Pagamento
                </Button>
                <a
                  href={chargeResult.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 text-xs text-vox-primary hover:underline"
                >
                  Abrir pagina de pagamento
                  <ExternalLink className="size-3" />
                </a>
              </div>
            )}

            {/* Status polling indicator */}
            {chargeResult.status !== "paid" && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                {checking ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RefreshCw className="size-3" />
                )}
                Verificando pagamento automaticamente...
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
              {chargeResult.status !== "paid" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={cancelling}
                  onClick={handleCancel}
                >
                  {cancelling ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    "Cancelar Cobranca"
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
