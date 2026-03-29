"use client"

import { BlurFade } from "@/components/ui/blur-fade"
import { NumberTicker } from "@/components/ui/number-ticker"

const stats = [
  { value: 500, suffix: "+", label: "Profissionais ativos" },
  { value: 100, suffix: "k+", label: "Consultas processadas" },
  { value: 50, suffix: "k+", label: "Prontuários gerados" },
  { value: 99.9, suffix: "%", label: "Uptime", decimals: 1 },
]

export function SocialProofBar() {
  return (
    <section className="border-y border-white/[0.06] py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <BlurFade key={stat.label} delay={0.05 * i} inView>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold tracking-tight text-white tabular-nums">
                  <NumberTicker
                    value={stat.value}
                    decimalPlaces={stat.decimals ?? 0}
                    className="text-2xl md:text-3xl font-bold text-white"
                  />
                  <span className="text-zinc-500">{stat.suffix}</span>
                </div>
                <p className="text-[12px] text-zinc-500 mt-1">{stat.label}</p>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  )
}
