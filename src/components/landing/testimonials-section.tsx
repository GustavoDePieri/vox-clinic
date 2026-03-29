"use client"

import { BlurFade } from "@/components/ui/blur-fade"
import { Marquee } from "@/components/ui/marquee"

const testimonials = [
  {
    quote: "Economizo 40 minutos por dia só com a transcrição automática. Minha rotina mudou completamente.",
    name: "Dra. Ana Beatriz Ferreira",
    role: "Dermatologista",
  },
  {
    quote: "O agendamento online reduziu as faltas em 60%. Os lembretes por WhatsApp são um diferencial enorme.",
    name: "Dr. Carlos Eduardo Mendes",
    role: "Nutricionista",
  },
  {
    quote: "Finalmente um sistema que entende vocabulário médico em português. A IA extrai CID e medicações sem eu digitar nada.",
    name: "Dra. Juliana Costa Ribeiro",
    role: "Clínica Geral",
  },
  {
    quote: "A prescrição digital com assinatura ICP-Brasil simplificou muito meu fluxo. Antes eu perdia tempo com papel e carimbo.",
    name: "Dr. Rafael Lima Santos",
    role: "Ortopedista",
  },
  {
    quote: "Migrei de outro sistema em uma tarde. O import por CSV trouxe 2.000 pacientes sem perder dados.",
    name: "Dra. Fernanda Oliveira",
    role: "Dentista",
  },
  {
    quote: "O financeiro integrado me dá uma visão clara de receita, inadimplência e comissões. Não preciso mais de planilha.",
    name: "Dr. Pedro Henrique Santos",
    role: "Fisioterapeuta",
  },
]

function getInitials(name: string) {
  return name
    .replace(/^(Dra?\.\s*)/, "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

function TestimonialCard({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <div className="w-[300px] shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-[13px] text-zinc-400 leading-relaxed line-clamp-3 mb-4">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-white/[0.04] text-[11px] font-medium text-zinc-400">
          {getInitials(name)}
        </div>
        <div>
          <p className="text-[13px] font-medium text-zinc-200">{name}</p>
          <p className="text-[11px] text-zinc-600">{role}</p>
        </div>
      </div>
    </div>
  )
}

const firstRow = testimonials.slice(0, 3)
const secondRow = testimonials.slice(3, 6)

export function TestimonialsSection() {
  return (
    <section className="py-24 md:py-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 mb-14">
        <BlurFade inView>
          <div className="text-center">
            <p className="text-[12px] font-medium text-vox-primary tracking-widest uppercase mb-3">Depoimentos</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Profissionais que economizam horas por semana
            </h2>
          </div>
        </BlurFade>
      </div>

      <div className="space-y-3">
        <Marquee pauseOnHover className="[--duration:40s]">
          {firstRow.map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </Marquee>
        <Marquee pauseOnHover reverse className="[--duration:40s]">
          {secondRow.map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </Marquee>
      </div>
    </section>
  )
}
