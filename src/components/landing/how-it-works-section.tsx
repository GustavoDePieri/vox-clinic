"use client"

import { Mic, ScanSearch, CheckCircle } from "lucide-react"
import { BlurFade } from "@/components/ui/blur-fade"

const steps = [
  {
    number: "01",
    title: "Grave",
    description: "Fale normalmente durante a consulta. O VoxClinic captura e transcreve em tempo real com Whisper.",
    icon: Mic,
  },
  {
    number: "02",
    title: "Revise",
    description: "A IA extrai diagnósticos, medicamentos, procedimentos e CIDs. Você revisa antes de salvar.",
    icon: ScanSearch,
  },
  {
    number: "03",
    title: "Pronto",
    description: "Prontuário preenchido. Prescrição gerada. Próximo paciente.",
    icon: CheckCircle,
  },
]

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <BlurFade delay={0.05} inView>
          <div className="text-center mb-16">
            <p className="text-[12px] font-medium text-vox-primary tracking-widest uppercase mb-3">Como funciona</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Três passos. Zero digitação.
            </h2>
          </div>
        </BlurFade>

        <div className="grid md:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
          {steps.map((step, i) => (
            <BlurFade key={step.number} delay={0.1 + i * 0.08} inView>
              <div className="bg-[#09090b] p-8 md:p-10 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[12px] font-mono text-zinc-600 tabular-nums">{step.number}</span>
                  <div className="size-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <step.icon className="size-4 text-vox-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-[14px] text-zinc-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  )
}
