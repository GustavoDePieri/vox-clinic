"use client"

import { Shield, Lock, FileSearch, Timer, Database, Eye, KeyRound } from "lucide-react"
import { BlurFade } from "@/components/ui/blur-fade"

const trustPoints = [
  {
    icon: Shield,
    text: "Dados armazenados no Brasil (sa-east-1)",
  },
  {
    icon: Lock,
    text: "Consentimento LGPD obrigatorio antes de gravar",
  },
  {
    icon: FileSearch,
    text: "Auditoria completa de todas as acoes",
  },
  {
    icon: Timer,
    text: "URLs de audio com expiracao de 5 minutos",
  },
]

function SecurityVisual() {
  const orbitItems = [
    { icon: Lock, label: "LGPD", angle: 0 },
    { icon: Database, label: "sa-east-1", angle: 72 },
    { icon: Eye, label: "Auditoria", angle: 144 },
    { icon: KeyRound, label: "Criptografia", angle: 216 },
    { icon: Timer, label: "URLs 5min", angle: 288 },
  ]

  return (
    <div className="relative aspect-square max-w-[360px] mx-auto">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-vox-primary/20 animate-[spin_30s_linear_infinite]" />
      {/* Inner ring */}
      <div className="absolute inset-8 rounded-full border border-vox-primary/10" />
      {/* Center shield */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-vox-primary/20 to-vox-primary/5 shadow-lg shadow-vox-primary/10">
          <Shield className="size-10 text-vox-primary" />
        </div>
      </div>
      {/* Orbiting items */}
      {orbitItems.map((item) => {
        const rad = (item.angle * Math.PI) / 180
        const radius = 44 // percentage from center
        const x = 50 + radius * Math.cos(rad)
        const y = 50 + radius * Math.sin(rad)
        return (
          <div
            key={item.label}
            className="absolute flex flex-col items-center gap-1"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-border/60 shadow-sm">
              <item.icon className="size-4 text-vox-primary" />
            </div>
            <span className="text-[9px] font-medium text-muted-foreground whitespace-nowrap">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export function SecuritySection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <BlurFade inView>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Seguranca e conformidade LGPD
              </h2>
              <p className="mt-3 text-muted-foreground">
                Seus dados e os dos seus pacientes protegidos por design
              </p>

              <div className="mt-8 space-y-1">
                {trustPoints.map((point) => (
                  <div
                    key={point.text}
                    className="flex items-start gap-3 py-3"
                  >
                    <point.icon className="size-5 text-vox-primary shrink-0 mt-0.5" />
                    <p className="text-sm">{point.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </BlurFade>

          <BlurFade inView delay={0.2}>
            <SecurityVisual />
          </BlurFade>
        </div>
      </div>
    </section>
  )
}
