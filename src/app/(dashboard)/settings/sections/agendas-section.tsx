"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { CalendarDays, Plus, Check, Loader2, Palette, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"
import {
  getAgendas,
  createAgenda,
  updateAgenda,
  deleteAgenda,
} from "@/server/actions/agenda"

const AGENDA_COLORS = [
  "#14B8A6", "#3B82F6", "#8B5CF6", "#EC4899",
  "#F59E0B", "#10B981", "#EF4444", "#6366F1",
]

export function AgendasSection() {
  const [loading, setLoading] = useState(true)
  const [agendas, setAgendas] = useState<Array<{
    id: string; name: string; color: string; isDefault: boolean; isActive: boolean; appointmentCount: number
  }>>([])
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#3B82F6")
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({ open: false, title: "", description: "", onConfirm: () => {} })
  const showConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, description, onConfirm })
  }

  const loadAgendas = useCallback(async () => {
    try {
      const data = await getAgendas()
      setAgendas(data)
    } catch {
      toast.error("Erro ao carregar agendas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAgendas() }, [loadAgendas])

  async function handleCreate() {
    if (!newName.trim()) return
    setActionLoading("create")
    try {
      const result = await createAgenda({ name: newName.trim(), color: newColor })
      if ('error' in result) { toast.error(result.error); return }
      setNewName("")
      setNewColor("#3B82F6")
      setShowNewForm(false)
      await loadAgendas()
      toast.success("Agenda criada")
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao criar agenda"))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleUpdate(id: string) {
    setActionLoading(id)
    try {
      const result = await updateAgenda(id, { name: editName.trim(), color: editColor })
      if ('error' in result) { toast.error(result.error); return }
      setEditingId(null)
      await loadAgendas()
      toast.success("Agenda atualizada")
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao atualizar"))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    setActionLoading(id)
    try {
      const result = await updateAgenda(id, { isActive: !isActive })
      if ('error' in result) { toast.error(result.error); return }
      await loadAgendas()
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao alterar status"))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(id: string) {
    showConfirm("Excluir agenda", "Tem certeza que deseja excluir esta agenda? Todas as consultas vinculadas serao desvinculadas.", async () => {
      setActionLoading(id)
      try {
        const result = await deleteAgenda(id)
        if ('error' in result) { toast.error(result.error); return }
        await loadAgendas()
        toast.success("Agenda excluida")
      } catch (err) {
        toast.error(friendlyError(err, "Erro ao excluir"))
      } finally {
        setActionLoading(null)
      }
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-vox-primary" />
            Agendas
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowNewForm(true)}
            className="bg-vox-primary hover:bg-vox-primary/90 text-white rounded-xl text-xs gap-1.5"
          >
            <Plus className="size-3.5" />
            Nova Agenda
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Gerencie as agendas do seu workspace. Cada profissional ou sala pode ter sua propria agenda.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* New agenda form */}
        {showNewForm && (
          <div className="rounded-xl border border-vox-primary/30 bg-vox-primary/5 p-4 space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Nome da agenda</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Dr. Silva, Sala 1..."
                className="rounded-xl text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cor</Label>
              <div className="flex gap-2">
                {AGENDA_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`size-7 rounded-full border-2 transition-all ${
                      newColor === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!newName.trim() || actionLoading === "create"}
                className="bg-vox-primary hover:bg-vox-primary/90 text-white rounded-xl text-xs gap-1.5"
              >
                {actionLoading === "create" ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                Criar
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowNewForm(false); setNewName("") }} className="rounded-xl text-xs">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Agenda list */}
        {agendas.map((agenda) => (
          <div
            key={agenda.id}
            className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
              agenda.isActive ? "border-border/40" : "border-border/20 opacity-50"
            }`}
          >
            {editingId === agenda.id ? (
              /* Edit mode */
              <div className="flex-1 space-y-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-xl text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleUpdate(agenda.id)}
                />
                <div className="flex gap-2">
                  {AGENDA_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className={`size-6 rounded-full border-2 transition-all ${
                        editColor === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdate(agenda.id)} disabled={actionLoading === agenda.id} className="bg-vox-primary hover:bg-vox-primary/90 text-white rounded-xl text-xs gap-1">
                    {actionLoading === agenda.id ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                    Salvar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="rounded-xl text-xs">Cancelar</Button>
                </div>
              </div>
            ) : (
              /* View mode */
              <>
                <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: agenda.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{agenda.name}</span>
                    {agenda.isDefault && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Padrao</Badge>}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{agenda.appointmentCount} consulta(s)</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!agenda.isDefault && (
                    <Switch
                      checked={agenda.isActive}
                      onCheckedChange={() => handleToggleActive(agenda.id, agenda.isActive)}
                      disabled={actionLoading === agenda.id}
                    />
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEditingId(agenda.id); setEditName(agenda.name); setEditColor(agenda.color) }}
                    className="size-8 p-0 rounded-lg"
                  >
                    <Palette className="size-3.5 text-muted-foreground" />
                  </Button>
                  {!agenda.isDefault && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(agenda.id)}
                      disabled={actionLoading === agenda.id}
                      className="size-8 p-0 rounded-lg text-muted-foreground hover:text-vox-error"
                    >
                      {actionLoading === agenda.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}

        {agendas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="size-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhuma agenda encontrada</p>
          </div>
        )}
      </CardContent>
    </Card>
    <ConfirmDialog
      open={confirmDialog.open}
      onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
      title={confirmDialog.title}
      description={confirmDialog.description}
      onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(prev => ({ ...prev, open: false })) }}
    />
    </>
  )
}
