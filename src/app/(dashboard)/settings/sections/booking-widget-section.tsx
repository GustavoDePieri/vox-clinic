"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Code2, Copy, Check, Eye } from "lucide-react"
import { toast } from "sonner"

interface BookingWidgetSectionProps {
  token: string
}

const POSITION_OPTIONS = [
  { value: "bottom-right", label: "Inferior direito" },
  { value: "bottom-left", label: "Inferior esquerdo" },
  { value: "inline", label: "Inline (dentro de um elemento)" },
]

export function BookingWidgetSection({ token }: BookingWidgetSectionProps) {
  const [widgetColor, setWidgetColor] = useState("#14B8A6")
  const [widgetPosition, setWidgetPosition] = useState("bottom-right")
  const [widgetButtonText, setWidgetButtonText] = useState("Agendar")
  const [widgetWidth, setWidgetWidth] = useState("400")
  const [widgetHeight, setWidgetHeight] = useState("620")
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://app.voxclinic.com"

  const embedCode = useMemo(() => {
    const attrs = [
      `src="${baseUrl}/widget.js"`,
      `data-token="${token}"`,
    ]

    if (widgetColor !== "#14B8A6") attrs.push(`data-color="${widgetColor}"`)
    if (widgetPosition !== "bottom-right") attrs.push(`data-position="${widgetPosition}"`)
    if (widgetButtonText !== "Agendar") attrs.push(`data-button-text="${widgetButtonText}"`)
    if (widgetWidth !== "400") attrs.push(`data-width="${widgetWidth}"`)
    if (widgetHeight !== "620") attrs.push(`data-height="${widgetHeight}"`)

    if (widgetPosition === "inline") {
      return `<div id="voxclinic-booking"></div>\n<script\n  ${attrs.join("\n  ")}\n  data-target="voxclinic-booking"\n></script>`
    }

    return `<script\n  ${attrs.join("\n  ")}\n></script>`
  }, [token, widgetColor, widgetPosition, widgetButtonText, widgetWidth, widgetHeight, baseUrl])

  const compactUrl = `${baseUrl}/booking/${token}?mode=compact&color=${encodeURIComponent(widgetColor)}`

  function handleCopy() {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    toast.success("Codigo copiado!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Code2 className="size-4 text-vox-primary" />
          Widget para seu site
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Incorpore o agendamento diretamente no site da sua clinica. Pacientes agendam sem sair da pagina.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Options */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Cor do widget</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={widgetColor}
                onChange={(e) => setWidgetColor(e.target.value)}
                className="h-10 w-12 rounded-lg border border-input cursor-pointer"
              />
              <Input
                value={widgetColor}
                onChange={(e) => setWidgetColor(e.target.value)}
                className="rounded-xl text-sm font-mono"
                maxLength={7}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Posicao</Label>
            <select
              value={widgetPosition}
              onChange={(e) => setWidgetPosition(e.target.value)}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vox-primary/30"
            >
              {POSITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Texto do botao</Label>
            <Input
              value={widgetButtonText}
              onChange={(e) => setWidgetButtonText(e.target.value)}
              className="rounded-xl text-sm"
              placeholder="Agendar"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tamanho do popup (largura x altura)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={widgetWidth}
                onChange={(e) => setWidgetWidth(e.target.value)}
                className="rounded-xl text-sm"
                min={300}
                max={600}
              />
              <span className="text-xs text-muted-foreground">x</span>
              <Input
                type="number"
                value={widgetHeight}
                onChange={(e) => setWidgetHeight(e.target.value)}
                className="rounded-xl text-sm"
                min={400}
                max={900}
              />
            </div>
          </div>
        </div>

        {/* Code snippet */}
        <div className="space-y-2">
          <Label className="text-xs">Codigo de incorporacao</Label>
          <div className="relative">
            <pre className="rounded-xl border border-border/50 bg-muted/30 p-4 text-xs font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap break-all">
              {embedCode}
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 rounded-lg gap-1.5 h-8"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-vox-success" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  Copiar
                </>
              )}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Cole este codigo antes do {'</body>'} no HTML do seu site.
          </p>
        </div>

        {/* Preview toggle */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="size-3.5" />
            {showPreview ? "Ocultar preview" : "Ver preview"}
          </Button>

          {showPreview && (
            <div className="rounded-xl border border-border/50 overflow-hidden bg-white">
              <div className="flex items-center justify-between bg-muted/30 px-3 py-2 border-b border-border/30">
                <span className="text-[11px] text-muted-foreground font-medium">Preview do widget (modo compacto)</span>
              </div>
              <iframe
                src={compactUrl}
                className="w-full border-none"
                style={{ height: "500px" }}
                title="Preview do widget de agendamento"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
