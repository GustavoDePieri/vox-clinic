"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Upload,
  AudioLines,
  Brain,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getRecordingStatus } from "@/server/actions/recording"

type RecordingStatus = "processing" | "processed" | "error" | "pending"

const POLL_INTERVAL = 3000 // 3 seconds
const MAX_POLL_DURATION = 180_000 // 3 minutes

// Processing steps for the progress UI
const STEPS = [
  {
    id: "upload",
    label: "Enviando audio...",
    icon: Upload,
    duration: 5_000,
  },
  {
    id: "transcribe",
    label: "Transcrevendo...",
    icon: AudioLines,
    duration: 30_000,
  },
  {
    id: "analyze",
    label: "Analisando com IA...",
    icon: Brain,
    duration: 30_000,
  },
  {
    id: "done",
    label: "Pronto!",
    icon: CheckCircle2,
    duration: 0,
  },
] as const

export default function ProcessingPage() {
  const params = useParams()
  const router = useRouter()
  const recordingId = params.recordingId as string

  const [status, setStatus] = useState<RecordingStatus>("processing")
  const [error, setError] = useState<string | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [type, setType] = useState<"registration" | "consultation" | null>(null)

  const pollStartRef = useRef(Date.now())
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Read type from URL search params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const t = searchParams.get("type") as "registration" | "consultation" | null
    setType(t)
    const pid = searchParams.get("patientId")
    if (pid) setPatientId(pid)
  }, [])

  // Animate through steps based on elapsed time
  useEffect(() => {
    if (status !== "processing") return

    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      let accumulated = 0
      for (let i = 0; i < STEPS.length - 1; i++) {
        accumulated += STEPS[i].duration
        if (elapsed < accumulated) {
          setCurrentStep(i)
          return
        }
      }
      // After all step durations, stay on last processing step
      setCurrentStep(STEPS.length - 2)
    }, 500)

    return () => clearInterval(timer)
  }, [status])

  const pollStatus = useCallback(async () => {
    // Check timeout
    if (Date.now() - pollStartRef.current > MAX_POLL_DURATION) {
      setTimedOut(true)
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
      return
    }

    try {
      const result = await getRecordingStatus(recordingId)

      // safeAction error — action-level failure
      if ("error" in result && typeof result.error === "string") {
        setError(result.error)
        setStatus("error")
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current)
          pollTimerRef.current = null
        }
        return
      }

      // Success path — extract fields (cast to bypass SafeActionResult union)
      const data = result as {
        recordingId: string
        status: "processing" | "processed" | "error" | "pending"
        transcript: string | null
        summary: unknown
        error: string | null
        patientId: string | null
        audioUrl: string
      }

      if (data.patientId) setPatientId(data.patientId)

      if (data.status === "processed") {
        setStatus("processed")
        setCurrentStep(STEPS.length - 1)
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current)
          pollTimerRef.current = null
        }

        // Redirect after a short delay to show the "Pronto!" state
        setTimeout(() => {
          if (type === "registration") {
            // Voice registration -> goes to voice review page
            router.push(`/patients/new/voice?recordingId=${recordingId}`)
          } else {
            // Consultation -> goes to review page
            router.push(
              `/appointments/review?recordingId=${recordingId}&patientId=${data.patientId ?? patientId ?? ""}`
            )
          }
        }, 1000)
      } else if (data.status === "error") {
        setStatus("error")
        setError(data.error ?? "Erro desconhecido no processamento")
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current)
          pollTimerRef.current = null
        }
      }
      // else: still processing — continue polling
    } catch (err) {
      // Network error — don't stop polling, just log
      console.error("[ProcessingPage] poll error:", err)
    }
  }, [recordingId, router, type, patientId])

  // Start polling on mount
  useEffect(() => {
    pollStartRef.current = Date.now()
    // Poll immediately
    pollStatus()
    // Then poll every 3 seconds
    pollTimerRef.current = setInterval(pollStatus, POLL_INTERVAL)

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [pollStatus])

  function handleRetry() {
    setStatus("processing")
    setError(null)
    setTimedOut(false)
    setCurrentStep(0)
    pollStartRef.current = Date.now()
    pollStatus()
    pollTimerRef.current = setInterval(pollStatus, POLL_INTERVAL)
  }

  // Error state
  if (status === "error" || timedOut) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-vox-error/10">
          <AlertCircle className="size-7 text-vox-error" />
        </div>

        <div className="text-center space-y-2 max-w-sm">
          <h2 className="text-lg font-semibold">
            {timedOut
              ? "Processamento demorou mais que o esperado"
              : "Erro no processamento"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {timedOut
              ? "O audio ainda pode estar sendo processado. Tente novamente em alguns instantes."
              : error ?? "Ocorreu um erro ao processar o audio."}
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Voltar
          </Button>
          <Button onClick={handleRetry} className="gap-1.5">
            <RotateCcw className="size-3.5" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  // Processing / done state
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      {/* Animated icon */}
      <div className="relative">
        {status === "processing" && (
          <div className="absolute inset-0 rounded-full bg-vox-primary/20 animate-ping" />
        )}
        <div
          className={`relative flex size-16 items-center justify-center rounded-full ${
            status === "processed"
              ? "bg-vox-success/10"
              : "bg-vox-primary/10"
          }`}
        >
          {status === "processed" ? (
            <CheckCircle2 className="size-7 text-vox-success" />
          ) : (
            <Loader2 className="size-7 text-vox-primary animate-spin" />
          )}
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold">
          {status === "processed"
            ? "Processamento concluido!"
            : "Processando audio..."}
        </h2>
        <p className="text-sm text-muted-foreground">
          {status === "processed"
            ? "Redirecionando para revisao..."
            : "Cada etapa e processada separadamente com retentativas automaticas"}
        </p>
      </div>

      {/* Step progress */}
      <Card className="w-full max-w-sm">
        <CardContent className="py-4 space-y-3">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon
            const isActive = index === currentStep && status === "processing"
            const isDone =
              status === "processed" || index < currentStep
            const isPending =
              index > currentStep && status === "processing"

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  isPending ? "opacity-40" : "opacity-100"
                }`}
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                    isDone
                      ? "bg-vox-success/10 text-vox-success"
                      : isActive
                        ? "bg-vox-primary/10 text-vox-primary"
                        : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-4" />
                  ) : isActive ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <StepIcon className="size-4" />
                  )}
                </div>

                <span
                  className={`text-sm ${
                    isDone
                      ? "text-vox-success font-medium"
                      : isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>

                {isActive && (
                  <Badge
                    variant="secondary"
                    className="ml-auto text-[10px] px-1.5 py-0"
                  >
                    em andamento
                  </Badge>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Progress bar */}
      {status === "processing" && (
        <div className="w-full max-w-sm space-y-1.5">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-vox-primary transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(
                  ((currentStep + 1) / STEPS.length) * 100,
                  90
                )}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            Retentativas automaticas em caso de falha
          </p>
        </div>
      )}
    </div>
  )
}
