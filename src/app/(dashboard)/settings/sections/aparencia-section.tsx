"use client"

import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Palette, Sun, Moon, Monitor, Check } from "lucide-react"

export function AparenciaSection() {
  const { theme, setTheme } = useTheme()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="size-4 text-vox-primary" />
          Aparencia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tema
          </Label>
          <p className="mt-0.5 mb-3 text-xs text-muted-foreground/70">
            Escolha como o VoxClinic aparece para voce
          </p>
          <div className="grid grid-cols-3 gap-3">
            {/* Light */}
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`group relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${
                theme === "light"
                  ? "border-vox-primary bg-vox-primary/[0.04] shadow-sm"
                  : "border-border/50 hover:border-border"
              }`}
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-white border shadow-sm">
                <Sun className="size-5 text-amber-400" />
              </div>
              <span className="text-xs font-medium">Claro</span>
              {theme === "light" && (
                <div className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-vox-primary text-white shadow-sm animate-scale-in">
                  <Check className="size-3" strokeWidth={3} />
                </div>
              )}
            </button>

            {/* Dark */}
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`group relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${
                theme === "dark"
                  ? "border-vox-primary bg-vox-primary/[0.04] shadow-sm"
                  : "border-border/50 hover:border-border"
              }`}
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-gray-900 border border-gray-700 shadow-sm">
                <Moon className="size-5 text-teal-300" />
              </div>
              <span className="text-xs font-medium">Escuro</span>
              {theme === "dark" && (
                <div className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-vox-primary text-white shadow-sm animate-scale-in">
                  <Check className="size-3" strokeWidth={3} />
                </div>
              )}
            </button>

            {/* System */}
            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`group relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${
                theme === "system"
                  ? "border-vox-primary bg-vox-primary/[0.04] shadow-sm"
                  : "border-border/50 hover:border-border"
              }`}
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-white to-gray-900 border shadow-sm">
                <Monitor className="size-5 text-white mix-blend-difference" />
              </div>
              <span className="text-xs font-medium">Sistema</span>
              {theme === "system" && (
                <div className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-vox-primary text-white shadow-sm animate-scale-in">
                  <Check className="size-3" strokeWidth={3} />
                </div>
              )}
            </button>
          </div>
        </div>

        <Separator />

        {/* Brand color preview */}
        <div>
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Cores do Sistema
          </Label>
          <p className="mt-0.5 mb-3 text-xs text-muted-foreground/70">
            Paleta de cores utilizada no VoxClinic
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-2.5 rounded-xl border border-border/50 p-3">
              <div className="size-8 rounded-lg bg-vox-primary shadow-sm shadow-vox-primary/20" />
              <div>
                <p className="text-xs font-medium">Primary</p>
                <p className="text-[10px] text-muted-foreground font-mono">#14B8A6</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-border/50 p-3">
              <div className="size-8 rounded-lg bg-vox-success shadow-sm shadow-vox-success/20" />
              <div>
                <p className="text-xs font-medium">Sucesso</p>
                <p className="text-[10px] text-muted-foreground font-mono">#10B981</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-border/50 p-3">
              <div className="size-8 rounded-lg bg-vox-warning shadow-sm shadow-vox-warning/20" />
              <div>
                <p className="text-xs font-medium">Alerta</p>
                <p className="text-[10px] text-muted-foreground font-mono">#F59E0B</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-border/50 p-3">
              <div className="size-8 rounded-lg bg-vox-error shadow-sm shadow-vox-error/20" />
              <div>
                <p className="text-xs font-medium">Erro</p>
                <p className="text-[10px] text-muted-foreground font-mono">#EF4444</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
