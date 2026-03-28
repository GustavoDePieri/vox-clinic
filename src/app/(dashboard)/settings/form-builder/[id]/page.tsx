"use client"

import { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Save,
  Loader2,
  Check,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Eye,
  EyeOff,
  Type,
  AlignLeft,
  Hash,
  Calendar,
  ChevronDown as ChevronDownIcon,
  ListChecks,
  CircleDot,
  CheckSquare,
  SlidersHorizontal,
  Heading,
  FileText,
  Star,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"
import {
  getFormTemplate,
  updateFormTemplate,
} from "@/server/actions/form-template"
import {
  FIELD_TYPES,
  FIELD_TYPE_GROUPS,
} from "@/types/form-builder"
import type { FormField } from "@/types/forms"

// ─── Icon map for field types ───

const FIELD_ICONS: Record<string, React.ElementType> = {
  text: Type,
  textarea: AlignLeft,
  number: Hash,
  date: Calendar,
  select: ChevronDownIcon,
  multiselect: ListChecks,
  radio: CircleDot,
  checkbox: CheckSquare,
  rating: Star,
  section_header: Heading,
  rich_text: FileText,
}

function generateFieldId() {
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export default function FormBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null

  // ─── Load template ───

  useEffect(() => {
    async function load() {
      try {
        const result = await getFormTemplate(id)
        if ("error" in result) {
          toast.error(result.error)
          router.push("/settings")
          return
        }
        setTemplateName(result.name)
        setFields(
          Array.isArray(result.fields) ? (result.fields as unknown as FormField[]) : []
        )
      } catch {
        toast.error("Erro ao carregar formulario")
        router.push("/settings")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  // ─── Save ───

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaved(false)
    try {
      const result = await updateFormTemplate(id, {
        name: templateName,
        fields,
      })
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setSaved(true)
      toast.success("Formulario salvo")
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao salvar"))
    } finally {
      setSaving(false)
    }
  }, [id, templateName, fields])

  // ─── Field operations ───

  function addField(type: FormField["type"]) {
    const info = FIELD_TYPES.find((ft) => ft.type === type)
    const newField: FormField = {
      id: generateFieldId(),
      type,
      label: info?.label ?? type,
      required: false,
      order: fields.length,
      ...(info?.hasOptions
        ? { options: ["Opcao 1", "Opcao 2"] }
        : {}),
      ...(type === "rating" ? { ratingMax: 5 } : {}),
    }
    setFields((prev) => [...prev, newField])
    setSelectedFieldId(newField.id)
    setPreviewMode(false)
  }

  function removeField(fieldId: string) {
    setFields((prev) => {
      const updated = prev.filter((f) => f.id !== fieldId)
      return updated.map((f, i) => ({ ...f, order: i }))
    })
    if (selectedFieldId === fieldId) setSelectedFieldId(null)
  }

  function moveField(fieldId: string, direction: "up" | "down") {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f.id === fieldId)
      if (idx < 0) return prev
      const target = direction === "up" ? idx - 1 : idx + 1
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next.map((f, i) => ({ ...f, order: i }))
    })
  }

  function updateField(fieldId: string, updates: Partial<FormField>) {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
    )
  }

  // ─── Loading state ───

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-60" />
        <div className="flex gap-4">
          <Skeleton className="h-[60vh] w-56 rounded-2xl" />
          <Skeleton className="h-[60vh] flex-1 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* ─── Top bar ─── */}
      <div className="mb-4 flex items-center gap-3">
        <Link href="/settings" className="shrink-0">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <Input
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="max-w-xs rounded-xl text-base font-semibold"
          placeholder="Nome do formulario"
        />
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              setPreviewMode(!previewMode)
              setSelectedFieldId(null)
            }}
          >
            {previewMode ? (
              <>
                <EyeOff className="size-4" />
                Editar
              </>
            ) : (
              <>
                <Eye className="size-4" />
                Visualizar
              </>
            )}
          </Button>
          <Button
            size="sm"
            className={`gap-2 transition-all ${
              saved
                ? "bg-vox-success text-white"
                : "bg-vox-primary text-white hover:bg-vox-primary/90"
            }`}
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Salvando...
              </>
            ) : saved ? (
              <>
                <Check className="size-4" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="size-4" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── Main content: palette + field list + config ─── */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* ─── Left: Field Palette (hidden in preview) ─── */}
        {!previewMode && (
          <div className="w-52 shrink-0 overflow-y-auto rounded-2xl border border-border/40 bg-card p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Adicionar Campo
            </p>
            {FIELD_TYPE_GROUPS.map((group) => (
              <div key={group.key} className="mb-4">
                <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {FIELD_TYPES.filter((ft) => ft.group === group.key).map(
                    (ft) => {
                      const Icon = FIELD_ICONS[ft.type] ?? FileText
                      return (
                        <button
                          key={ft.type}
                          onClick={() => addField(ft.type as FormField["type"])}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-vox-primary/10 hover:text-vox-primary active:scale-[0.98]"
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="truncate">{ft.label}</span>
                        </button>
                      )
                    }
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Center: Field List ─── */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-border/40 bg-card p-4">
          {fields.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-vox-primary/10">
                <FileText className="size-7 text-vox-primary" />
              </div>
              <h3 className="text-base font-medium">Formulario vazio</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Clique nos tipos de campo ao lado para adicionar ao formulario.
              </p>
            </div>
          ) : previewMode ? (
            /* Preview mode */
            <div className="mx-auto max-w-lg space-y-4">
              <h2 className="text-lg font-semibold">{templateName}</h2>
              {fields.map((field) => (
                <PreviewField key={field.id} field={field} />
              ))}
            </div>
          ) : (
            /* Edit mode */
            <div className="space-y-2">
              {fields.map((field, idx) => {
                const Icon = FIELD_ICONS[field.type] ?? FileText
                const isSelected = selectedFieldId === field.id
                return (
                  <div
                    key={field.id}
                    className={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? "border-vox-primary bg-vox-primary/5 shadow-sm"
                        : "border-border/40 hover:border-border hover:shadow-sm"
                    }`}
                    onClick={() => setSelectedFieldId(field.id)}
                  >
                    <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">
                          {field.label}
                        </span>
                        {field.required && (
                          <span className="text-xs text-vox-error">*</span>
                        )}
                      </div>
                      {field.description && (
                        <p className="truncate text-xs text-muted-foreground">
                          {field.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px] font-normal"
                    >
                      {FIELD_TYPES.find((ft) => ft.type === field.type)
                        ?.label ?? field.type}
                    </Badge>
                    {field.width === "half" && (
                      <Badge
                        variant="outline"
                        className="shrink-0 text-[10px] font-normal"
                      >
                        1/2
                      </Badge>
                    )}
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation()
                          moveField(field.id, "up")
                        }}
                      >
                        <ChevronUp className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={idx === fields.length - 1}
                        onClick={(e) => {
                          e.stopPropagation()
                          moveField(field.id, "down")
                        }}
                      >
                        <ChevronDown className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeField(field.id)
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ─── Right: Field Config (hidden in preview) ─── */}
        {!previewMode && selectedField && (
          <FieldConfigPanel
            field={selectedField}
            onUpdate={(updates) => updateField(selectedField.id, updates)}
            onRemove={() => removeField(selectedField.id)}
            onClose={() => setSelectedFieldId(null)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Field Config Panel ───

function FieldConfigPanel({
  field,
  onUpdate,
  onRemove,
  onClose,
}: {
  field: FormField
  onUpdate: (updates: Partial<FormField>) => void
  onRemove: () => void
  onClose: () => void
}) {
  const info = FIELD_TYPES.find((ft) => ft.type === field.type)
  const isLayoutOnly = info?.isLayoutOnly

  return (
    <div className="w-64 shrink-0 overflow-y-auto rounded-2xl border border-border/40 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Propriedades
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Label */}
        <div className="space-y-1.5">
          <Label className="text-xs">Label</Label>
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="h-8 rounded-lg text-sm"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-xs">Descricao</Label>
          <Input
            value={field.description ?? ""}
            onChange={(e) =>
              onUpdate({ description: e.target.value || undefined })
            }
            placeholder="Texto de ajuda"
            className="h-8 rounded-lg text-sm"
          />
        </div>

        {!isLayoutOnly && (
          <>
            {/* Placeholder */}
            {(field.type === "text" ||
              field.type === "textarea" ||
              field.type === "number") && (
              <div className="space-y-1.5">
                <Label className="text-xs">Placeholder</Label>
                <Input
                  value={field.placeholder ?? ""}
                  onChange={(e) =>
                    onUpdate({ placeholder: e.target.value || undefined })
                  }
                  className="h-8 rounded-lg text-sm"
                />
              </div>
            )}

            {/* Required */}
            <div className="flex items-center justify-between">
              <Label className="text-xs">Obrigatorio</Label>
              <Switch
                checked={field.required}
                onCheckedChange={(checked) => onUpdate({ required: !!checked })}
              />
            </div>

            {/* Width */}
            <div className="space-y-1.5">
              <Label className="text-xs">Largura</Label>
              <Select
                value={field.width ?? "full"}
                onValueChange={(v) =>
                  onUpdate({ width: v as "full" | "half" })
                }
              >
                <SelectTrigger className="h-8 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Largura total</SelectItem>
                  <SelectItem value="half">Meia largura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Options editor (select, multiselect, radio) */}
            {info?.hasOptions && (
              <OptionsEditor
                options={field.options ?? []}
                onChange={(options) => onUpdate({ options })}
              />
            )}

            {/* Rating max */}
            {field.type === "rating" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Estrelas max</Label>
                <Input
                  type="number"
                  value={field.ratingMax ?? 5}
                  min={1}
                  max={10}
                  onChange={(e) =>
                    onUpdate({ ratingMax: Number(e.target.value) || 5 })
                  }
                  className="h-8 rounded-lg text-sm"
                />
              </div>
            )}

            {/* Min/Max for number */}
            {field.type === "number" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Min</Label>
                  <Input
                    type="number"
                    value={field.validation?.min ?? ""}
                    onChange={(e) =>
                      onUpdate({
                        validation: {
                          ...field.validation,
                          min: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        },
                      })
                    }
                    className="h-8 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max</Label>
                  <Input
                    type="number"
                    value={field.validation?.max ?? ""}
                    onChange={(e) =>
                      onUpdate({
                        validation: {
                          ...field.validation,
                          max: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        },
                      })
                    }
                    className="h-8 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}

            {/* Validation (text fields) */}
            {(field.type === "text" || field.type === "textarea") && (
              <>
                <Separator className="my-2" />
                <p className="text-xs font-semibold text-muted-foreground">
                  Validacao
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Min chars</Label>
                    <Input
                      type="number"
                      value={field.validation?.minLength ?? ""}
                      onChange={(e) =>
                        onUpdate({
                          validation: {
                            ...field.validation,
                            minLength: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        })
                      }
                      className="h-8 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Max chars</Label>
                    <Input
                      type="number"
                      value={field.validation?.maxLength ?? ""}
                      onChange={(e) =>
                        onUpdate({
                          validation: {
                            ...field.validation,
                            maxLength: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        })
                      }
                      className="h-8 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Delete */}
        <Separator className="my-2" />
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-3.5" />
          Remover campo
        </Button>
      </div>
    </div>
  )
}

// ─── Options Editor ───

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[]
  onChange: (options: string[]) => void
}) {
  function addOption() {
    onChange([...options, `Opcao ${options.length + 1}`])
  }

  function removeOption(index: number) {
    onChange(options.filter((_, i) => i !== index))
  }

  function updateOption(index: number, value: string) {
    onChange(options.map((opt, i) => (i === index ? value : opt)))
  }

  function moveOption(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1
    if (target < 0 || target >= options.length) return
    const next = [...options]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">Opcoes</Label>
      <div className="space-y-1.5">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="flex flex-col">
              <button
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                disabled={i === 0}
                onClick={() => moveOption(i, "up")}
              >
                <ChevronUp className="size-3" />
              </button>
              <button
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                disabled={i === options.length - 1}
                onClick={() => moveOption(i, "down")}
              >
                <ChevronDown className="size-3" />
              </button>
            </div>
            <Input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              className="h-7 flex-1 rounded-lg text-xs"
            />
            <button
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeOption(i)}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 w-full gap-1.5 text-xs"
        onClick={addOption}
      >
        <Plus className="size-3" />
        Adicionar opcao
      </Button>
    </div>
  )
}

// ─── Preview Field Component ───

function PreviewField({ field }: { field: FormField }) {
  if (field.type === "section_header") {
    return (
      <div className="pt-4 first:pt-0">
        <h3 className="text-base font-semibold">{field.label}</h3>
        {field.description && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {field.description}
          </p>
        )}
        <Separator className="mt-2" />
      </div>
    )
  }

  if (field.type === "rich_text") {
    return (
      <p className="text-sm italic text-muted-foreground">{field.label}</p>
    )
  }

  return (
    <div
      className={
        field.width === "half"
          ? "inline-block w-[48%] mr-[2%] align-top"
          : ""
      }
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          {field.label}
          {field.required && (
            <span className="ml-0.5 text-vox-error">*</span>
          )}
        </label>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}

        {field.type === "text" && (
          <input
            type="text"
            placeholder={field.placeholder}
            disabled
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm opacity-70"
          />
        )}

        {field.type === "textarea" && (
          <textarea
            rows={3}
            placeholder={field.placeholder}
            disabled
            className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm opacity-70"
          />
        )}

        {field.type === "number" && (
          <input
            type="number"
            placeholder={field.placeholder}
            disabled
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm opacity-70"
          />
        )}

        {field.type === "date" && (
          <input
            type="date"
            disabled
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm opacity-70"
          />
        )}

        {field.type === "select" && (
          <select
            disabled
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm opacity-70"
          >
            <option value="">Selecione...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}

        {field.type === "radio" && (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input type="radio" disabled name={field.id} />
                {opt}
              </label>
            ))}
          </div>
        )}

        {field.type === "multiselect" && (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => (
              <span
                key={opt}
                className="rounded-lg border border-border bg-muted/50 px-3 py-1 text-sm"
              >
                {opt}
              </span>
            ))}
          </div>
        )}

        {field.type === "checkbox" && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" disabled />
            {field.label}
          </label>
        )}

        {field.type === "rating" && (
          <div className="flex items-center gap-1">
            {Array.from({ length: field.ratingMax ?? 5 }, (_, i) => (
              <Star
                key={i}
                className="size-5 text-muted-foreground/40"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
