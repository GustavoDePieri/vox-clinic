"use client"

import { useState, useEffect, memo } from "react"
import { X, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"
import { searchPatients } from "@/server/actions/patient"
import { addToWaitlist } from "@/server/actions/waitlist"
import type { AgendaItem, PatientOption } from "../types"

const DAYS_OPTIONS = [
  { value: "seg", label: "Seg" },
  { value: "ter", label: "Ter" },
  { value: "qua", label: "Qua" },
  { value: "qui", label: "Qui" },
  { value: "sex", label: "Sex" },
  { value: "sab", label: "Sab" },
] as const

const PRIORITY_OPTIONS = [
  { value: 0, label: "Normal" },
  { value: 1, label: "Alta" },
  { value: 2, label: "Urgente" },
] as const

function AddWaitlistDialogInner({
  open,
  onClose,
  onAdded,
  agendas,
  procedures,
}: {
  open: boolean
  onClose: () => void
  onAdded: () => void
  agendas: AgendaItem[]
  procedures: { id: string; name: string }[]
}) {
  // Patient search
  const [patientQuery, setPatientQuery] = useState("")
  const [patientResults, setPatientResults] = useState<PatientOption[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null)
  const [searchingPatients, setSearchingPatients] = useState(false)

  // Form fields
  const [agendaId, setAgendaId] = useState<string>("")
  const [procedureName, setProcedureName] = useState<string>("")
  const [preferredDays, setPreferredDays] = useState<string[]>([])
  const [preferredTimeStart, setPreferredTimeStart] = useState("")
  const [preferredTimeEnd, setPreferredTimeEnd] = useState("")
  const [priority, setPriority] = useState(0)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Patient search with debounce
  useEffect(() => {
    if (!patientQuery.trim() || patientQuery.length < 2) {
      setPatientResults([])
      return
    }
    const timeout = setTimeout(async () => {
      setSearchingPatients(true)
      try {
        setPatientResults(await searchPatients(patientQuery))
      } catch {
        setPatientResults([])
      } finally {
        setSearchingPatients(false)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [patientQuery])

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setPatientQuery("")
      setPatientResults([])
      setSelectedPatient(null)
      setAgendaId("")
      setProcedureName("")
      setPreferredDays([])
      setPreferredTimeStart("")
      setPreferredTimeEnd("")
      setPriority(0)
      setNotes("")
    }
  }, [open])

  function toggleDay(day: string) {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  async function handleSubmit() {
    if (!selectedPatient) return
    setSubmitting(true)
    try {
      const result = await addToWaitlist({
        patientId: selectedPatient.id,
        agendaId: agendaId || null,
        procedureName: procedureName || null,
        preferredDays,
        preferredTimeStart: preferredTimeStart || null,
        preferredTimeEnd: preferredTimeEnd || null,
        priority,
        notes: notes || null,
      })
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Paciente adicionado a lista de espera")
      onAdded()
      onClose()
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao adicionar a lista de espera"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Adicionar a Lista de Espera</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Patient search */}
          <div className="space-y-2">
            <Label className="text-xs">Paciente *</Label>
            {selectedPatient ? (
              <div className="flex items-center gap-2 rounded-xl bg-vox-primary/5 border border-vox-primary/20 px-3 py-2">
                <span className="text-sm font-medium">{selectedPatient.name}</span>
                <button
                  onClick={() => { setSelectedPatient(null); setPatientQuery("") }}
                  className="ml-auto p-0.5 rounded hover:bg-muted/60"
                >
                  <X className="size-3.5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente por nome..."
                  aria-label="Buscar paciente por nome"
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                  className="pl-9 rounded-xl text-sm"
                />
                {(patientResults.length > 0 || searchingPatients) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border/60 rounded-xl shadow-lg z-10 overflow-hidden">
                    {searchingPatients ? (
                      <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" />Buscando...
                      </div>
                    ) : (
                      patientResults.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPatient(p)
                            setPatientQuery("")
                            setPatientResults([])
                          }}
                          className="w-full text-left px-3 py-2.5 hover:bg-muted/60 transition-colors border-b border-border/30 last:border-0"
                        >
                          <div className="text-sm font-medium">{p.name}</div>
                          {p.phone && <div className="text-[11px] text-muted-foreground">{p.phone}</div>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Agenda preference */}
          {agendas.length > 1 && (
            <div className="space-y-2">
              <Label className="text-xs">Agenda (opcional)</Label>
              <select
                value={agendaId}
                onChange={(e) => setAgendaId(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Qualquer agenda</option>
                {agendas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Procedure preference */}
          {procedures.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">Procedimento (opcional)</Label>
              <select
                value={procedureName}
                onChange={(e) => setProcedureName(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Qualquer procedimento</option>
                {procedures.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Preferred days */}
          <div className="space-y-2">
            <Label className="text-xs">Dias de preferencia</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                    preferredDays.includes(d.value)
                      ? "bg-vox-primary/10 text-vox-primary border-vox-primary/30"
                      : "bg-muted/40 text-muted-foreground border-transparent hover:border-border/40"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {preferredDays.length === 0 && (
              <p className="text-[10px] text-muted-foreground">Nenhum selecionado = qualquer dia</p>
            )}
          </div>

          {/* Preferred time range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Horario inicio</Label>
              <Input
                type="time"
                value={preferredTimeStart}
                onChange={(e) => setPreferredTimeStart(e.target.value)}
                className="rounded-xl text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Horario fim</Label>
              <Input
                type="time"
                value={preferredTimeEnd}
                onChange={(e) => setPreferredTimeEnd(e.target.value)}
                className="rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-xs">Prioridade</Label>
            <div className="flex gap-1.5">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all text-center ${
                    priority === p.value
                      ? p.value === 0
                        ? "bg-muted text-foreground border-border/60"
                        : p.value === 1
                          ? "bg-vox-warning/10 text-vox-warning border-vox-warning/30"
                          : "bg-vox-error/10 text-vox-error border-vox-error/30"
                      : "bg-muted/40 text-muted-foreground border-transparent hover:border-border/40"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs">Observacoes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Paciente prefere manha, telefone alternativo..."
              className="rounded-xl text-sm min-h-[60px] resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPatient || submitting}
            className="bg-vox-primary hover:bg-vox-primary/90 text-white rounded-xl text-xs shadow-sm shadow-vox-primary/15 active:scale-[0.98]"
          >
            {submitting ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
            Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const AddWaitlistDialog = memo(AddWaitlistDialogInner)
