"use client"

import { useEffect, useState, useTransition, useCallback } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle, Pill } from "lucide-react"
import { useMemed } from "@/hooks/use-memed"
import type { PrescricaoImpressaPayload } from "@/hooks/use-memed"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"

interface MemedPrescriptionPanelProps {
  open: boolean
  onClose: () => void
  patient: { id: string; name: string; cpf?: string; phone?: string }
  onPrescriptionCreated: (prescriptionId: string) => void
}

export function MemedPrescriptionPanel({
  open,
  onClose,
  patient,
  onPrescriptionCreated,
}: MemedPrescriptionPanelProps) {
  const [token, setToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [syncing, startSync] = useTransition()

  // Fetch token on mount
  useEffect(() => {
    if (!open) return

    let cancelled = false
    setTokenLoading(true)
    setTokenError(null)

    // Dynamic import to avoid bundler issues with server actions
    import("@/server/actions/memed").then(({ getMemedToken }) =>
      getMemedToken()
    ).then((result) => {
      if (cancelled) return
      setToken(result.token)
    }).catch((err) => {
      if (cancelled) return
      setTokenError(friendlyError(err, "Erro ao obter token Memed"))
    }).finally(() => {
      if (!cancelled) setTokenLoading(false)
    })

    return () => { cancelled = true }
  }, [open])

  const handlePrescricaoImpressa = useCallback(
    (payload: PrescricaoImpressaPayload) => {
      startSync(async () => {
        try {
          const { syncMemedPrescription } = await import(
            "@/server/actions/memed"
          )

          // Extract structured data from Memed's prescricaoImpressa event
          // The payload contains prescricao.id, medicamentos array, etc.
          const prescricao = payload?.prescricao ?? payload
          const memedPrescriptionId = String(prescricao?.id ?? "")
          const medicamentos = Array.isArray(prescricao?.medicamentos)
            ? prescricao.medicamentos
            : []

          const medications = medicamentos.map(
            (med: Record<string, unknown>) => ({
              name: String(med.nome ?? med.descricao ?? ""),
              dosage: String(med.posologia ?? med.dosagem ?? ""),
              frequency: String(med.frequencia ?? ""),
              duration: String(med.duracao ?? ""),
              notes: String(med.observacao ?? ""),
            })
          )

          const result = await syncMemedPrescription({
            patientId: patient.id,
            memedPrescriptionId,
            medications:
              medications.length > 0
                ? medications
                : [{ name: "Prescricao Memed", dosage: "-", frequency: "-", duration: "-" }],
            memedPayload: payload,
          })
          if ("error" in result) {
            toast.error(result.error)
            return
          }
          toast.success("Prescricao Memed salva com sucesso")
          onPrescriptionCreated(result.id)
          onClose()
        } catch (err) {
          toast.error(friendlyError(err, "Erro ao salvar prescricao Memed"))
        }
      })
    },
    [patient.id, onPrescriptionCreated, onClose]
  )

  const { isReady, isLoading: memedLoading, error: memedError, showPrescription, hidePrescription } =
    useMemed(token, { onPrescricaoImpressa: handlePrescricaoImpressa })

  // Show prescription when Memed is ready and panel is open
  useEffect(() => {
    if (open && isReady) {
      showPrescription({
        nome: patient.name,
        cpf: patient.cpf,
        telefone: patient.phone,
        idExterno: patient.id,
      })
    }
  }, [open, isReady, patient, showPrescription])

  const handleClose = () => {
    hidePrescription()
    onClose()
  }

  const loading = tokenLoading || memedLoading
  const error = tokenError || memedError

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[900px] p-0 flex flex-col"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/40">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Pill className="size-4 text-vox-primary" />
            Prescricao Memed
          </SheetTitle>
          <SheetDescription>
            Paciente: <strong>{patient.name}</strong>
            {syncing && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Salvando...
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-[700px] relative">
          {/* Loading state */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card z-10">
              <Loader2 className="size-8 text-vox-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                Carregando modulo Memed...
              </p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card z-10 p-6">
              <div className="flex size-14 items-center justify-center rounded-full bg-vox-warning/10">
                <AlertTriangle className="size-6 text-vox-warning" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-sm font-medium">Memed indisponivel</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {error}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  className="rounded-xl"
                >
                  Usar prescricao manual
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="rounded-xl bg-vox-primary text-white hover:bg-vox-primary/90"
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}

          {/* Memed renders its UI into the DOM automatically via the script.
              The module overlays on top of the page when shown. */}
          {isReady && !error && (
            <div className="w-full h-full" id="memed-prescricao-container" />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
