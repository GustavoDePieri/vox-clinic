"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Video, Copy, Check, PhoneOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { endTeleconsulta } from "@/server/actions/teleconsulta"

interface TeleconsultaRoomProps {
  appointment: {
    id: string
    date: string
    status: string
    patient: { id: string; name: string } | null
    procedures: string[]
    videoRoomUrl: string | null
    videoToken: string | null
    ownerToken: string | null
  }
}

export function TeleconsultaRoom({ appointment }: TeleconsultaRoomProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [ending, setEnding] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.voxclinic.com"
  const patientLink = appointment.videoToken
    ? `${appUrl}/sala/${appointment.videoToken}`
    : null

  const iframeUrl = appointment.videoRoomUrl && appointment.ownerToken
    ? `${appointment.videoRoomUrl}?t=${appointment.ownerToken}`
    : null

  const dateStr = new Date(appointment.date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  async function handleCopyLink() {
    if (!patientLink) return
    try {
      await navigator.clipboard.writeText(patientLink)
      setCopied(true)
      toast.success("Link copiado para a area de transferencia")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Falha ao copiar link")
    }
  }

  async function handleEnd() {
    setEnding(true)
    try {
      await endTeleconsulta(appointment.id)
      toast.success("Teleconsulta encerrada")
      router.push("/calendar")
    } catch {
      toast.error("Erro ao encerrar teleconsulta")
      setEnding(false)
    }
  }

  if (!iframeUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Video className="size-12 text-muted-foreground" />
        <p className="text-muted-foreground">Sala de video nao disponivel</p>
        <Button variant="outline" onClick={() => router.push("/calendar")}>
          Voltar para Agenda
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Video className="size-4 text-vox-primary" />
          <div>
            <p className="text-sm font-medium">
              {appointment.patient?.name ?? "Paciente"}
            </p>
            <p className="text-xs text-muted-foreground">{dateStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {patientLink && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copiado" : "Copiar Link do Paciente"}
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 bg-destructive text-white hover:bg-destructive/90 h-8 px-3 gap-1.5">
              <PhoneOff className="size-3.5" />
              Encerrar
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Encerrar teleconsulta?</AlertDialogTitle>
                <AlertDialogDescription>
                  A consulta sera marcada como concluida e a sala de video sera encerrada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleEnd} disabled={ending}>
                  {ending ? "Encerrando..." : "Confirmar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Video iframe */}
      <iframe
        src={iframeUrl}
        allow="camera; microphone; fullscreen; display-capture"
        className="flex-1 w-full border-0"
      />
    </div>
  )
}
