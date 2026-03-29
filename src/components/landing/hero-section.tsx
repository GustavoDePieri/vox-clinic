"use client"

import Link from "next/link"
import { BlurFade } from "@/components/ui/blur-fade"
import { BorderBeam } from "@/components/ui/border-beam"
import {
  Mic,
  Users,
  Calendar,
  BarChart3,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react"

function DashboardMockup() {
  return (
    <div className="w-full bg-[#0c0c0e] text-white p-4 space-y-3 select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-md bg-vox-primary flex items-center justify-center text-[7px] font-bold">V</div>
          <span className="text-[10px] font-medium text-zinc-300">VoxClinic</span>
        </div>
        <div className="h-5 w-28 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center px-2">
          <span className="text-[8px] text-zinc-600">Buscar paciente...</span>
        </div>
      </div>

      <div className="flex gap-3">
        {/* Sidebar */}
        <div className="hidden sm:flex flex-col gap-1 w-24 shrink-0">
          {[
            { icon: BarChart3, label: "Dashboard", active: true },
            { icon: Users, label: "Pacientes" },
            { icon: Calendar, label: "Agenda" },
            { icon: Mic, label: "Consulta" },
          ].map((item) => (
            <div key={item.label} className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[8px] ${
              item.active ? "bg-vox-primary/10 text-vox-primary font-medium" : "text-zinc-600"
            }`}>
              <item.icon className="size-3" />
              {item.label}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 space-y-2.5">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "Pacientes", value: "847", trend: "+12%" },
              { label: "Este mês", value: "124", trend: "+8%" },
              { label: "Agendados", value: "18", trend: "hoje" },
              { label: "Gravações", value: "1.2k", trend: "+23%" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-md bg-white/[0.02] border border-white/[0.05] p-2">
                <p className="text-[6px] uppercase tracking-widest text-zinc-600">{kpi.label}</p>
                <p className="text-[13px] font-semibold text-white tabular-nums mt-0.5">{kpi.value}</p>
                <p className="text-[6px] text-emerald-500 mt-0.5">{kpi.trend}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-md bg-white/[0.02] border border-white/[0.05] p-2.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[7px] font-medium text-zinc-500">Receita mensal</p>
              <p className="text-[7px] text-emerald-500">+18% vs mês anterior</p>
            </div>
            <div className="flex items-end gap-[2px] h-10">
              {[20, 35, 28, 42, 38, 55, 48, 62, 58, 70, 65, 82].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all"
                  style={{
                    height: `${h}%`,
                    backgroundColor: i === 11 ? "rgb(20,184,166)" : "rgba(20,184,166,0.3)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="rounded-md bg-white/[0.02] border border-white/[0.05] p-2 space-y-1">
            <p className="text-[7px] font-medium text-zinc-500">Hoje</p>
            {[
              { time: "09:00", name: "Maria Silva", tag: "Limpeza" },
              { time: "10:30", name: "João Santos", tag: "Retorno" },
              { time: "14:00", name: "Ana Costa", tag: "Avaliação" },
            ].map((apt) => (
              <div key={apt.time} className="flex items-center gap-2 rounded bg-white/[0.02] px-2 py-1">
                <span className="text-[7px] text-zinc-500 font-mono tabular-nums w-8">{apt.time}</span>
                <span className="text-[8px] text-zinc-300 flex-1 truncate">{apt.name}</span>
                <span className="text-[6px] rounded bg-vox-primary/10 text-vox-primary px-1.5 py-0.5">{apt.tag}</span>
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
    <section className="relative overflow-hidden">
      {/* Subtle gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,_rgba(20,184,166,0.06)_0%,_transparent_70%)]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-20 md:pt-28 pb-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Badge */}
          <BlurFade delay={0.05} inView>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[12px] text-zinc-400">
              <Zap className="size-3 text-vox-primary" />
              IA que preenche prontuários pela voz
            </div>
          </BlurFade>

          {/* Headline */}
          <BlurFade delay={0.1} inView>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.08]">
              O CRM clínico que{" "}
              <span className="text-vox-primary">escuta</span>{" "}
              você
            </h1>
          </BlurFade>

          {/* Sub */}
          <BlurFade delay={0.15} inView>
            <p className="max-w-xl mx-auto text-base md:text-lg text-zinc-400 leading-relaxed">
              Fale durante a consulta. O VoxClinic transcreve, extrai dados clínicos e preenche o prontuário. Você só revisa e confirma.
            </p>
          </BlurFade>

          {/* CTAs */}
          <BlurFade delay={0.2} inView>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href={isAuthenticated ? dashboardUrl : "/sign-up"}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-6 text-[14px] font-medium text-zinc-900 hover:bg-zinc-200 transition-colors gap-2"
              >
                {isAuthenticated ? "Ir para o Dashboard" : "Começar grátis"}
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/[0.1] px-6 text-[14px] text-zinc-300 hover:bg-white/[0.04] transition-colors"
              >
                Como funciona
              </a>
            </div>
          </BlurFade>

          {/* Trust */}
          <BlurFade delay={0.25} inView>
            <div className="flex items-center justify-center gap-6 pt-2 text-[12px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Shield className="size-3 text-zinc-600" />
                LGPD compliant
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <Shield className="size-3 text-zinc-600" />
                Dados no Brasil
              </span>
              <span>14 dias grátis</span>
              <span>Sem cartão</span>
            </div>
          </BlurFade>
        </div>
      </div>

      {/* Product mockup */}
      <div className="relative max-w-4xl mx-auto px-6 pb-20 md:pb-28">
        <BlurFade delay={0.3} inView>
          <div className="relative">
            <div className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-[#0c0c0e] shadow-2xl shadow-black/40">
              <BorderBeam
                colorFrom="#14B8A6"
                colorTo="#0D9488"
                size={150}
                duration={10}
                borderWidth={1}
              />
              {/* Browser bar */}
              <div className="flex items-center gap-2 bg-[#111113] border-b border-white/[0.05] px-3 py-2">
                <div className="flex gap-1.5">
                  <div className="size-2 rounded-full bg-zinc-700" />
                  <div className="size-2 rounded-full bg-zinc-700" />
                  <div className="size-2 rounded-full bg-zinc-700" />
                </div>
                <div className="flex-1 mx-8">
                  <div className="h-4 rounded bg-white/[0.04] flex items-center justify-center">
                    <span className="text-[8px] text-zinc-600">app.voxclinic.com</span>
                  </div>
                </div>
              </div>
              <DashboardMockup />
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  )
}
