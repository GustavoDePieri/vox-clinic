"use client"

import { Shield, Globe, FileCheck, Building2, PenTool, Cloud } from "lucide-react"
import { BlurFade } from "@/components/ui/blur-fade"

const securityCards = [
  {
    icon: Shield,
    title: "AES-256",
    description: "Criptografia em repouso e em trânsito",
  },
  {
    icon: Globe,
    title: "Dados no Brasil",
    description: "Servidores em São Paulo (sa-east-1)",
  },
  {
    icon: FileCheck,
    title: "LGPD",
    description: "Consentimento, auditoria, DPO, exclusão",
  },
  {
    icon: Building2,
    title: "CFM 1.821",
    description: "Prontuário conforme Conselho Federal de Medicina",
  },
  {
    icon: PenTool,
    title: "ICP-Brasil",
    description: "Prescrições com assinatura digital válida",
  },
  {
    icon: Cloud,
    title: "Backup 20 anos",
    description: "Backup diário com retenção conforme CFM",
  },
]

export function SecuritySection() {
  return (
    <section id="seguranca" className="py-24 md:py-32 border-y border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-6">
        <BlurFade inView delay={0.05}>
          <div className="text-center mb-14">
            <p className="text-[12px] font-medium text-vox-primary tracking-widest uppercase mb-3">Segurança & Compliance</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Infraestrutura enterprise-grade
            </h2>
            <p className="mt-3 text-[15px] text-zinc-500 max-w-lg mx-auto">
              Padrões internacionais de segurança. Dados sempre no Brasil.
            </p>
          </div>
        </BlurFade>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
          {securityCards.map((card, i) => (
            <BlurFade key={card.title} inView delay={0.05 * (i + 1)}>
              <div className="bg-[#09090b] p-6 h-full">
                <div className="flex size-9 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] mb-4">
                  <card.icon className="size-4 text-vox-primary" />
                </div>
                <h3 className="text-[14px] font-semibold text-white mb-1">{card.title}</h3>
                <p className="text-[13px] text-zinc-500 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  )
}
