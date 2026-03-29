"use client"

import { useState } from "react"
import {
  Mic,
  MicOff,
  FileText,
  Database,
  CheckCircle2,
  ClipboardList,
  History,
  Stethoscope,
  Pill,
  FolderOpen,
  Camera,
  AudioLines,
  FileSpreadsheet,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageCircle,
  Send,
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  BarChart3,
  Phone,
  Video,
  Star,
  Mail,
} from "lucide-react"
import { BlurFade } from "@/components/ui/blur-fade"

/* ─── Mockup shell ─── */

function MockupShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full rounded-xl border border-white/[0.06] overflow-hidden bg-[#0c0c0e] text-white select-none">
      <div className="flex items-center gap-2 bg-[#111113] border-b border-white/[0.05] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="size-2 rounded-full bg-zinc-700" />
          <div className="size-2 rounded-full bg-zinc-700" />
          <div className="size-2 rounded-full bg-zinc-700" />
        </div>
        <div className="flex-1 mx-6">
          <div className="h-4 rounded bg-white/[0.04] flex items-center justify-center">
            <span className="text-[8px] text-zinc-600">app.voxclinic.com</span>
          </div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

/* ─── [01] IA de Voz mockups ─── */

function GravacaoMockup() {
  return (
    <MockupShell>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-md bg-vox-primary/15 flex items-center justify-center">
            <Mic className="size-3 text-vox-primary" />
          </div>
          <span className="text-[10px] font-medium text-zinc-300">Gravando consulta...</span>
          <span className="ml-auto text-[9px] font-mono text-red-400 tabular-nums">02:34</span>
          <div className="size-2 rounded-full bg-red-500 animate-pulse" />
        </div>
        <div className="flex items-center justify-center gap-[2px] h-16 px-2">
          {[20, 45, 30, 60, 25, 70, 40, 55, 35, 65, 28, 50, 38, 72, 22, 58, 42, 68, 32, 52, 48, 62, 30, 55, 40, 70, 35, 45, 60, 25].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-vox-primary/60"
              style={{ height: `${h}%`, opacity: i > 22 ? 0.2 : 1 }}
            />
          ))}
        </div>
        <div className="flex items-center justify-center">
          <button className="size-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <MicOff className="size-4 text-red-400" />
          </button>
        </div>
      </div>
    </MockupShell>
  )
}

function TranscricaoMockup() {
  return (
    <MockupShell>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-vox-primary" />
          <span className="text-[10px] font-medium text-zinc-300">Transcrição</span>
        </div>
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-3 space-y-2">
          <p className="text-[9px] leading-relaxed text-zinc-400">
            Paciente <span className="text-vox-primary font-medium">Maria Silva</span>, <span className="text-amber-400 font-medium">34 anos</span>, retorno de <span className="text-emerald-400 font-medium">limpeza periodontal</span>. Sem queixas. Gengiva com boa cicatrização. Orientei uso de fio dental diário e retorno em <span className="text-amber-400 font-medium">6 meses</span>.
          </p>
          <p className="text-[9px] leading-relaxed text-zinc-400">
            Pressão arterial <span className="text-emerald-400 font-medium">120/80 mmHg</span>. Prescrevi <span className="text-vox-primary font-medium">Periogard</span> por 7 dias.
          </p>
        </div>
        <div className="flex gap-1.5">
          <span className="text-[7px] rounded bg-vox-primary/10 text-vox-primary px-2 py-0.5">Paciente</span>
          <span className="text-[7px] rounded bg-amber-400/10 text-amber-400 px-2 py-0.5">Dados</span>
          <span className="text-[7px] rounded bg-emerald-400/10 text-emerald-400 px-2 py-0.5">Procedimento</span>
        </div>
      </div>
    </MockupShell>
  )
}

function ExtracaoMockup() {
  return (
    <MockupShell>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-vox-primary" />
          <span className="text-[10px] font-medium text-zinc-300">Dados extraídos pela IA</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Paciente", value: "Maria Silva" },
            { label: "Idade", value: "34 anos" },
            { label: "Procedimento", value: "Limpeza periodontal" },
            { label: "Status", value: "Retorno" },
            { label: "PA", value: "120/80 mmHg" },
            { label: "Prescrição", value: "Periogard 7d" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-2">
              <p className="text-[7px] uppercase tracking-wider text-zinc-600">{item.label}</p>
              <p className="text-[9px] font-medium text-vox-primary">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </MockupShell>
  )
}

function RevisaoMockup() {
  return (
    <MockupShell>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-vox-primary" />
          <span className="text-[10px] font-medium text-zinc-300">Revisão antes de salvar</span>
        </div>
        {[
          { label: "Queixa principal", value: "Retorno — sem queixas", ok: true },
          { label: "Procedimento", value: "Limpeza periodontal", ok: true },
          { label: "Conduta", value: "Fio dental diário, retorno 6m", ok: true },
          { label: "Prescrição", value: "Periogard 7 dias", ok: false },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.05] p-2">
            <div className={`size-4 rounded flex items-center justify-center text-[8px] ${item.ok ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
              {item.ok ? "✓" : "✎"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[7px] uppercase tracking-wider text-zinc-600">{item.label}</p>
              <p className="text-[9px] text-zinc-400 truncate">{item.value}</p>
            </div>
            {!item.ok && (
              <span className="text-[7px] rounded bg-amber-500/10 text-amber-400 px-1.5 py-0.5">Editar</span>
            )}
          </div>
        ))}
        <button className="w-full h-7 rounded-lg bg-vox-primary text-[10px] font-medium text-white">
          Confirmar e salvar
        </button>
      </div>
    </MockupShell>
  )
}

/* ─── [02] Prontuário ─── */

function ProntuarioMockup() {
  const tabs = [
    { icon: ClipboardList, label: "Resumo" },
    { icon: History, label: "Histórico" },
    { icon: Stethoscope, label: "Tratamentos" },
    { icon: Pill, label: "Prescrições" },
    { icon: FolderOpen, label: "Documentos" },
    { icon: Camera, label: "Imagens" },
    { icon: AudioLines, label: "Gravações" },
    { icon: FileSpreadsheet, label: "Formulários" },
  ]
  return (
    <MockupShell>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-vox-primary/15 flex items-center justify-center text-[10px] font-bold text-vox-primary">M</div>
          <div>
            <p className="text-[10px] font-medium text-zinc-200">Maria Silva</p>
            <p className="text-[8px] text-zinc-600">34 anos · CPF 123.456.789-00</p>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map((tab, i) => (
            <div
              key={tab.label}
              className={`flex items-center gap-1 shrink-0 rounded-md px-2 py-1.5 text-[8px] ${
                i === 0 ? "bg-vox-primary/10 text-vox-primary font-medium" : "text-zinc-600"
              }`}
            >
              <tab.icon className="size-3" />
              {tab.label}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-2">
            <p className="text-[7px] uppercase tracking-wider text-zinc-600 mb-1">Alergias</p>
            <div className="flex gap-1">
              <span className="text-[8px] rounded bg-red-500/10 text-red-400 px-2 py-0.5">Penicilina</span>
              <span className="text-[8px] rounded bg-red-500/10 text-red-400 px-2 py-0.5">Dipirona</span>
            </div>
          </div>
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-2">
            <p className="text-[7px] uppercase tracking-wider text-zinc-600 mb-1">Última consulta</p>
            <p className="text-[9px] text-zinc-400">15/03/2026 — Limpeza periodontal — Dr. João</p>
          </div>
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-2">
            <p className="text-[7px] uppercase tracking-wider text-zinc-600 mb-1">CID-10</p>
            <span className="text-[8px] rounded bg-vox-primary/10 text-vox-primary px-2 py-0.5">K05.1 — Gengivite crônica</span>
          </div>
        </div>
      </div>
    </MockupShell>
  )
}

/* ─── [03] Agenda ─── */

function AgendaMockup() {
  const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"]
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex"]
  return (
    <MockupShell>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-vox-primary" />
            <span className="text-[10px] font-medium text-zinc-300">Semana 24–28 Mar</span>
          </div>
          <div className="flex items-center gap-1">
            <ChevronLeft className="size-3 text-zinc-600" />
            <ChevronRight className="size-3 text-zinc-600" />
          </div>
        </div>
        <div className="flex gap-1">
          {["Semana", "Dia", "Mês", "Lista"].map((v, i) => (
            <span key={v} className={`text-[7px] rounded px-2 py-0.5 ${i === 0 ? "bg-vox-primary/10 text-vox-primary" : "text-zinc-600"}`}>{v}</span>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-[2px] text-[7px]">
          <div className="opacity-0">.</div>
          {days.map((d) => (
            <div key={d} className="text-center text-zinc-600 py-1">{d}</div>
          ))}
          {hours.map((h) => (
            <div key={h} className="contents">
              <div className="text-right text-zinc-700 font-mono pr-1 py-1 tabular-nums">{h}</div>
              {days.map((d) => (
                <div key={`${h}-${d}`} className="rounded bg-white/[0.01] border border-white/[0.03] py-1 min-h-[18px]">
                  {h === "09:00" && d === "Seg" && (
                    <div className="bg-vox-primary/15 text-vox-primary rounded px-0.5 text-[6px] truncate">Maria S.</div>
                  )}
                  {h === "10:00" && d === "Ter" && (
                    <div className="bg-blue-500/15 text-blue-400 rounded px-0.5 text-[6px] truncate">João P.</div>
                  )}
                  {h === "09:00" && d === "Qua" && (
                    <div className="bg-amber-500/15 text-amber-400 rounded px-0.5 text-[6px] truncate">Ana C.</div>
                  )}
                  {h === "11:00" && d === "Qui" && (
                    <div className="bg-purple-500/15 text-purple-400 rounded px-0.5 text-[6px] truncate">Pedro M.</div>
                  )}
                  {h === "08:00" && d === "Sex" && (
                    <div className="bg-emerald-500/15 text-emerald-400 rounded px-0.5 text-[6px] truncate">Carla R.</div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </MockupShell>
  )
}

/* ─── [04] Financeiro ─── */

function FinanceiroMockup() {
  return (
    <MockupShell>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="size-4 text-vox-primary" />
          <span className="text-[10px] font-medium text-zinc-300">Financeiro — Mar 2026</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Receita", value: "R$ 42.800", color: "text-emerald-400", icon: TrendingUp },
            { label: "A receber", value: "R$ 8.200", color: "text-amber-400", icon: Clock },
            { label: "Despesas", value: "R$ 12.600", color: "text-red-400", icon: CreditCard },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-2">
              <div className="flex items-center gap-1 mb-1">
                <kpi.icon className="size-2.5 text-zinc-600" />
                <p className="text-[7px] uppercase tracking-wider text-zinc-600">{kpi.label}</p>
              </div>
              <p className={`text-[11px] font-bold ${kpi.color} tabular-nums`}>{kpi.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-2">
          <p className="text-[8px] font-medium text-zinc-600 mb-2">Fluxo de caixa</p>
          <div className="flex items-end gap-[3px] h-12">
            {[35, 50, 42, 65, 55, 72, 48, 80, 60, 75, 68, 85].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-emerald-500/40" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="flex gap-1.5">
          {[
            { icon: Receipt, label: "NFS-e" },
            { icon: CreditCard, label: "Cartão" },
            { icon: BarChart3, label: "PIX" },
          ].map((m) => (
            <div key={m.label} className="flex-1 rounded-lg bg-white/[0.02] border border-white/[0.05] p-1.5 flex items-center gap-1">
              <m.icon className="size-3 text-vox-primary" />
              <span className="text-[7px] text-zinc-500">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </MockupShell>
  )
}

/* ─── [05] Comunicação ─── */

function ComunicacaoMockup() {
  return (
    <MockupShell>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-4 text-emerald-500" />
          <span className="text-[10px] font-medium text-zinc-300">WhatsApp Inbox</span>
          <span className="ml-auto text-[8px] rounded bg-emerald-500/15 text-emerald-400 px-2 py-0.5">3 novas</span>
        </div>
        <div className="space-y-1.5">
          {[
            { name: "Maria Silva", msg: "Confirmo presença amanhã 9h!", time: "10:32", unread: false },
            { name: "João Santos", msg: "Preciso remarcar minha consulta", time: "09:15", unread: true },
            { name: "Ana Costa", msg: "Obrigada pelo lembrete!", time: "Ontem", unread: false },
          ].map((conv) => (
            <div key={conv.name} className={`flex items-center gap-2 rounded-lg p-2 ${conv.unread ? "bg-emerald-500/5 border border-emerald-500/15" : "bg-white/[0.02] border border-white/[0.05]"}`}>
              <div className="size-6 rounded-full bg-emerald-500/15 flex items-center justify-center text-[8px] font-bold text-emerald-400">{conv.name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-medium text-zinc-200 truncate">{conv.name}</p>
                <p className="text-[8px] text-zinc-600 truncate">{conv.msg}</p>
              </div>
              <span className="text-[7px] text-zinc-700 shrink-0">{conv.time}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5">
          {[
            { icon: Send, label: "Lembrete" },
            { icon: Phone, label: "Ligar" },
            { icon: Video, label: "Teleconsulta" },
            { icon: Star, label: "NPS" },
            { icon: Mail, label: "E-mail" },
          ].map((a) => (
            <div key={a.label} className="flex-1 rounded-lg bg-white/[0.02] border border-white/[0.05] p-1.5 flex flex-col items-center gap-0.5">
              <a.icon className="size-3 text-vox-primary" />
              <span className="text-[6px] text-zinc-600">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </MockupShell>
  )
}

/* ─── Feature blocks ─── */

interface FeatureTab {
  label: string
  mockup: React.ReactNode
}

interface FeatureBlock {
  id: string
  number: string
  title: string
  description: string
  highlight: string
  tabs: FeatureTab[]
}

const featureBlocks: FeatureBlock[] = [
  {
    id: "ia-voz",
    number: "01",
    title: "IA de voz que entende contexto clínico",
    description:
      "Grave a consulta com um clique. O VoxClinic transcreve com Whisper, extrai dados estruturados com Claude e preenche o prontuário. Você revisa e confirma.",
    highlight: "O profissional sempre revisa antes de salvar",
    tabs: [
      { label: "Gravação", mockup: <GravacaoMockup /> },
      { label: "Transcrição", mockup: <TranscricaoMockup /> },
      { label: "Extração", mockup: <ExtracaoMockup /> },
      { label: "Revisão", mockup: <RevisaoMockup /> },
    ],
  },
  {
    id: "prontuario",
    number: "02",
    title: "Prontuário completo. 8 abas. Zero papel.",
    description:
      "Resumo, histórico, tratamentos, prescrições, documentos, imagens clínicas, gravações e formulários personalizados. Tudo em um lugar só.",
    highlight: "Templates por especialidade · CID-10 · ANVISA",
    tabs: [{ label: "Prontuário", mockup: <ProntuarioMockup /> }],
  },
  {
    id: "agenda",
    number: "03",
    title: "Agenda inteligente com agendamento online",
    description:
      "Semana, dia, mês ou lista. Arraste para reagendar. Múltiplas agendas. Widget de agendamento online. Lembretes automáticos por WhatsApp.",
    highlight: "Reduza faltas em até 40% com lembretes automáticos",
    tabs: [{ label: "Agenda", mockup: <AgendaMockup /> }],
  },
  {
    id: "financeiro",
    number: "04",
    title: "Financeiro integrado com NFS-e e TISS",
    description:
      "Contas a receber, despesas, fluxo de caixa, comissões. NFS-e em 1 clique. Guias TISS. Cobrança por PIX, boleto ou cartão via Asaas.",
    highlight: "NFS-e · TISS · PIX · Boleto · Cartão",
    tabs: [{ label: "Financeiro", mockup: <FinanceiroMockup /> }],
  },
  {
    id: "comunicacao",
    number: "05",
    title: "WhatsApp, teleconsulta e NPS integrados",
    description:
      "Inbox do WhatsApp. Lembretes com botões de confirmação. Teleconsulta com gravação. Pesquisa NPS automática.",
    highlight: "WhatsApp · Teleconsulta · NPS · E-mail",
    tabs: [{ label: "Comunicação", mockup: <ComunicacaoMockup /> }],
  },
]

/* ─── Feature block component ─── */

function FeatureBlockItem({ block, index }: { block: FeatureBlock; index: number }) {
  const [activeTab, setActiveTab] = useState(0)
  const reversed = index % 2 !== 0

  const textContent = (
    <div className="flex flex-col justify-center space-y-4">
      <span className="text-[12px] font-mono text-zinc-600 tabular-nums">{block.number}</span>
      <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight">{block.title}</h3>
      <p className="text-[15px] text-zinc-400 leading-relaxed">{block.description}</p>
      {block.tabs.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {block.tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                i === activeTab
                  ? "bg-vox-primary text-white"
                  : "bg-white/[0.04] text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      <div className="inline-flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 w-fit">
        <CheckCircle2 className="size-3.5 text-vox-primary shrink-0" />
        <span className="text-[13px] text-zinc-400">{block.highlight}</span>
      </div>
    </div>
  )

  const mockupContent = (
    <div className="w-full">{block.tabs[activeTab].mockup}</div>
  )

  return (
    <BlurFade inView delay={0.05}>
      <div id={block.id} className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {reversed ? (
          <>
            <div className="order-2 lg:order-1">{mockupContent}</div>
            <div className="order-1 lg:order-2">{textContent}</div>
          </>
        ) : (
          <>
            {textContent}
            {mockupContent}
          </>
        )}
      </div>
    </BlurFade>
  )
}

/* ─── Main section ─── */

export function FeaturesBentoSection() {
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <BlurFade inView delay={0.05}>
          <div className="text-center mb-20">
            <p className="text-[12px] font-medium text-vox-primary tracking-widest uppercase mb-3">Produto</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Tudo que sua clínica precisa
            </h2>
            <p className="mt-3 text-[15px] text-zinc-500 max-w-lg mx-auto">
              Do agendamento ao financeiro. Cada módulo foi desenhado para profissionais de saúde.
            </p>
          </div>
        </BlurFade>

        <div className="space-y-20 md:space-y-28">
          {featureBlocks.map((block, i) => (
            <FeatureBlockItem key={block.id} block={block} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
