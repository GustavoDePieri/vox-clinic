"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import {
  Calendar,
  FileText,
  Mic,
  User,
  ClipboardList,
  Pill,
  FileImage,
  Camera,
} from "lucide-react"
import type { PatientData, CustomFieldDef, AnamnesisQuestionDef } from "./tabs/types"

export type { PatientData, CustomFieldDef, AnamnesisQuestionDef }

const ResumoTab = dynamic(() => import("./tabs/resumo-tab"), { ssr: false })
const HistoricoTab = dynamic(() => import("./tabs/historico-tab"), { ssr: false })
const TratamentosTab = dynamic(() => import("./tabs/tratamentos-tab"), { ssr: false })
const PrescricoesTab = dynamic(() => import("./tabs/prescricoes-tab"), { ssr: false })
const DocumentosTab = dynamic(() => import("./tabs/documentos-tab"), { ssr: false })
const GravacoesTab = dynamic(() => import("./tabs/gravacoes-tab"), { ssr: false })
const FormulariosTab = dynamic(() => import("./tabs/formularios-tab"), { ssr: false })
const ImagensTab = dynamic(() => import("./tabs/imagens-tab"), { ssr: false })

const tabs = [
  { id: "resumo" as const, label: "Resumo", icon: User },
  { id: "historico" as const, label: "Historico", icon: Calendar },
  { id: "tratamentos" as const, label: "Tratamentos", icon: ClipboardList },
  { id: "prescricoes" as const, label: "Prescricoes", icon: Pill },
  { id: "documentos" as const, label: "Documentos", icon: FileImage },
  { id: "imagens" as const, label: "Imagens", icon: Camera },
  { id: "gravacoes" as const, label: "Gravacoes", icon: Mic },
  { id: "formularios" as const, label: "Formularios", icon: FileText },
]

type TabId = "resumo" | "historico" | "tratamentos" | "prescricoes" | "documentos" | "imagens" | "gravacoes" | "formularios"

export function PatientTabs({ patient, customFields, anamnesisTemplate }: { patient: PatientData; customFields?: CustomFieldDef[]; anamnesisTemplate?: AnamnesisQuestionDef[] }) {
  const [activeTab, setActiveTab] = useState<TabId>("resumo")

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl bg-muted p-1 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Abas do paciente">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id={`panel-${activeTab}`} aria-label={tabs.find(t => t.id === activeTab)?.label}>
        {activeTab === "resumo" && <ResumoTab patient={patient} customFields={customFields} />}
        {activeTab === "historico" && <HistoricoTab appointments={patient.appointments} patientId={patient.id} />}
        {activeTab === "tratamentos" && <TratamentosTab patientId={patient.id} />}
        {activeTab === "prescricoes" && <PrescricoesTab patientId={patient.id} />}
        {activeTab === "documentos" && <DocumentosTab patientId={patient.id} />}
        {activeTab === "imagens" && <ImagensTab patientId={patient.id} />}
        {activeTab === "gravacoes" && <GravacoesTab recordings={patient.recordings} />}
        {activeTab === "formularios" && <FormulariosTab patient={patient} anamnesisTemplate={anamnesisTemplate} />}
      </div>
    </div>
  )
}
