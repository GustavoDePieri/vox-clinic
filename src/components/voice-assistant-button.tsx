"use client"

import { useState, useCallback } from "react"
import { Mic, Loader2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { RecordButton } from "@/components/record-button"
import { processPatientVoiceUpdate, confirmPatientVoiceUpdate } from "@/server/actions/voice"
import type { PatientUpdateIntents } from "@/lib/claude"

interface VoiceAssistantButtonProps {
  patientId?: string
}

type State = "idle" | "recording" | "processing" | "confirming" | "success" | "error"

const ACTION_LABELS: Record<string, string> = {
  ADD_NOTE: "Anotacao Clinica",
  ADD_ALLERGY: "Alergia",
  ADD_MEDICAL_HISTORY: "Historico Medico",
  UNKNOWN: "Nao identificado",
}

export function VoiceAssistantButton({ patientId }: VoiceAssistantButtonProps) {
  const [state, setState] = useState<State>("idle")
  const [transcript, setTranscript] = useState("")
  const [intents, setIntents] = useState<PatientUpdateIntents["actions"]>([])
  const [recordingId, setRecordingId] = useState("")
  const [resolvedPatientId, setResolvedPatientId] = useState(patientId ?? "")
  const [errorMessage, setErrorMessage] = useState("")

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    if (!resolvedPatientId) {
      setState("confirming")
      return
    }

    setState("processing")
    setErrorMessage("")

    const formData = new FormData()
    formData.append("audio", audioBlob, "recording.webm")
    formData.append("patientId", resolvedPatientId)

    const result = await processPatientVoiceUpdate(formData)

    if ("error" in result) {
      setErrorMessage(result.error)
      setState("error")
      setTimeout(() => setState("idle"), 3000)
      return
    }

    setTranscript(result.transcript)
    setIntents(result.intents.actions)
    setRecordingId(result.recordingId)
    setState("confirming")
  }, [resolvedPatientId])

  const handleConfirm = async () => {
    const confirmableActions = intents
      .filter((a: PatientUpdateIntents["actions"][number]) => a.type !== "UNKNOWN")
      .map((a: PatientUpdateIntents["actions"][number]) => ({ type: a.type, value: a.value }))

    if (confirmableActions.length === 0) {
      setState("idle")
      return
    }

    const result = await confirmPatientVoiceUpdate({
      recordingId,
      patientId: resolvedPatientId,
      actions: confirmableActions,
    })

    if ("error" in result) {
      setErrorMessage(result.error)
      setState("error")
      setTimeout(() => setState("idle"), 3000)
      return
    }

    setState("success")
    setTimeout(() => {
      setState("idle")
      setTranscript("")
      setIntents([])
      setRecordingId("")
    }, 1500)
  }

  const handleCancel = () => {
    setState("idle")
    setTranscript("")
    setIntents([])
    setRecordingId("")
    setErrorMessage("")
  }

  if (state === "recording") {
    return (
      <div className="fixed bottom-20 right-6 z-50 md:bottom-6">
        <RecordButton
          onRecordingComplete={handleRecordingComplete}
          size="md"
          requireConsent={false}
        />
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => {
          if (state === "idle") setState("recording")
        }}
        disabled={state === "processing" || state === "success"}
        className={cn(
          "fixed bottom-20 right-6 z-50 md:bottom-6 rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all text-white",
          state === "idle" && "bg-vox-primary hover:bg-vox-primary/90",
          state === "processing" && "bg-vox-primary/70 cursor-wait",
          state === "success" && "bg-emerald-500",
          state === "error" && "bg-destructive"
        )}
        aria-label="Assistente de voz"
      >
        {state === "idle" && <Mic size={24} />}
        {state === "processing" && <Loader2 size={24} className="animate-spin" />}
        {state === "success" && <Check size={24} />}
        {state === "error" && <X size={24} />}
      </button>

      {state === "error" && errorMessage && (
        <div className="fixed bottom-36 right-6 z-50 md:bottom-22 max-w-xs rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <Dialog open={state === "confirming"} onOpenChange={(open: boolean) => { if (!open) handleCancel() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar atualizacao do paciente</DialogTitle>
            <DialogDescription>
              Revise os dados extraidos do audio antes de confirmar.
            </DialogDescription>
          </DialogHeader>

          {!resolvedPatientId ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione um paciente antes de usar o assistente de voz.
              </p>
              <p className="text-sm text-muted-foreground">
                Acesse a ficha do paciente e use o assistente de voz a partir dela.
              </p>
              <Button variant="outline" className="w-full" onClick={handleCancel}>
                Fechar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {transcript && (
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Transcricao</p>
                  <p className="text-sm text-muted-foreground">{transcript}</p>
                </div>
              )}

              {intents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Acoes identificadas</p>
                  {intents.map((action, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl border p-3",
                        action.type === "UNKNOWN"
                          ? "border-border/40 opacity-50"
                          : "border-border/40"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-medium",
                        action.type === "UNKNOWN" ? "text-muted-foreground" : "text-vox-primary"
                      )}>
                        {ACTION_LABELS[action.type] ?? action.type}
                      </span>
                      <p className="text-sm mt-1">{action.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-vox-primary hover:bg-vox-primary/90"
                  onClick={handleConfirm}
                  disabled={intents.filter((a: PatientUpdateIntents["actions"][number]) => a.type !== "UNKNOWN").length === 0}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
