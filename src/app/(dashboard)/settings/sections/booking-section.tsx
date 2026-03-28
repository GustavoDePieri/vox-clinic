"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Globe, Copy, RefreshCw, Link2 } from "lucide-react"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"
import {
  getBookingConfig,
  toggleBooking,
  updateBookingConfig,
  regenerateBookingToken,
} from "@/server/actions/booking-config"
import { BookingWidgetSection } from "./booking-widget-section"

export function BookingSection() {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<{
    token: string; isActive: boolean; maxDaysAhead: number; startHour: number; endHour: number; welcomeMessage: string | null
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({ open: false, title: "", description: "", onConfirm: () => {} })
  const showConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, description, onConfirm })
  }

  const loadConfig = useCallback(async () => {
    try {
      const data = await getBookingConfig()
      setConfig(data)
    } catch (err) {
      console.error("[Settings] booking config load failed", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])

  async function handleToggle(enabled: boolean) {
    setActionLoading(true)
    try {
      const result = await toggleBooking(enabled)
      if ('error' in result) { toast.error(result.error); return }
      setConfig((prev) => prev ? { ...prev, ...result } : { ...result, maxDaysAhead: 30, startHour: 8, endHour: 18, welcomeMessage: null })
      toast.success(enabled ? "Agendamento online ativado" : "Agendamento online desativado")
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao processar"))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRegenerate() {
    showConfirm("Regenerar link", "Regenerar o link? O link anterior deixara de funcionar.", async () => {
      setActionLoading(true)
      try {
        const result = await regenerateBookingToken()
        if ('error' in result) { toast.error(result.error); return }
        setConfig((prev) => prev ? { ...prev, token: result.token } : null)
        toast.success("Link regenerado")
      } catch (err) {
        toast.error(friendlyError(err, "Erro ao regenerar link"))
      } finally {
        setActionLoading(false)
      }
    })
  }

  async function handleSaveConfig(data: { maxDaysAhead?: number; startHour?: number; endHour?: number; welcomeMessage?: string | null }) {
    setActionLoading(true)
    try {
      const result = await updateBookingConfig(data)
      if ('error' in result) { toast.error(result.error); return }
      setConfig((prev) => prev ? { ...prev, ...result } : null)
      toast.success("Configuracao salva")
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao salvar configuracao"))
    } finally {
      setActionLoading(false)
    }
  }

  const bookingUrl = config?.token ? `${typeof window !== "undefined" ? window.location.origin : ""}/booking/${config.token}` : ""

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

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="size-4 text-vox-primary" />
          Agendamento Online
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Permita que pacientes agendem consultas diretamente pelo link. Compartilhe no Instagram, WhatsApp ou site.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-border/40 p-4">
          <div>
            <div className="text-sm font-medium">Ativar agendamento online</div>
            <div className="text-xs text-muted-foreground mt-0.5">Pacientes poderao agendar pelo link</div>
          </div>
          <Switch
            checked={config?.isActive ?? false}
            onCheckedChange={handleToggle}
            disabled={actionLoading}
          />
        </div>

        {/* Booking URL */}
        {config?.isActive && (
          <>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Link2 className="size-3.5" />
                Link de agendamento
              </Label>
              <div className="flex gap-2">
                <Input value={bookingUrl} readOnly className="rounded-xl text-xs bg-muted/30" />
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl shrink-0 gap-1.5"
                  onClick={() => { navigator.clipboard.writeText(bookingUrl); toast.success("Link copiado!") }}
                >
                  <Copy className="size-3.5" />
                  Copiar
                </Button>
              </div>
              <button onClick={handleRegenerate} disabled={actionLoading} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                <RefreshCw className="size-3" />
                Regenerar link
              </button>
            </div>

            <Separator />

            {/* Config */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Horario inicio</Label>
                <select
                  value={config.startHour}
                  onChange={(e) => handleSaveConfig({ startHour: parseInt(e.target.value) })}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vox-primary/30"
                >
                  {Array.from({ length: 14 }, (_, i) => i + 6).map((h) => (
                    <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Horario fim</Label>
                <select
                  value={config.endHour}
                  onChange={(e) => handleSaveConfig({ endHour: parseInt(e.target.value) })}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vox-primary/30"
                >
                  {Array.from({ length: 14 }, (_, i) => i + 8).map((h) => (
                    <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Dias no futuro (max)</Label>
                <Input
                  type="number"
                  min={7}
                  max={90}
                  value={config.maxDaysAhead}
                  onChange={(e) => handleSaveConfig({ maxDaysAhead: Math.min(90, Math.max(7, parseInt(e.target.value) || 30)) })}
                  className="rounded-xl text-sm"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
    {/* Widget embed section — only when booking is active */}
    {config?.isActive && config?.token && (
      <BookingWidgetSection token={config.token} />
    )}
    <ConfirmDialog
      open={confirmDialog.open}
      onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
      title={confirmDialog.title}
      description={confirmDialog.description}
      onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(prev => ({ ...prev, open: false })) }}
    />
    </>
  )
}
