"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  Check,
  Zap,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react"
import {
  getGatewayConfig,
  saveGatewayConfig,
  testGatewayConnection,
} from "@/server/actions/gateway-config"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"

export function GatewaySection() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const [provider, setProvider] = useState("asaas")
  const [apiKey, setApiKey] = useState("")
  const [maskedApiKey, setMaskedApiKey] = useState("")
  const [walletId, setWalletId] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [sandboxMode, setSandboxMode] = useState(true)
  const [hasConfig, setHasConfig] = useState(false)
  const [testResult, setTestResult] = useState<{ valid: boolean; message?: string } | null>(null)

  useEffect(() => {
    getGatewayConfig()
      .then((config) => {
        if (config) {
          setProvider(config.provider)
          setMaskedApiKey(config.apiKey)
          setWalletId(config.walletId || "")
          setIsActive(config.isActive)
          setSandboxMode(config.sandboxMode)
          setHasConfig(true)
        }
      })
      .catch((err) => {
        toast.error(friendlyError(err, "Erro ao carregar configuracao"))
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setTestResult(null)
    try {
      const result = await saveGatewayConfig({
        provider,
        apiKey: apiKey || undefined, // only send if changed
        walletId: walletId || undefined,
        isActive,
        sandboxMode,
      })
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setHasConfig(true)
      setApiKey("") // clear raw key
      toast.success("Configuracao salva com sucesso")

      // Refresh masked key
      const config = await getGatewayConfig()
      if (config) setMaskedApiKey(config.apiKey)
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao salvar"))
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await testGatewayConnection()
      if ("error" in result) {
        setTestResult({ valid: false, message: result.error })
        return
      }
      setTestResult(result)
      if (result.valid) {
        toast.success("Conexao com gateway bem-sucedida!")
      } else {
        toast.error(result.message || "Falha na conexao")
      }
    } catch (err) {
      setTestResult({
        valid: false,
        message: friendlyError(err, "Erro ao testar conexao"),
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-vox-primary/10">
            <Zap className="size-4 text-vox-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Gateway de Pagamento</CardTitle>
            <CardDescription>
              Aceite PIX, boleto e cartao diretamente pela plataforma
            </CardDescription>
          </div>
          {hasConfig && (
            <Badge
              className={`ml-auto ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-gray-50 text-gray-500 border-gray-200"
              }`}
            >
              {isActive ? "Ativo" : "Inativo"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Active toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Ativar gateway</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quando ativo, voce pode enviar cobrancas via gateway
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        {/* Provider selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Provedor</Label>
          <Select value={provider} onValueChange={(v) => v && setProvider(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asaas">Asaas</SelectItem>
              <SelectItem value="stripe" disabled>
                Stripe (em breve)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Chave da API</Label>
          <Input
            type="password"
            placeholder={maskedApiKey || "Cole sua chave de API aqui"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          {maskedApiKey && !apiKey && (
            <p className="text-xs text-muted-foreground">
              Chave configurada: {maskedApiKey}
            </p>
          )}
          <a
            href={
              provider === "asaas"
                ? "https://www.asaas.com/customerApiKeys"
                : "#"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-vox-primary hover:underline"
          >
            Como obter a chave?
            <ExternalLink className="size-3" />
          </a>
        </div>

        {/* Wallet ID (optional) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Wallet ID{" "}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            placeholder="Preenchimento automatico na maioria dos casos"
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
          />
        </div>

        {/* Sandbox mode */}
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-3">
          <div>
            <Label className="text-sm font-medium text-amber-800">
              Modo Sandbox (Homologacao)
            </Label>
            <p className="text-xs text-amber-600 mt-0.5">
              Quando ativo, usa o ambiente de testes — sem transacoes reais
            </p>
          </div>
          <Switch checked={sandboxMode} onCheckedChange={setSandboxMode} />
        </div>

        {/* Test result */}
        {testResult && (
          <div
            className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
              testResult.valid
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {testResult.valid ? (
              <ShieldCheck className="size-4" />
            ) : (
              <AlertCircle className="size-4" />
            )}
            {testResult.valid
              ? "Conexao com gateway bem-sucedida!"
              : testResult.message || "Falha ao conectar"}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-vox-primary hover:bg-vox-primary/90"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="size-4" />
                Salvar
              </>
            )}
          </Button>

          {hasConfig && (
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing}
            >
              {testing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Testando...
                </>
              ) : (
                "Testar Conexao"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
