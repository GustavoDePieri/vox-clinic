"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { Clock, CalendarPlus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"
import { getWaitlistEntries, cancelWaitlistEntry } from "@/server/actions/waitlist"

const DAY_LABELS: Record<string, string> = {
  seg: "Seg",
  ter: "Ter",
  qua: "Qua",
  qui: "Qui",
  sex: "Sex",
  sab: "Sab",
  dom: "Dom",
}

const PRIORITY_CONFIG: Record<number, { label: string; className: string }> = {
  0: { label: "Normal", className: "bg-muted text-muted-foreground" },
  1: { label: "Alta", className: "bg-vox-warning/10 text-vox-warning" },
  2: { label: "Urgente", className: "bg-vox-error/10 text-vox-error" },
}

type WaitlistEntry = Awaited<ReturnType<typeof getWaitlistEntries>>[number]

function WaitlistPanelInner({
  open,
  onClose,
  onSchedulePatient,
  onAddToWaitlist,
}: {
  open: boolean
  onClose: () => void
  onSchedulePatient: (patientId: string, patientName: string) => void
  onAddToWaitlist: () => void
}) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPriority, setFilterPriority] = useState<number | null>(null)

  const loadEntries = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getWaitlistEntries({ status: "waiting" })
      setEntries(data)
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) loadEntries()
  }, [open, loadEntries])

  async function handleCancel(id: string) {
    try {
      const result = await cancelWaitlistEntry(id)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Removido da lista de espera")
      loadEntries()
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao remover da lista"))
    }
  }

  const filteredEntries = filterPriority !== null
    ? entries.filter((e) => e.priority === filterPriority)
    : entries

  function formatWaitingTime(createdAt: string) {
    const diff = Date.now() - new Date(createdAt).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return "Hoje"
    if (days === 1) return "1 dia"
    return `${days} dias`
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="size-4 text-vox-primary" />
              Lista de Espera
              {entries.length > 0 && (
                <Badge variant="secondary" className="text-[10px] tabular-nums">
                  {entries.length}
                </Badge>
              )}
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Filters */}
        <div className="flex items-center gap-1.5 px-5 py-3 border-b border-border/30">
          <button
            onClick={() => setFilterPriority(null)}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
              filterPriority === null ? "bg-vox-primary/10 text-vox-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          {[2, 1, 0].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(filterPriority === p ? null : p)}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                filterPriority === p ? PRIORITY_CONFIG[p].className : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </div>

        {/* Entry List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="size-5 animate-spin text-vox-primary" />
              <p className="text-xs text-muted-foreground">Carregando...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-5">
              <Clock className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum paciente na lista de espera</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddToWaitlist}
                className="rounded-xl text-xs"
              >
                Adicionar paciente
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{entry.patient.name}</span>
                        <Badge className={`text-[9px] px-1.5 py-0 ${PRIORITY_CONFIG[entry.priority]?.className ?? PRIORITY_CONFIG[0].className}`}>
                          {PRIORITY_CONFIG[entry.priority]?.label ?? "Normal"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-muted-foreground">
                        {entry.procedureName && (
                          <span>{entry.procedureName}</span>
                        )}
                        {entry.agenda && (
                          <span className="flex items-center gap-1">
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: entry.agenda.color }} />
                            {entry.agenda.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatWaitingTime(entry.createdAt)}
                        </span>
                      </div>

                      {/* Preferences */}
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {entry.preferredDays.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {entry.preferredDays.map((d) => DAY_LABELS[d] ?? d).join(", ")}
                          </span>
                        )}
                        {(entry.preferredTimeStart || entry.preferredTimeEnd) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {entry.preferredTimeStart ?? "00:00"} - {entry.preferredTimeEnd ?? "23:59"}
                          </span>
                        )}
                      </div>

                      {entry.notes && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{entry.notes}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px] text-vox-primary hover:text-vox-primary hover:bg-vox-primary/10 rounded-lg"
                        onClick={() => onSchedulePatient(entry.patient.id, entry.patient.name)}
                      >
                        <CalendarPlus className="size-3.5 mr-1" />
                        Agendar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-vox-error hover:bg-vox-error/10 rounded-lg"
                        onClick={() => handleCancel(entry.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/40">
          <Button
            onClick={onAddToWaitlist}
            className="w-full bg-vox-primary hover:bg-vox-primary/90 text-white rounded-xl text-xs shadow-sm shadow-vox-primary/15 active:scale-[0.98]"
          >
            Adicionar a lista de espera
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export const WaitlistPanel = memo(WaitlistPanelInner)
