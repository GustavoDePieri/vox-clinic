// Form Builder — TypeScript types for dynamic form fields, sections, templates, and responses

export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "date"
  | "rating"
  | "section_header"
  | "rich_text"

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  description?: string
  placeholder?: string
  required: boolean
  options?: string[] // for select, multiselect, radio
  validation?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
  }
  conditional?: {
    dependsOn: string
    operator: "equals" | "not_equals"
    value: unknown
  }
  defaultValue?: unknown
  order: number
  width?: "full" | "half"
  ratingMax?: number // for rating type, default 5
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fieldIds: string[]
}

export interface FormTemplateData {
  id: string
  name: string
  description?: string
  category?: string
  fields: FormField[]
  sections?: FormSection[]
  isActive: boolean
  isDefault: boolean
  allowMultiple: boolean
  version: number
  responseCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface FormResponseData {
  id: string
  templateId: string
  templateName?: string
  patientId: string
  appointmentId?: string
  answers: Record<string, unknown>
  templateVersion: number
  status: string
  completedAt?: string
  completedBy?: string
  createdAt: string
  updatedAt?: string
}
