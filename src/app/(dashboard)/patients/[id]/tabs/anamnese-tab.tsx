"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Loader2,
} from "lucide-react"
import { updatePatient } from "@/server/actions/patient"
import { toast } from "sonner"
import Link from "next/link"
import type { PatientData, AnamnesisQuestionDef } from "./types"

export default function AnamneseTab({
  patient,
  anamnesisTemplate,
}: {
  patient: PatientData
  anamnesisTemplate: AnamnesisQuestionDef[]
}) {
  const existingAnamnesis = (patient.customData?.anamnesis as Record<string, string>) ?? {}
  const [answers, setAnswers] = useState<Record<string, string>>(existingAnamnesis)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updatedCustomData = { ...patient.customData, anamnesis: answers }
      await updatePatient(patient.id, { customData: updatedCustomData })
      setSaved(true)
      toast.success("Anamnese salva com sucesso")
    } catch {
      toast.error("Erro ao salvar anamnese")
    } finally {
      setSaving(false)
    }
  }

  if (anamnesisTemplate.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted/60">
          <FileText className="size-6 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-medium">Nenhum modelo de anamnese configurado</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure o modelo de anamnese nas configuracoes do workspace
          </p>
        </div>
        <Link href="/settings">
          <Button size="sm" variant="outline" className="gap-1.5 mt-1">
            Ir para Configuracoes
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Anamnese</CardTitle>
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Salvando...
            </>
          ) : saved ? (
            "Salvo"
          ) : (
            "Salvar"
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.keys(existingAnamnesis).length === 0 && (
          <div className="rounded-xl border border-vox-primary/20 bg-vox-primary/5 p-3 text-center">
            <p className="text-sm text-vox-primary font-medium">Preencha a anamnese para este paciente</p>
            <p className="text-xs text-muted-foreground mt-0.5">Responda as perguntas abaixo e clique em Salvar</p>
          </div>
        )}
        {anamnesisTemplate.map((q, i) => (
          <div key={q.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {i + 1}. {q.question}
            </Label>

            {q.type === "text" && (
              <Textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Digite sua resposta..."
                rows={3}
              />
            )}

            {q.type === "boolean" && (
              <div className="flex gap-3">
                {["Sim", "Nao"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswer(q.id, opt)}
                    className={cn(
                      "rounded-xl border px-6 py-2.5 text-sm font-medium transition-all",
                      answers[q.id] === opt
                        ? "border-vox-primary bg-vox-primary/5 text-vox-primary"
                        : "border-border text-foreground hover:border-vox-primary/30"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === "select" && q.options && (
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswer(q.id, opt)}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm transition-all",
                      answers[q.id] === opt
                        ? "border-vox-primary bg-vox-primary/5 text-vox-primary font-medium"
                        : "border-border text-foreground hover:border-vox-primary/30"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
