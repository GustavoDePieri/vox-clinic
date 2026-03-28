"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Library,
  ArrowLeft,
  FileText,
  Loader2,
  Check,
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"
import {
  LIBRARY_TEMPLATES,
  LIBRARY_SPECIALTIES,
} from "@/data/form-templates-library"
import { importFromLibrary } from "@/server/actions/form-template"
import {
  FORM_CATEGORY_LABELS,
  FORM_CATEGORY_COLORS,
  FIELD_TYPES,
  type FormCategory,
  type LibraryTemplate,
} from "@/types/form-builder"

interface LibraryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}

export function LibraryDialog({
  open,
  onOpenChange,
  onImported,
}: LibraryDialogProps) {
  const [previewing, setPreviewing] = useState<LibraryTemplate | null>(null)
  const [importing, setImporting] = useState<string | null>(null)
  const [filterSpecialty, setFilterSpecialty] = useState<string | null>(null)

  const filteredTemplates = filterSpecialty
    ? LIBRARY_TEMPLATES.filter((t) => t.specialty === filterSpecialty)
    : LIBRARY_TEMPLATES

  async function handleImport(template: LibraryTemplate) {
    setImporting(template.id)
    try {
      const result = await importFromLibrary({
        name: template.name,
        description: template.description,
        category: template.category,
        fields: template.fields,
        sections: template.sections,
      })
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(`"${template.name}" importado com sucesso`)
      onImported()
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao importar modelo"))
    } finally {
      setImporting(null)
    }
  }

  function getFieldTypeLabel(type: string) {
    return FIELD_TYPES.find((ft) => ft.type === type)?.label ?? type
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          {previewing ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPreviewing(null)}
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <DialogTitle>{previewing.name}</DialogTitle>
              </div>
              <DialogDescription>{previewing.description}</DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle className="flex items-center gap-2">
                <Library className="size-5 text-vox-primary" />
                Biblioteca de Modelos
              </DialogTitle>
              <DialogDescription>
                Modelos prontos para usar. Importe e personalize conforme sua
                necessidade.
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {previewing ? (
          /* ─── Preview Mode ─── */
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  FORM_CATEGORY_COLORS[
                    previewing.category as FormCategory
                  ] ?? "bg-gray-100 text-gray-700"
                }
              >
                {FORM_CATEGORY_LABELS[previewing.category as FormCategory] ??
                  previewing.category}
              </Badge>
              <Badge variant="outline">{previewing.specialty}</Badge>
              <span className="text-xs text-muted-foreground">
                {previewing.fields.filter(
                  (f) =>
                    f.type !== "section_header" && f.type !== "rich_text"
                ).length}{" "}
                campos
              </span>
            </div>

            {/* Field preview list */}
            <div className="space-y-2">
              {previewing.fields.map((field) => (
                <div
                  key={field.id}
                  className={`rounded-xl border border-border/40 px-4 py-3 ${
                    field.type === "section_header"
                      ? "bg-muted/50 font-semibold"
                      : field.type === "rich_text"
                        ? "bg-muted/30 text-sm italic text-muted-foreground"
                        : "bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{field.label}</span>
                    {field.type !== "section_header" &&
                      field.type !== "rich_text" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-normal"
                        >
                          {getFieldTypeLabel(field.type)}
                        </Badge>
                      )}
                    {field.required && (
                      <span className="text-xs text-vox-error">*</span>
                    )}
                  </div>
                  {field.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {field.description}
                    </p>
                  )}
                  {field.options && field.options.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {field.options.map((opt) => (
                        <Badge
                          key={opt}
                          variant="outline"
                          className="text-[10px] font-normal"
                        >
                          {opt}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setPreviewing(null)}>
                Voltar
              </Button>
              <Button
                className="gap-2 bg-vox-primary text-white hover:bg-vox-primary/90"
                disabled={importing === previewing.id}
                onClick={() => handleImport(previewing)}
              >
                {importing === previewing.id ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    Usar este modelo
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* ─── Browse Mode ─── */
          <div className="space-y-4">
            {/* Specialty filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterSpecialty === null ? "default" : "outline"}
                size="sm"
                className={`h-7 rounded-full text-xs ${
                  filterSpecialty === null
                    ? "bg-vox-primary text-white hover:bg-vox-primary/90"
                    : ""
                }`}
                onClick={() => setFilterSpecialty(null)}
              >
                Todos
              </Button>
              {LIBRARY_SPECIALTIES.map((s) => (
                <Button
                  key={s}
                  variant={filterSpecialty === s ? "default" : "outline"}
                  size="sm"
                  className={`h-7 rounded-full text-xs ${
                    filterSpecialty === s
                      ? "bg-vox-primary text-white hover:bg-vox-primary/90"
                      : ""
                  }`}
                  onClick={() => setFilterSpecialty(s)}
                >
                  {s}
                </Button>
              ))}
            </div>

            {/* Template cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredTemplates.map((template) => {
                const catKey = template.category as FormCategory
                const fieldCount = template.fields.filter(
                  (f) =>
                    f.type !== "section_header" && f.type !== "rich_text"
                ).length
                const isImporting = importing === template.id

                return (
                  <Card
                    key={template.id}
                    className="rounded-2xl border-border/40 transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="size-4 shrink-0 text-vox-primary" />
                            <h4 className="truncate text-sm font-semibold">
                              {template.name}
                            </h4>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            FORM_CATEGORY_COLORS[catKey] ?? ""
                          }`}
                        >
                          {FORM_CATEGORY_LABELS[catKey] ?? template.category}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {template.specialty}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {fieldCount} campos
                        </span>
                      </div>
                      <div className="mt-3 flex gap-1.5 border-t border-border/30 pt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => setPreviewing(template)}
                        >
                          <Eye className="size-3.5" />
                          Visualizar
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 gap-1.5 bg-vox-primary text-xs text-white hover:bg-vox-primary/90"
                          disabled={isImporting}
                          onClick={() => handleImport(template)}
                        >
                          {isImporting ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Check className="size-3.5" />
                          )}
                          Usar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
