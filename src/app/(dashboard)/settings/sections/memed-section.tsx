"use client"

import { useState, useCallback, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pill, Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"

const BOARD_OPTIONS = [
  { value: "CRM", label: "CRM - Medicina" },
  { value: "CRO", label: "CRO - Odontologia" },
  { value: "COREN", label: "COREN - Enfermagem" },
  { value: "CRF", label: "CRF - Farmacia" },
  { value: "CRN", label: "CRN - Nutricao" },
  { value: "CREFITO", label: "CREFITO - Fisioterapia" },
  { value: "CRP", label: "CRP - Psicologia" },
  { value: "CRMV", label: "CRMV - Veterinaria" },
]

const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
]

type PrescriberData = {
  isConfigured: boolean
  prescriber: {
    id: string
    status: string
    boardCode: string
    boardNumber: string
    boardState: string
    memedExternalId: string
    createdAt: string
  } | null
  scriptUrl: string | null
}

export function MemedSection() {
  const { user: clerkUser } = useUser()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PrescriberData | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Form state
  const [boardCode, setBoardCode] = useState("CRM")
  const [boardNumber, setBoardNumber] = useState("")
  const [boardState, setBoardState] = useState("SP")

  const loadStatus = useCallback(async () => {
    try {
      const { getMemedPrescriberStatus } = await import(
        "@/server/actions/memed"
      )
      const result = await getMemedPrescriberStatus()
      setData(result)
      if (result.prescriber) {
        setBoardCode(result.prescriber.boardCode ?? "CRM")
        setBoardNumber(result.prescriber.boardNumber ?? "")
        setBoardState(result.prescriber.boardState ?? "SP")
      }
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  async function handleRegister() {
    if (!boardNumber.trim()) {
      toast.error("Informe o numero do conselho")
      return
    }

    setActionLoading(true)
    try {
      const { registerMemedPrescriber } = await import(
        "@/server/actions/memed"
      )
      const result = await registerMemedPrescriber({
        boardCode,
        boardNumber: boardNumber.trim(),
        boardState,
        nome: clerkUser?.fullName ?? clerkUser?.firstName ?? "Profissional",
        email: clerkUser?.primaryEmailAddress?.emailAddress,
      })
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Conectado ao Memed com sucesso")
      loadStatus()
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao conectar ao Memed"))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDisconnect() {
    setActionLoading(true)
    try {
      const { disconnectMemedPrescriber } = await import(
        "@/server/actions/memed"
      )
      const result = await disconnectMemedPrescriber()
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Desconectado do Memed")
      setData(null)
      setBoardNumber("")
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao desconectar"))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  const isConnected = data?.prescriber != null && data.prescriber.status === "active"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Pill className="size-4 text-vox-primary" />
          Prescricao Digital Memed
          {isConnected ? (
            <Badge className="bg-vox-success/10 text-vox-success border-vox-success/20 text-[10px]">
              <CheckCircle2 className="size-3 mr-1" />
              Conectado
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground text-[10px]">
              Nao configurado
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Integre com o Memed para prescricoes digitais com base de 60k+ medicamentos,
          alertas de interacao e assinatura digital ICP-Brasil.
          <span className="text-vox-success font-medium ml-1">Gratuito para parceiros.</span>
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {isConnected ? (
          <>
            {/* Connected state */}
            <div className="rounded-xl border border-vox-success/20 bg-vox-success/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-vox-success" />
                <span className="text-sm font-medium">Prescritor conectado</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Conselho:</span>{" "}
                  {data?.prescriber?.boardCode}
                </div>
                <div>
                  <span className="font-medium text-foreground">Numero:</span>{" "}
                  {data?.prescriber?.boardNumber}
                </div>
                <div>
                  <span className="font-medium text-foreground">UF:</span>{" "}
                  {data?.prescriber?.boardState}
                </div>
              </div>
              {data?.prescriber?.status && data.prescriber.status !== "active" && (
                <p className="text-xs text-vox-warning flex items-center gap-1">
                  <XCircle className="size-3" />
                  Status: {data.prescriber.status}
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={actionLoading}
              className="rounded-xl text-vox-error hover:text-vox-error hover:bg-vox-error/5"
            >
              {actionLoading ? (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              ) : (
                <XCircle className="size-3.5 mr-1.5" />
              )}
              Desconectar Memed
            </Button>
          </>
        ) : (
          <>
            {/* Registration form */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Conselho</Label>
                <select
                  value={boardCode}
                  onChange={(e) => setBoardCode(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vox-primary/30"
                >
                  {BOARD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Numero do conselho</Label>
                <Input
                  value={boardNumber}
                  onChange={(e) => setBoardNumber(e.target.value)}
                  placeholder="Ex: 123456"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">UF</Label>
                <select
                  value={boardState}
                  onChange={(e) => setBoardState(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vox-primary/30"
                >
                  {UF_OPTIONS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={handleRegister}
              disabled={actionLoading || !boardNumber.trim()}
              className="rounded-xl bg-vox-primary text-white hover:bg-vox-primary/90 gap-1.5"
            >
              {actionLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Pill className="size-3.5" />
              )}
              Conectar ao Memed
            </Button>
          </>
        )}

        {/* Info note */}
        <div className="rounded-xl bg-muted/30 border border-border/40 p-3 text-xs text-muted-foreground space-y-1">
          <p>
            O Memed oferece prescricao digital com base completa de medicamentos,
            alertas de interacao e assinatura digital. A integracao e{" "}
            <span className="font-medium text-vox-success">100% gratuita</span> para parceiros de software.
          </p>
          <a
            href="https://memed.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-vox-primary hover:underline"
          >
            Saiba mais sobre o Memed
            <ExternalLink className="size-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
