"use client"

import { useMemo, memo } from "react"
import { CalendarDays, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { AppointmentItem } from "../types"
import { formatDateBR } from "../helpers"
import { AppointmentCard } from "./appointment-card"

function ListViewInner({
  appointments,
  onStatusChange,
  onDelete,
  onShowSchedule,
}: {
  appointments: AppointmentItem[]
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
  onShowSchedule: () => void
}) {
  const { groupedByDate, sortedDateKeys } = useMemo(() => {
    const grouped = appointments.reduce<Record<string, AppointmentItem[]>>((acc, a) => {
      const key = a.date.slice(0, 10)
      if (!acc[key]) acc[key] = []
      acc[key].push(a)
      return acc
    }, {})
    return { groupedByDate: grouped, sortedDateKeys: Object.keys(grouped).sort() }
  }, [appointments])

  if (sortedDateKeys.length === 0) {
    return (
      <Card className="rounded-2xl border border-border/40 p-8">
        <div className="text-center text-muted-foreground">
          <CalendarDays className="size-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Nenhuma consulta agendada</p>
          <p className="text-xs mt-1">Nenhuma consulta encontrada neste mes.</p>
          <Button onClick={onShowSchedule} className="mt-4 bg-vox-primary hover:bg-vox-primary/90 text-white rounded-xl text-xs gap-1.5">
            <Plus className="size-3.5" /> Agendar Consulta
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sortedDateKeys.map((dateKey) => (
        <div key={dateKey}>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{formatDateBR(dateKey + "T00:00:00")}</h3>
          <div className="space-y-2">
            {groupedByDate[dateKey].map((a) => (
              <AppointmentCard key={a.id} appointment={a} onStatusChange={onStatusChange} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export const ListView = memo(ListViewInner)
