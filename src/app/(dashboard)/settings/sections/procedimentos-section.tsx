"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ListChecks, Plus, X } from "lucide-react"
import type { Procedure } from "@/types"

interface ProcedimentosSectionProps {
  procedures: Procedure[]
  onProceduresChange: (procedures: Procedure[]) => void
}

export function ProcedimentosSection({ procedures, onProceduresChange }: ProcedimentosSectionProps) {
  const [newProcedure, setNewProcedure] = useState("")

  function addProcedure() {
    if (!newProcedure.trim()) return
    onProceduresChange([
      ...procedures,
      { id: `proc_${Date.now()}`, name: newProcedure.trim(), category: "Geral", duration: 30 },
    ])
    setNewProcedure("")
  }

  function updateProcedureDuration(id: string, duration: number) {
    onProceduresChange(procedures.map((p) => p.id === id ? { ...p, duration } : p))
  }

  function removeProcedure(id: string) {
    onProceduresChange(procedures.filter((p) => p.id !== id))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="size-4 text-vox-primary" />
            Procedimentos
          </CardTitle>
          <Badge variant="secondary" className="tabular-nums">
            {procedures.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add new */}
        <div className="flex gap-2">
          <Input
            value={newProcedure}
            onChange={(e) => setNewProcedure(e.target.value)}
            placeholder="Nome do procedimento..."
            className="h-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addProcedure()
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={addProcedure}
            disabled={!newProcedure.trim()}
            className="shrink-0"
          >
            <Plus className="size-4" />
            Adicionar
          </Button>
        </div>

        <Separator />

        {/* Procedure list */}
        <div className="space-y-1.5">
          {procedures.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <ListChecks className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Nenhum procedimento cadastrado
              </p>
            </div>
          )}
          {procedures.map((proc, i) => (
            <div
              key={proc.id}
              className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 transition-all duration-200 hover:border-border hover:shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-vox-primary/[0.07] text-xs font-semibold text-vox-primary">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">{proc.name}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  min={5}
                  max={480}
                  step={5}
                  value={proc.duration ?? 30}
                  onChange={(e) => updateProcedureDuration(proc.id, parseInt(e.target.value) || 30)}
                  className="w-14 h-7 rounded-lg border border-input bg-transparent px-1.5 text-center text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
                <span className="text-[10px] text-muted-foreground">min</span>
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {proc.category}
              </Badge>
              <button
                type="button"
                onClick={() => removeProcedure(proc.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-vox-error shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
