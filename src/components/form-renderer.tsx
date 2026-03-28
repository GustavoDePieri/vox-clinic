"use client"

import { useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Star } from "lucide-react"
import type { FormField } from "@/types/forms"

// ============================================================
// Props
// ============================================================

export interface FormRendererProps {
  fields: FormField[]
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  readOnly?: boolean
  showValidation?: boolean
}

// ============================================================
// Conditional visibility check
// ============================================================

function isFieldVisible(
  field: FormField,
  values: Record<string, unknown>
): boolean {
  if (!field.conditional) return true
  const depValue = values[field.conditional.dependsOn]
  if (field.conditional.operator === "equals") {
    return depValue === field.conditional.value
  }
  return depValue !== field.conditional.value
}

// ============================================================
// Validation helpers
// ============================================================

function getFieldError(
  field: FormField,
  value: unknown,
  visible: boolean
): string | null {
  if (!visible) return null

  // Required check
  if (field.required) {
    if (value === undefined || value === null || value === "") {
      return "Campo obrigatorio"
    }
    if (field.type === "multiselect" && Array.isArray(value) && value.length === 0) {
      return "Selecione pelo menos uma opcao"
    }
  }

  if (value === undefined || value === null || value === "") return null

  const v = field.validation
  if (!v) return null

  // Number validation
  if (field.type === "number" && typeof value === "number") {
    if (v.min !== undefined && value < v.min) return `Valor minimo: ${v.min}`
    if (v.max !== undefined && value > v.max) return `Valor maximo: ${v.max}`
  }

  // String length validation
  if (typeof value === "string") {
    if (v.minLength !== undefined && value.length < v.minLength)
      return `Minimo ${v.minLength} caracteres`
    if (v.maxLength !== undefined && value.length > v.maxLength)
      return `Maximo ${v.maxLength} caracteres`
  }

  return null
}

// ============================================================
// Individual field renderers
// ============================================================

interface FieldRendererProps {
  field: FormField
  value: unknown
  error: string | null
  readOnly: boolean
  showValidation: boolean
  onValueChange: (fieldId: string, value: unknown) => void
}

function TextField({ field, value, error, readOnly, showValidation, onValueChange }: FieldRendererProps) {
  return (
    <div className="space-y-1.5">
      <FieldLabel field={field} />
      <Input
        placeholder={field.placeholder}
        value={(value as string) ?? ""}
        onChange={(e) => onValueChange(field.id, e.target.value)}
        readOnly={readOnly}
        className={cn(
          "rounded-xl",
          showValidation && error && "border-red-500 focus-visible:ring-red-500/20"
        )}
      />
      <FieldMeta field={field} error={error} showValidation={showValidation} />
    </div>
  )
}

function TextareaField({ field, value, error, readOnly, showValidation, onValueChange }: FieldRendererProps) {
  return (
    <div className="space-y-1.5">
      <FieldLabel field={field} />
      <Textarea
        placeholder={field.placeholder}
        value={(value as string) ?? ""}
        onChange={(e) => onValueChange(field.id, e.target.value)}
        readOnly={readOnly}
        rows={3}
        className={cn(
          "rounded-xl resize-none",
          showValidation && error && "border-red-500 focus-visible:ring-red-500/20"
        )}
      />
      <FieldMeta field={field} error={error} showValidation={showValidation} />
    </div>
  )
}

function NumberField({ field, value, error, readOnly, showValidation, onValueChange }: FieldRendererProps) {
  return (
    <div className="space-y-1.5">
      <FieldLabel field={field} />
      <Input
        type="number"
        placeholder={field.placeholder}
        value={value !== undefined && value !== null ? String(value) : ""}
        onChange={(e) => {
          const v = e.target.value
          onValueChange(field.id, v === "" ? null : Number(v))
        }}
        readOnly={readOnly}
        min={field.validation?.min}
        max={field.validation?.max}
        className={cn(
          "rounded-xl",
          showValidation && error && "border-red-500 focus-visible:ring-red-500/20"
        )}
      />
      <FieldMeta field={field} error={error} showValidation={showValidation} />
    </div>
  )
}

function SelectField({ field, value, error, readOnly, showValidation, onValueChange }: FieldRendererProps) {
  return (
    <div className="space-y-1.5">
      <FieldLabel field={field} />
      <Select
        value={(value as string) ?? ""}
        onValueChange={(v) => v !== undefined && onValueChange(field.id, v)}
        disabled={readOnly}
      >
        <SelectTrigger
          className={cn(
            "rounded-xl",
            showValidation && error && "border-red-500"
          )}
        >
          <SelectValue placeholder={field.placeholder || "Selecione..."} />
        </SelectTrigger>
        <SelectContent>
          {(field.options ?? []).map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldMeta field={field} error={error} showValidation={showValidation} />
    </div>
  )
}

function MultiselectField({ field, value, error, readOnly, showValidation, onValueChange }: FieldRendererProps) {
  const selected = Array.isArray(value) ? (value as string[]) : []

  const toggle = (opt: string) => {
    if (readOnly) return
    const next = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt]
    onValueChange(field.id, next)
  }

  return (
    <div className="space-y-1.5">
      <FieldLabel field={field} />
      <div
        className={cn(
          "flex flex-wrap gap-2 p-3 rounded-xl border bg-background min-h-[42px]",
          showValidation && error && "border-red-500"
        )}
      >
        {(field.options ?? []).map((opt) => {
          const isSelected = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              disabled={readOnly}
              className={cn(
                "px-3 py-1 text-sm rounded-lg border transition-colors",
                isSelected
                  ? "bg-vox-primary/10 border-vox-primary text-vox-primary"
                  : "bg-muted/50 border-border hover:bg-muted",
                readOnly && "cursor-default"
              )}
            >
              {opt}
            </button>
          )
        })}
      </div>
      <FieldMeta field={field} error={error} showValidation={showValidation} />
    </div>
  )
}

function CheckboxField({ field, value, readOnly, onValueChange }: FieldRendererProps) {
  return (
    <div className="flex items-center gap-3 py-1">
      <Switch
        checked={!!value}
        onCheckedChange={(checked) => !readOnly && onValueChange(field.id, checked)}
        disabled={readOnly}
      />
      <div>
        <Label className="text-sm font-medium">{field.label}</Label>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
      </div>
    </div>
  )
}

function RadioField({ field, value, error, readOnly, showValidation, onValueChange }: FieldRendererProps) {
  return (
    <div className="space-y-1.5">
      <FieldLabel field={field} />
      <div
        className={cn(
          "space-y-2",
          showValidation && error && "ring-1 ring-red-500 rounded-xl p-2"
        )}
      >
        {(field.options ?? []).map((opt) => (
          <label
            key={opt}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer transition-colors",
              value === opt
                ? "bg-vox-primary/5 border-vox-primary"
                : "bg-background border-border hover:bg-muted/50",
              readOnly && "cursor-default"
            )}
          >
            <div
              className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                value === opt ? "border-vox-primary" : "border-muted-foreground/40"
              )}
            >
              {value === opt && (
                <div className="w-2 h-2 rounded-full bg-vox-primary" />
              )}
            </div>
            <span className="text-sm">{opt}</span>
            <input
              type="radio"
              name={field.id}
              value={opt}
              checked={value === opt}
              onChange={() => !readOnly && onValueChange(field.id, opt)}
              className="sr-only"
              disabled={readOnly}
            />
          </label>
        ))}
      </div>
      <FieldMeta field={field} error={error} showValidation={showValidation} />
    </div>
  )
}

function DateField({ field, value, error, readOnly, showValidation, onValueChange }: FieldRendererProps) {
  return (
    <div className="space-y-1.5">
      <FieldLabel field={field} />
      <Input
        type="date"
        value={(value as string) ?? ""}
        onChange={(e) => onValueChange(field.id, e.target.value)}
        readOnly={readOnly}
        className={cn(
          "rounded-xl",
          showValidation && error && "border-red-500 focus-visible:ring-red-500/20"
        )}
      />
      <FieldMeta field={field} error={error} showValidation={showValidation} />
    </div>
  )
}

function RatingField({ field, value, error, readOnly, showValidation, onValueChange }: FieldRendererProps) {
  const max = field.ratingMax ?? 5
  const currentValue = typeof value === "number" ? value : 0

  return (
    <div className="space-y-1.5">
      <FieldLabel field={field} />
      <div className="flex items-center gap-1">
        {Array.from({ length: max }, (_, i) => {
          const starValue = i + 1
          const isFilled = starValue <= currentValue
          return (
            <button
              key={i}
              type="button"
              onClick={() => !readOnly && onValueChange(field.id, starValue)}
              disabled={readOnly}
              className={cn(
                "p-0.5 transition-colors",
                readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
              )}
              aria-label={`${starValue} de ${max}`}
            >
              <Star
                className={cn(
                  "w-6 h-6 transition-colors",
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-none text-muted-foreground/40"
                )}
              />
            </button>
          )
        })}
        {currentValue > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {currentValue}/{max}
          </span>
        )}
      </div>
      <FieldMeta field={field} error={error} showValidation={showValidation} />
    </div>
  )
}

function SectionHeader({ field }: { field: FormField }) {
  return (
    <div className="pt-4 pb-1 col-span-2">
      <h3 className="text-base font-semibold">{field.label}</h3>
      {field.description && (
        <p className="text-sm text-muted-foreground mt-0.5">
          {field.description}
        </p>
      )}
      <Separator className="mt-2" />
    </div>
  )
}

function RichTextField({ field }: { field: FormField }) {
  return (
    <div className="col-span-2 py-1">
      <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
        {field.label}
      </div>
      {field.description && (
        <p className="text-xs text-muted-foreground/70 mt-1">
          {field.description}
        </p>
      )}
    </div>
  )
}

// ============================================================
// Shared label & meta
// ============================================================

function FieldLabel({ field }: { field: FormField }) {
  return (
    <div className="flex items-center gap-1.5">
      <Label className="text-sm font-medium">{field.label}</Label>
      {field.required && (
        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-red-500 border-red-300">
          obrigatorio
        </Badge>
      )}
    </div>
  )
}

function FieldMeta({
  field,
  error,
  showValidation,
}: {
  field: FormField
  error: string | null
  showValidation: boolean
}) {
  return (
    <>
      {showValidation && error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      {field.description && field.type !== "checkbox" && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </>
  )
}

// ============================================================
// Main renderer
// ============================================================

export function FormRenderer({
  fields,
  values,
  onChange,
  readOnly = false,
  showValidation = false,
}: FormRendererProps) {
  const onValueChange = useCallback(
    (fieldId: string, value: unknown) => {
      onChange({ ...values, [fieldId]: value })
    },
    [values, onChange]
  )

  // Sort fields by order
  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.order - b.order),
    [fields]
  )

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
      {sortedFields.map((field) => {
        const visible = isFieldVisible(field, values)
        if (!visible) return null

        const value = values[field.id]
        const error = getFieldError(field, value, visible)
        const isHalf = field.width === "half"
        const isFullWidth =
          field.type === "section_header" ||
          field.type === "rich_text" ||
          !isHalf

        const wrapperClass = isFullWidth ? "col-span-2" : "col-span-1"

        const rendererProps: FieldRendererProps = {
          field,
          value,
          error,
          readOnly,
          showValidation,
          onValueChange,
        }

        return (
          <div key={field.id} className={wrapperClass}>
            {field.type === "text" && <TextField {...rendererProps} />}
            {field.type === "textarea" && <TextareaField {...rendererProps} />}
            {field.type === "number" && <NumberField {...rendererProps} />}
            {field.type === "select" && <SelectField {...rendererProps} />}
            {field.type === "multiselect" && (
              <MultiselectField {...rendererProps} />
            )}
            {field.type === "checkbox" && <CheckboxField {...rendererProps} />}
            {field.type === "radio" && <RadioField {...rendererProps} />}
            {field.type === "date" && <DateField {...rendererProps} />}
            {field.type === "rating" && <RatingField {...rendererProps} />}
            {field.type === "section_header" && <SectionHeader field={field} />}
            {field.type === "rich_text" && <RichTextField field={field} />}
          </div>
        )
      })}
    </div>
  )
}
