// Form Builder UI types — extends the base form types with builder-specific metadata
// Base form field types live in @/types/forms

export type { FormField, FormFieldType, FormSection, FormTemplateData, FormResponseData } from "./forms"

export type FormCategory =
  | "anamnese"
  | "avaliacao"
  | "consentimento"
  | "retorno"
  | "custom"

export const FORM_CATEGORY_LABELS: Record<FormCategory, string> = {
  anamnese: "Anamnese",
  avaliacao: "Avaliacao",
  consentimento: "Consentimento",
  retorno: "Retorno",
  custom: "Personalizado",
}

export const FORM_CATEGORY_COLORS: Record<FormCategory, string> = {
  anamnese: "bg-blue-100 text-blue-700 border-blue-200",
  avaliacao: "bg-purple-100 text-purple-700 border-purple-200",
  consentimento: "bg-amber-100 text-amber-700 border-amber-200",
  retorno: "bg-emerald-100 text-emerald-700 border-emerald-200",
  custom: "bg-gray-100 text-gray-700 border-gray-200",
}

export interface FieldTypeInfo {
  type: string
  label: string
  icon: string
  group: "basico" | "escolha" | "layout"
  description: string
  hasOptions?: boolean
  hasMinMax?: boolean
  isLayoutOnly?: boolean
}

export const FIELD_TYPES: FieldTypeInfo[] = [
  // Basico
  { type: "text", label: "Texto", icon: "Type", group: "basico", description: "Texto curto (uma linha)" },
  { type: "textarea", label: "Texto longo", icon: "AlignLeft", group: "basico", description: "Texto livre (multiplas linhas)" },
  { type: "number", label: "Numero", icon: "Hash", group: "basico", description: "Valor numerico", hasMinMax: true },
  { type: "date", label: "Data", icon: "Calendar", group: "basico", description: "Seletor de data" },
  // Escolha
  { type: "select", label: "Selecao unica", icon: "ChevronDown", group: "escolha", description: "Dropdown com opcoes", hasOptions: true },
  { type: "multiselect", label: "Multipla escolha", icon: "ListChecks", group: "escolha", description: "Multiplas opcoes", hasOptions: true },
  { type: "radio", label: "Radio", icon: "CircleDot", group: "escolha", description: "Escolha unica (radio)", hasOptions: true },
  { type: "checkbox", label: "Checkbox", icon: "CheckSquare", group: "escolha", description: "Sim/Nao (booleano)" },
  { type: "rating", label: "Avaliacao", icon: "Star", group: "escolha", description: "Escala de estrelas", hasMinMax: true },
  // Layout
  { type: "section_header", label: "Cabecalho", icon: "Heading", group: "layout", description: "Titulo de secao", isLayoutOnly: true },
  { type: "rich_text", label: "Texto informativo", icon: "FileText", group: "layout", description: "Instrucoes ou informacoes", isLayoutOnly: true },
]

export const FIELD_TYPE_GROUPS = [
  { key: "basico" as const, label: "Basico" },
  { key: "escolha" as const, label: "Escolha" },
  { key: "layout" as const, label: "Layout" },
]

// Template from the library (not yet imported into workspace)
export interface LibraryTemplate {
  id: string
  name: string
  description: string
  category: FormCategory
  specialty: string
  fields: import("./forms").FormField[]
  sections?: import("./forms").FormSection[]
}
