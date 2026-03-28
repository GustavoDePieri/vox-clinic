"use client"

import Link from "next/link"
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text"
import { WordRotate } from "@/components/ui/word-rotate"
import { TypingAnimation } from "@/components/ui/typing-animation"
import { BlurFade } from "@/components/ui/blur-fade"
import { BorderBeam } from "@/components/ui/border-beam"
import { DotPattern } from "@/components/ui/dot-pattern"
import { ChevronRight, Mic, Users, Calendar, BarChart3 } from "lucide-react"

function DashboardMockup() {
  return (
    <div className="w-full bg-[#0c1117] text-white p-4 space-y-4 select-none" style={{ minHeight: 340 }}>
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-vox-primary flex items-center justify-center text-[8px] font-bold">V</div>
          <span className="text-[10px] font-semibold opacity-80">VoxClinic</span>
          <span className="text-[9px] opacity-40 ml-1">clínica exemplo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-24 rounded-lg bg-white/5 border border-white/10 flex items-center px-2">
            <span className="text-[8px] opacity-30">Buscar...</span>
          </div>
          <div className="size-6 rounded-full bg-vox-primary/20" />
        </div>
      </div>

      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="hidden sm:flex flex-col gap-1.5 w-28 shrink-0">
          {[
            { icon: BarChart3, label: "Dashboard", active: true },
            { icon: Users, label: "Pacientes", active: false },
            { icon: Calendar, label: "Agenda", active: false },
            { icon: Mic, label: "Consulta", active: false },
          ].map((item) => (
            <div key={item.label} className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[9px] ${item.active ? "bg-vox-primary/15 text-vox-primary font-medium" : "opacity-40"}`}>
              <item.icon className="size-3" />
              {item.label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-3">
          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Pacientes", value: "847", color: "text-vox-primary" },
              { label: "Este Mês", value: "124", color: "text-emerald-400" },
              { label: "Agendados", value: "18", color: "text-white" },
              { label: "Gravações", value: "1.2k", color: "text-vox-primary" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2">
                <p className="text-[7px] uppercase tracking-wider opacity-40">{kpi.label}</p>
                <p className={`text-sm font-bold ${kpi.color} tabular-nums`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <p className="text-[8px] font-medium opacity-60 mb-2">Receita Mensal</p>
            <div className="flex items-end gap-[3px] h-16">
              {[20, 35, 28, 42, 38, 55, 48, 62, 58, 70, 65, 82].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm bg-vox-primary/60 transition-all" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2 space-y-1.5">
            <p className="text-[8px] font-medium opacity-60">Agenda de Hoje</p>
            {[
              { time: "09:00", name: "Maria Silva", proc: "Limpeza" },
              { time: "10:30", name: "João Santos", proc: "Retorno" },
              { time: "14:00", name: "Ana Costa", proc: "Avaliação" },
            ].map((apt) => (
              <div key={apt.time} className="flex items-center gap-2 rounded-md bg-white/[0.02] px-2 py-1">
                <span className="text-[8px] text-vox-primary font-mono tabular-nums">{apt.time}</span>
                <div className="size-4 rounded-full bg-vox-primary/20 flex items-center justify-center text-[6px] font-bold text-vox-primary">{apt.name[0]}</div>
                <span className="text-[8px] opacity-70 flex-1 truncate">{apt.name}</span>
                <span className="text-[7px] rounded-full bg-vox-primary/10 text-vox-primary px-1.5 py-0.5">{apt.proc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface HeroSectionProps {
  isAuthenticated?: boolean
  dashboardUrl?: string
}

export function HeroSection({ isAuthenticated = false, dashboardUrl = "/dashboard" }: HeroSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-28">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left column — text */}
        <div className="space-y-6">
          <BlurFade delay={0} inView>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm">
              <ChevronRight className="size-3.5 text-vox-primary" />
              <AnimatedGradientText colorFrom="#14B8A6" colorTo="#0D9488">
                CRM com Inteligência Artificial
              </AnimatedGradientText>
            </div>
          </BlurFade>

          <BlurFade delay={0.1} inView>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Fale.{" "}
              <br className="hidden sm:block" />
              A <span className="text-vox-primary">IA</span> organiza.
            </h1>
          </BlurFade>

          <BlurFade delay={0.2} inView>
            <div className="flex flex-wrap items-center gap-x-2 text-xl md:text-2xl text-muted-foreground">
              <span>O CRM inteligente para</span>
              <WordRotate
                words={["dentistas", "médicos", "nutricionistas", "esteticistas", "advogados"]}
                className="text-vox-primary font-bold text-xl md:text-2xl"
                duration={2500}
              />
            </div>
          </BlurFade>

          <BlurFade delay={0.3} inView>
            <div className="rounded-xl bg-muted/50 border border-border/60 p-4">
              <TypingAnimation
                duration={40}
                className="text-sm text-muted-foreground font-mono leading-relaxed"
                showCursor
                cursorStyle="line"
              >
                Paciente Maria Silva, 34 anos, retorno de limpeza periodontal. Sem queixas. Gengiva com boa cicatrização...
              </TypingAnimation>
            </div>
          </BlurFade>

          <BlurFade delay={0.4} inView>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={isAuthenticated ? dashboardUrl : "/sign-up"}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-vox-primary px-8 text-sm font-medium text-white hover:bg-vox-primary/90 transition-colors active:scale-[0.98]"
              >
                {isAuthenticated ? "Ir para o Dashboard" : "Começar Grátis"}
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-8 text-sm font-medium hover:bg-muted transition-colors active:scale-[0.98]"
              >
                Ver como funciona
              </a>
            </div>
          </BlurFade>

          <BlurFade delay={0.5} inView>
            <p className="text-xs text-muted-foreground">
              Comece grátis. Sem cartão de crédito.
            </p>
          </BlurFade>
        </div>

        {/* Right column — visual */}
        <BlurFade delay={0.3} inView>
          <div className="relative">
            <DotPattern
              className="opacity-20 [mask-image:radial-gradient(400px_circle_at_center,white,transparent)]"
              cr={1}
              width={20}
              height={20}
            />
            <div className="relative rounded-xl overflow-hidden shadow-2xl">
              <BorderBeam
                colorFrom="#14B8A6"
                colorTo="#0D9488"
                size={200}
                duration={8}
                borderWidth={2}
              />
              {/* Browser chrome + CSS mockup */}
              <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-[#0c1117]">
                {/* Browser top bar */}
                <div className="flex items-center gap-2 bg-[#161b22] border-b border-white/[0.06] px-3 py-2">
                  <div className="flex gap-1.5">
                    <div className="size-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="size-2.5 rounded-full bg-[#febc2e]" />
                    <div className="size-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex-1 mx-8">
                    <div className="h-5 rounded-md bg-white/[0.06] flex items-center justify-center">
                      <span className="text-[9px] text-white/30">app.voxclinic.com</span>
                    </div>
                  </div>
                </div>
                <DashboardMockup />
              </div>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  )
}
