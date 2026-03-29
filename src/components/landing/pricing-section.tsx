"use client"

import { useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { BlurFade } from "@/components/ui/blur-fade"

const plans = [
  {
    name: "Grátis",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "Até 30 pacientes",
      "1 agenda",
      "Gravação e transcrição IA",
      "Prontuário completo",
      "1 usuário",
    ],
    cta: "Começar grátis",
    ctaHref: "/sign-up",
    variant: "outline" as const,
    highlighted: false,
  },
  {
    name: "Profissional",
    monthlyPrice: 97,
    annualPrice: 77,
    features: [
      "Pacientes ilimitados",
      "Agendas ilimitadas",
      "Tudo do Grátis +",
      "Prescrição com assinatura digital",
      "Agendamento online",
      "WhatsApp Business",
      "NFS-e e TISS",
      "Financeiro completo",
      "Até 5 usuários",
    ],
    cta: "Começar teste grátis",
    ctaHref: "/sign-up",
    variant: "filled" as const,
    highlighted: true,
  },
  {
    name: "Clínica",
    monthlyPrice: 197,
    annualPrice: 157,
    features: [
      "Tudo do Profissional +",
      "Usuários ilimitados",
      "Teleconsulta",
      "Estoque",
      "Comissões",
      "Suporte prioritário",
    ],
    cta: "Falar com vendas",
    ctaHref: "/contato",
    variant: "outline" as const,
    highlighted: false,
  },
]

function formatPrice(value: number) {
  if (value === 0) return "R$ 0"
  return `R$ ${value}`
}

export function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <BlurFade inView>
          <div className="text-center mb-10">
            <p className="text-[12px] font-medium text-vox-primary tracking-widest uppercase mb-3">Planos</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
              Preços simples e transparentes
            </h2>
            <p className="text-[15px] text-zinc-500">
              Comece grátis. Evolua quando precisar.
            </p>
          </div>
        </BlurFade>

        {/* Toggle */}
        <BlurFade inView delay={0.05}>
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className={`text-[13px] font-medium ${!annual ? "text-white" : "text-zinc-600"}`}>
              Mensal
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={annual}
              onClick={() => setAnnual(!annual)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                annual ? "bg-vox-primary" : "bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
                  annual ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className={`text-[13px] font-medium ${annual ? "text-white" : "text-zinc-600"}`}>
              Anual
            </span>
            {annual && (
              <span className="text-[11px] rounded bg-emerald-500/10 text-emerald-400 font-medium px-2 py-0.5">
                -20%
              </span>
            )}
          </div>
        </BlurFade>

        <div className="grid md:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
          {plans.map((plan, i) => {
            const price = annual ? plan.annualPrice : plan.monthlyPrice
            return (
              <BlurFade key={plan.name} inView delay={0.1 * i}>
                <div className={`bg-[#09090b] p-6 md:p-8 flex flex-col h-full ${
                  plan.highlighted ? "bg-white/[0.02]" : ""
                }`}>
                  {plan.highlighted && (
                    <span className="inline-flex self-start items-center rounded bg-vox-primary/10 text-vox-primary text-[11px] font-medium px-2 py-0.5 mb-4">
                      Mais popular
                    </span>
                  )}

                  <h3 className="text-[15px] font-semibold text-white mb-1">{plan.name}</h3>

                  <div className="mb-6">
                    <span className="text-3xl font-bold text-white tabular-nums">
                      {formatPrice(price)}
                    </span>
                    <span className="text-[13px] text-zinc-600">/mês</span>
                  </div>

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-[13px] text-zinc-400"
                      >
                        <Check className="size-3.5 text-vox-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.ctaHref}
                    className={`inline-flex items-center justify-center rounded-lg h-9 px-4 text-[13px] font-medium transition-colors ${
                      plan.variant === "filled"
                        ? "bg-white text-zinc-900 hover:bg-zinc-200"
                        : "border border-white/[0.1] text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </BlurFade>
            )
          })}
        </div>
      </div>
    </section>
  )
}
