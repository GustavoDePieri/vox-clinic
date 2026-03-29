"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  Pencil,
  Library,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"
import {
  getFormTemplates,
  createFormTemplate,
  updateFormTemplate,
  duplicateFormTemplate,
  deleteFormTemplate,
} from "@/server/actions/form-template"
import {
  FORM_CATEGORY_LABELS,
  FORM_CATEGORY_COLORS,
  type FormCategory,
} from "@/types/form-builder"
import { useRouter } from "next/navigation"
import { LibraryDialog } from "../components/library-dialog"

interface TemplateItem {
  id: string
  name: string
  description: string | null
  category: string | null
  isActive: boolean
  isDefault: boolean
  version: number
  responseCount: number
  fieldCount: number
  createdAt: Date
  updatedAt: Date
}

export function FormulariosSection() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(
    null
  )
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formCategory, setFormCategory] = useState<string>("custom")

  // Library dialog
  const [libraryOpen, setLibraryOpen] = useState(false)

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({ open: false, title: "", description: "", onConfirm: () => {} })

  const loadTemplates = useCallback(async () => {
    try {
      const result = await getFormTemplates()
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setTemplates(result.items as unknown as TemplateItem[])
    } catch {
      toast.error("Erro ao carregar formularios")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  function openCreateDialog() {
    setEditingTemplate(null)
    setFormName("")
    setFormDescription("")
    setFormCategory("custom")
    setDialogOpen(true)
  }

  function openEditDialog(t: TemplateItem) {
    setEditingTemplate(t)
    setFormName(t.name)
    setFormDescription(t.description ?? "")
    setFormCategory(t.category ?? "custom")
    setDialogOpen(true)
  }

  async function handleSaveDialog() {
    if (!formName.trim()) {
      toast.error("Nome e obrigatorio")
      return
    }
    setActionLoading("dialog")
    try {
      if (editingTemplate) {
        const result = await updateFormTemplate(editingTemplate.id, {
          name: formName,
          description: formDescription || undefined,
          category: formCategory,
        })
        if ("error" in result) {
          toast.error(result.error)
          return
        }
        toast.success("Formulario atualizado")
      } else {
        const result = await createFormTemplate({
          name: formName,
          description: formDescription || undefined,
          category: formCategory,
        })
        if ("error" in result) {
          toast.error(result.error)
          return
        }
        toast.success("Formulario criado")
        // Navigate to builder for newly created template
        router.push(`/settings/form-builder/${result.id}`)
      }
      setDialogOpen(false)
      await loadTemplates()
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao salvar formulario"))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDuplicate(id: string) {
    setActionLoading(id)
    try {
      const result = await duplicateFormTemplate(id)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Formulario duplicado")
      await loadTemplates()
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao duplicar"))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(id: string) {
    setConfirmDialog({
      open: true,
      title: "Excluir formulario",
      description:
        "Tem certeza que deseja excluir este formulario? Esta acao nao pode ser desfeita.",
      onConfirm: async () => {
        setActionLoading(id)
        setConfirmDialog((prev) => ({ ...prev, open: false }))
        try {
          const result = await deleteFormTemplate(id)
          if ("error" in result) {
            toast.error(result.error)
            return
          }
          toast.success("Formulario excluido")
          await loadTemplates()
        } catch (err) {
          toast.error(friendlyError(err, "Erro ao excluir"))
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    setActionLoading(id)
    try {
      const result = await updateFormTemplate(id, { isActive: !isActive })
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isActive: !isActive } : t))
      )
      toast.success(isActive ? "Formulario desativado" : "Formulario ativado")
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao atualizar"))
    } finally {
      setActionLoading(null)
    }
  }

  function handleLibraryImported() {
    setLibraryOpen(false)
    loadTemplates()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-60" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Formularios</h2>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie modelos de formularios para anamnese, avaliacoes e
            consentimentos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setLibraryOpen(true)}
          >
            <Library className="size-4" />
            Importar da Biblioteca
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-vox-primary text-white hover:bg-vox-primary/90"
            onClick={openCreateDialog}
          >
            <Plus className="size-4" />
            Novo Formulario
          </Button>
        </div>
      </div>

      {/* Template list */}
      {templates.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-vox-primary/10">
              <FileText className="size-7 text-vox-primary" />
            </div>
            <h3 className="text-base font-medium">
              Nenhum formulario criado
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Crie formularios personalizados ou importe modelos prontos da
              biblioteca.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLibraryOpen(true)}
              >
                <Library className="mr-1.5 size-4" />
                Ver Biblioteca
              </Button>
              <Button
                size="sm"
                className="bg-vox-primary text-white hover:bg-vox-primary/90"
                onClick={openCreateDialog}
              >
                <Plus className="mr-1.5 size-4" />
                Criar Formulario
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((t) => {
            const catKey = (t.category ?? "custom") as FormCategory
            const catLabel =
              FORM_CATEGORY_LABELS[catKey] ?? t.category ?? "Personalizado"
            const catColor =
              FORM_CATEGORY_COLORS[catKey] ??
              "bg-gray-100 text-gray-700 border-gray-200"
            const isLoading = actionLoading === t.id

            return (
              <Card
                key={t.id}
                className={`group relative rounded-2xl border-border/40 transition-shadow hover:shadow-md ${
                  !t.isActive ? "opacity-60" : ""
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">
                          {t.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-[10px] ${catColor}`}
                        >
                          {catLabel}
                        </Badge>
                      </div>
                      {t.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {t.description}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={t.isActive}
                      onCheckedChange={() =>
                        handleToggleActive(t.id, t.isActive)
                      }
                      disabled={isLoading}
                    />
                  </div>

                  {/* Stats */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{t.fieldCount} campos</span>
                    <span>v{t.version}</span>
                    {t.responseCount > 0 && (
                      <span>
                        {t.responseCount}{" "}
                        {t.responseCount === 1 ? "resposta" : "respostas"}
                      </span>
                    )}
                    {t.isDefault && (
                      <Badge
                        variant="outline"
                        className="border-vox-primary/30 bg-vox-primary/10 text-vox-primary text-[10px]"
                      >
                        Padrao
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex gap-1.5 border-t border-border/30 pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() =>
                        router.push(`/settings/form-builder/${t.id}`)
                      }
                    >
                      <Pencil className="size-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      disabled={isLoading}
                      onClick={() => handleDuplicate(t.id)}
                    >
                      {isLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                      Duplicar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                      disabled={isLoading}
                      onClick={() => handleDelete(t.id)}
                    >
                      <Trash2 className="size-3.5" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Editar Formulario" : "Novo Formulario"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Atualize os dados do formulario."
                : "Defina o nome e a categoria. Voce podera adicionar campos em seguida."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="form-name">Nome</Label>
              <Input
                id="form-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Anamnese Geral"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-desc">Descricao (opcional)</Label>
              <Input
                id="form-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Breve descricao do formulario"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formCategory} onValueChange={(v) => v && setFormCategory(v)}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FORM_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              className="bg-vox-primary text-white hover:bg-vox-primary/90"
              disabled={actionLoading === "dialog" || !formName.trim()}
              onClick={handleSaveDialog}
            >
              {actionLoading === "dialog" ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Salvando...
                </>
              ) : editingTemplate ? (
                "Salvar"
              ) : (
                "Criar e Editar Campos"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Library Dialog */}
      <LibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onImported={handleLibraryImported}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant="destructive"
        confirmLabel="Excluir"
      />
    </div>
  )
}
