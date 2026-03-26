"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pill, Plus, Trash2, Loader2 } from "lucide-react"
import { createPrescription } from "@/server/actions/prescription"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  notes: string
}

const emptyMedication: Medication = {
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
  notes: "",
}

export function CreatePrescriptionButton({
  patientId,
  patientName,
}: {
  patientId: string
  patientName: string
}) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Pill className="size-3.5" />
        Prescricao
      </Button>
    )
  }

  return (
    <CreatePrescriptionModal
      patientId={patientId}
      patientName={patientName}
      onClose={() => setOpen(false)}
    />
  )
}

function CreatePrescriptionModal({
  patientId,
  patientName,
  onClose,
}: {
  patientId: string
  patientName: string
  onClose: () => void
}) {
  const [medications, setMedications] = useState<Medication[]>([{ ...emptyMedication }])
  const [notes, setNotes] = useState("")
  const [saving, startSave] = useTransition()
  const router = useRouter()

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    setMedications((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    )
  }

  const addMedication = () => {
    setMedications((prev) => [...prev, { ...emptyMedication }])
  }

  const removeMedication = (index: number) => {
    if (medications.length <= 1) return
    setMedications((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    const validMeds = medications.filter((m) => m.name.trim())
    if (validMeds.length === 0) {
      toast.error("Adicione pelo menos um medicamento")
      return
    }

    startSave(async () => {
      try {
        const result = await createPrescription({
          patientId,
          medications: validMeds,
          notes: notes.trim() || undefined,
        })
        toast.success("Prescricao criada com sucesso")
        onClose()
        window.open(`/prescriptions/${result.id}`, "_blank")
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao criar prescricao")
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card border shadow-lg p-5 space-y-4 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-base font-semibold">Nova Prescricao</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Paciente: <strong>{patientName}</strong>
          </p>
        </div>

        {/* Medications */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Medicamentos</Label>
          {medications.map((med, index) => (
            <div key={index} className="rounded-xl border border-border/60 p-3 space-y-2.5 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Medicamento {index + 1}
                </span>
                {medications.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeMedication(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nome do medicamento</Label>
                  <Input
                    placeholder="Ex: Amoxicilina 500mg"
                    value={med.name}
                    onChange={(e) => updateMedication(index, "name", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Posologia</Label>
                  <Input
                    placeholder="Ex: 1 comprimido"
                    value={med.dosage}
                    onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Frequencia</Label>
                  <Input
                    placeholder="Ex: 8 em 8 horas"
                    value={med.frequency}
                    onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Duracao</Label>
                  <Input
                    placeholder="Ex: 7 dias"
                    value={med.duration}
                    onChange={(e) => updateMedication(index, "duration", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Observacoes</Label>
                <Input
                  placeholder="Ex: Tomar apos as refeicoes"
                  value={med.notes}
                  onChange={(e) => updateMedication(index, "notes", e.target.value)}
                />
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 w-full"
            onClick={addMedication}
          >
            <Plus className="size-3.5" />
            Adicionar medicamento
          </Button>
        </div>

        {/* General notes */}
        <div className="space-y-1.5">
          <Label className="text-sm">Observacoes gerais</Label>
          <Textarea
            placeholder="Observacoes adicionais sobre a prescricao..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={saving}
            onClick={handleSubmit}
            className="bg-vox-primary text-white hover:bg-vox-primary/90 gap-1.5"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Pill className="size-3.5" />}
            Criar e imprimir
          </Button>
        </div>
      </div>
    </div>
  )
}
