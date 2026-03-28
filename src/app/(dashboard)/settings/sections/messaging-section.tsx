"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  MessageSquare, Mail, Phone, Loader2, Save, ChevronRight,
  CheckCircle, AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"
import { getMessagingConfig, updateMessagingConfig } from "@/server/actions/messaging"
import Link from "next/link"

function StatusDot({ enabled }: { enabled: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-[11px] ${enabled ? "text-vox-success" : "text-muted-foreground"}`}>
      {enabled ? <CheckCircle className="size-3.5" /> : <AlertCircle className="size-3.5" />}
      {enabled ? "Configurado" : "Nao configurado"}
    </div>
  )
}

export function MessagingSection() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({ emailEnabled: false, whatsappEnabled: false, smsEnabled: false, whatsappPhone: "", twilioPhone: "" })
  const [whatsappKey, setWhatsappKey] = useState("")
  const [whatsappPhone, setWhatsappPhone] = useState("")
  const [twilioSid, setTwilioSid] = useState("")
  const [twilioToken, setTwilioToken] = useState("")
  const [twilioPhone, setTwilioPhone] = useState("")

  useEffect(() => {
    getMessagingConfig()
      .then((c) => {
        setConfig(c)
        setWhatsappPhone(c.whatsappPhone)
        setTwilioPhone(c.twilioPhone)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await updateMessagingConfig({
        whatsappApiKey: whatsappKey || undefined,
        whatsappPhone: whatsappPhone || undefined,
        twilioAccountSid: twilioSid || undefined,
        twilioAuthToken: twilioToken || undefined,
        twilioPhone: twilioPhone || undefined,
      })
      const updated = await getMessagingConfig()
      setConfig(updated)
      setWhatsappKey("")
      setTwilioSid("")
      setTwilioToken("")
      toast.success("Configuracoes de mensageria salvas")
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao salvar configuracoes de mensageria"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton className="h-48 rounded-2xl" />

  return (
    <div className="space-y-4">
      {/* Channel status overview */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-vox-primary/10">
                  <Mail className="size-4 text-vox-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium">Email</p>
                  <StatusDot enabled={config.emailEnabled} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-vox-success/10">
                  <MessageSquare className="size-4 text-vox-success" />
                </div>
                <div>
                  <p className="text-xs font-medium">WhatsApp</p>
                  <StatusDot enabled={config.whatsappEnabled} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-vox-warning/10">
                  <Phone className="size-4 text-vox-warning" />
                </div>
                <div>
                  <p className="text-xs font-medium">SMS</p>
                  <StatusDot enabled={config.smsEnabled} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="size-4 text-vox-success" />
            WhatsApp Business API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Configure a integracao com o WhatsApp Business para enviar lembretes e atender pacientes.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">API Key</Label>
              <Input
                type="password"
                value={whatsappKey}
                onChange={(e) => setWhatsappKey(e.target.value)}
                placeholder={config.whatsappEnabled ? "••••••••" : "Cole sua API key"}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Numero do WhatsApp</Label>
              <Input
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+55 11 99999-9999"
              />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Configuracao Avancada</p>
              <p className="text-[11px] text-muted-foreground">
                Assistente completo de integracao com WhatsApp Business API, templates e webhook.
              </p>
            </div>
            <Link href="/settings/whatsapp">
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
                <MessageSquare className="size-3.5" />
                Configurar WhatsApp
                <ChevronRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Twilio SMS config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="size-4 text-vox-warning" />
            SMS via Twilio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Configure suas credenciais Twilio para enviar lembretes por SMS.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Account SID</Label>
              <Input
                type="password"
                value={twilioSid}
                onChange={(e) => setTwilioSid(e.target.value)}
                placeholder={config.smsEnabled ? "••••••••" : "AC..."}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Auth Token</Label>
              <Input
                type="password"
                value={twilioToken}
                onChange={(e) => setTwilioToken(e.target.value)}
                placeholder="Token"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Numero Twilio</Label>
              <Input
                value={twilioPhone}
                onChange={(e) => setTwilioPhone(e.target.value)}
                placeholder="+55..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-vox-primary text-white hover:bg-vox-primary/90 gap-1.5"
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Salvar Configuracoes
        </Button>
      </div>
    </div>
  )
}
