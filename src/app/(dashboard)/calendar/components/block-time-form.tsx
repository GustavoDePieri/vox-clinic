"use client"

import { useState, memo } from "react"
import { X, Ban, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AgendaItem } from "../types"

function BlockTimeFormInner({ agendas, defaultAgendaId, onSave, onCancel }: {
  agendas: AgendaItem[]
  defaultAgendaId: string
  onSave: (data: { title: string; startDate: string; endDate: string; agendaId: string; allDay?: boolean; recurring?: string | null }) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState("")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [allDay, setAllDay] = useState(false)
  const [recurring, setRecurring] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [agendaId, setAgendaId] = useState(defaultAgendaId)

  async function handleSave() {
    if (!title.trim() || !startDate || !agendaId) return
    setSaving(true)
    try {
      const start = allDay ? `${startDate}T00:00:00` : `${startDate}T${startTime || "00:00"}:00`
      const end = allDay ? `${endDate || startDate}T23:59:59` : `${endDate || startDate}T${endTime || startTime || "01:00"}:00`
      await onSave({
        title: title.trim(),
        startDate: new Date(start).toISOString(),
        endDate: new Date(end).toISOString(),
        agendaId,
        allDay,
        recurring: recurring || null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="rounded-2xl border border-border/40 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Ban className="size-4 text-muted-foreground" />
          Bloquear Horario
        </h2>
        <button onClick={onCancel} className="p-1 rounded-lg hover:bg-muted/60 text-muted-foreground">
          <X className="size-4" />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs">Titulo</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Almoco, Ferias, Reuniao..." className="rounded-xl text-sm" />
        </div>
        {agendas.length > 1 && (
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-xs">Agenda</Label>
            <select
              value={agendaId}
              onChange={(e) => setAgendaId(e.target.value)}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vox-primary/30"
            >
              {agendas.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-2 sm:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="rounded border-border accent-vox-primary size-4" />
            <span className="text-xs font-medium">Dia inteiro</span>
          </label>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Data inicio</Label>
          <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value) }} className="rounded-xl text-sm" />
        </div>
        {!allDay && (
          <div className="space-y-2">
            <Label className="text-xs">Horario inicio</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="rounded-xl text-sm" />
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-xs">Data fim</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl text-sm" />
        </div>
        {!allDay && (
          <div className="space-y-2">
            <Label className="text-xs">Horario fim</Label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="rounded-xl text-sm" />
          </div>
        )}
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs">Repetir</Label>
          <select
            value={recurring}
            onChange={(e) => setRecurring(e.target.value)}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vox-primary/30"
          >
            <option value="">Nenhum</option>
            <option value="weekly">Semanal</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel} className="rounded-xl text-xs">Cancelar</Button>
        <Button
          onClick={handleSave}
          disabled={!title.trim() || !startDate || saving}
          className="bg-muted-foreground hover:bg-muted-foreground/90 text-white rounded-xl text-xs gap-1.5"
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />}
          Bloquear
        </Button>
      </div>
    </Card>
  )
}

export const BlockTimeForm = memo(BlockTimeFormInner)
