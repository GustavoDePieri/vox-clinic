# Form Builder — Custom Forms & Anamnesis Templates

> Feature doc for the dynamic form builder system in VoxClinic.

## Overview

### Current Limitations

VoxClinic currently handles anamnesis through a simple JSON template system:
- `Workspace.anamnesisTemplate` stores a flat array of questions (generated during AI onboarding)
- Patient anamnesis data is stored as `customData` JSON on the Patient model
- No support for conditional fields, sections, field validation, or rich field types
- No way to create different forms for different appointment types or procedures
- No reusable template library across specialties
- Anamnesis data is not structured enough for clinical analytics

### Goal

Build a flexible form builder that allows professionals to create custom forms for any clinical workflow — anamnesis, intake questionnaires, follow-up assessments, consent forms, treatment evaluations, and more. Forms are reusable templates with structured responses linked to patients and optionally to appointments.

## Data Model

### FormTemplate

```prisma
model FormTemplate {
  id              String   @id @default(cuid())
  workspaceId     String
  workspace       Workspace @relation(fields: [workspaceId], references: [id])

  // Metadata
  name            String   // e.g., "Anamnese Odontologica", "Avaliacao Nutricional"
  description     String?
  category        String?  // e.g., "anamnese", "avaliacao", "consentimento", "retorno"
  icon            String?  // Lucide icon name

  // Form structure
  fields          Json     // FormField[] — ordered array of field definitions
  sections        Json?    // FormSection[] — optional grouping of fields into sections

  // Settings
  isActive        Boolean  @default(true)
  isDefault       Boolean  @default(false) // Default form for new patients
  isSystemTemplate Boolean @default(false) // Pre-built template (not editable)
  allowMultiple   Boolean  @default(true)  // Can be filled multiple times per patient
  requiresSignature Boolean @default(false) // Requires patient/professional signature

  // Versioning
  version         Int      @default(1)
  previousVersionId String? // Link to previous version (for audit trail)

  // Usage stats
  responseCount   Int      @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  responses       FormResponse[]

  @@index([workspaceId])
  @@index([workspaceId, category])
}

model FormResponse {
  id              String   @id @default(cuid())
  workspaceId     String
  workspace       Workspace @relation(fields: [workspaceId], references: [id])

  // Relationships
  templateId      String
  template        FormTemplate @relation(fields: [templateId], references: [id])
  patientId       String
  patient         Patient  @relation(fields: [patientId], references: [id])
  appointmentId   String?  // Optional link to appointment
  appointment     Appointment? @relation(fields: [appointmentId], references: [id])

  // Response data
  data            Json     // { [fieldId]: value } — structured response data
  completedFields Int      @default(0) // Count of filled fields (for progress tracking)
  totalFields     Int      @default(0) // Total required fields

  // Status
  status          String   @default("draft") // "draft" | "completed" | "reviewed"
  completedAt     DateTime?
  reviewedBy      String?  // User ID who reviewed
  reviewedAt      DateTime?
  notes           String?  // Professional notes on this response

  // Signature (if required)
  signatureUrl    String?  // Stored in Supabase Storage

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([workspaceId, patientId])
  @@index([workspaceId, templateId])
  @@index([appointmentId])
}
```

## Field Types

### 15 Supported Field Types

| Type | Description | Value Type | Example |
|---|---|---|---|
| `text` | Single-line text input | `string` | Name, allergy name |
| `textarea` | Multi-line text area | `string` | Detailed complaint, observations |
| `number` | Numeric input with optional min/max | `number` | Age, weight, height, pressure |
| `select` | Single-choice dropdown | `string` | Blood type, gender |
| `multiselect` | Multi-choice with checkboxes | `string[]` | Chronic diseases, medications |
| `radio` | Single-choice radio group | `string` | Yes/No, severity level |
| `checkbox` | Single boolean checkbox | `boolean` | Consent, "Has allergies?" |
| `date` | Date picker | `string` (ISO) | Last visit date, surgery date |
| `time` | Time picker | `string` (HH:mm) | Symptom occurrence time |
| `scale` | Numeric scale (e.g., 0-10 pain) | `number` | Pain scale, satisfaction |
| `file` | File upload (image/PDF) | `string` (URL) | Exam results, X-ray |
| `signature` | Signature pad | `string` (URL) | Patient consent signature |
| `heading` | Section heading (no value) | `null` | Visual separator |
| `paragraph` | Informational text (no value) | `null` | Instructions, disclaimers |
| `body_map` | Body diagram with clickable regions | `Json` | Pain location, treatment areas |

### Field Definition Schema

```typescript
interface FormField {
  id: string           // Unique field ID (cuid)
  type: FieldType      // One of the 15 types above
  label: string        // Display label
  description?: string // Help text below the field
  placeholder?: string // Placeholder text
  required: boolean    // Mandatory field
  order: number        // Display order

  // Type-specific options
  options?: { label: string; value: string }[] // For select, multiselect, radio
  min?: number         // For number, scale
  max?: number         // For number, scale
  step?: number        // For number, scale
  rows?: number        // For textarea (default 3)
  accept?: string      // For file (e.g., "image/*,.pdf")
  maxFileSize?: number // For file (in MB, default 10)

  // Conditional display
  condition?: {
    fieldId: string    // Show this field only when...
    operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than"
    value: string | number | boolean
  }

  // Validation
  validation?: {
    pattern?: string   // Regex pattern
    minLength?: number
    maxLength?: number
    customMessage?: string // Custom error message
  }

  // Layout
  width?: "full" | "half" // Column span (default: full)
  section?: string     // Section ID this field belongs to
}

interface FormSection {
  id: string
  title: string
  description?: string
  collapsible: boolean
  defaultCollapsed: boolean
  order: number
}
```

## Form Builder UI

### 3-Panel Editor

The form builder uses a 3-panel layout accessible from Settings or a dedicated page:

```
/settings/forms              — List all form templates
/settings/forms/new          — Create new form
/settings/forms/[id]/edit    — Edit existing form
```

**Layout:**

```
+------------------+------------------------+------------------+
|                  |                        |                  |
|  Field Palette   |    Form Canvas         |  Field Config    |
|                  |                        |                  |
|  [Text]          |  +--Section 1-------+  |  Label: ______   |
|  [Textarea]      |  | Q1: Full name    |  |  Required: [x]   |
|  [Number]        |  | Q2: Date of      |  |  Placeholder: _  |
|  [Select]        |  |     birth        |  |  Condition: ...  |
|  [Multiselect]   |  +--Section 2-------+  |  Validation: ... |
|  [Radio]         |  | Q3: Main         |  |                  |
|  [Checkbox]      |  |     complaint    |  |  [Delete Field]  |
|  [Date]          |  | Q4: Pain scale   |  |                  |
|  [Scale]         |  |     [0----10]    |  |                  |
|  [File]          |  |                  |  |                  |
|  [Heading]       |  +------------------+  |                  |
|  [Paragraph]     |                        |                  |
+------------------+------------------------+------------------+
```

**Interactions:**
- **Drag from palette** → Drop onto canvas to add field
- **Drag on canvas** → Reorder fields (via @dnd-kit, already in project)
- **Click field on canvas** → Opens config panel on right
- **Section management** → Add/rename/reorder/delete sections
- **Preview mode** → Toggle to see form as patient/professional would see it
- **Auto-save** → Debounced save on every change (draft status)

### Field Palette (Left Panel)

Organized by category:
- **Texto:** text, textarea, heading, paragraph
- **Escolha:** select, multiselect, radio, checkbox
- **Numerico:** number, scale
- **Data/Hora:** date, time
- **Arquivo:** file, signature
- **Especial:** body_map

### Form Canvas (Center Panel)

- Shows fields in order with section grouping
- Each field shows: icon + label + type badge + required indicator
- Drag handle on left for reordering
- Click to select (highlights with teal border)
- Inline preview of field appearance
- Section headers are collapsible
- "Add Section" button at bottom

### Field Config (Right Panel)

Shows when a field is selected on the canvas:
- Label input
- Description input
- Required toggle
- Placeholder input
- Type-specific options (e.g., options editor for select/radio/multiselect)
- Conditional visibility settings
- Validation rules
- Width selector (full/half)
- Delete button (with confirmation)

## Template Library

### Pre-Built Templates per Specialty

Ship with curated templates that workspaces can clone and customize:

#### General Medicine
- Anamnese Geral (comprehensive medical history)
- Retorno / Follow-up
- Termo de Consentimento (consent form)

#### Dentistry (Odontologia)
- Anamnese Odontologica (dental history, orthodontic assessment)
- Avaliacao Periodontal (periodontal evaluation)
- Planejamento de Tratamento (treatment planning)

#### Nutrition (Nutricao)
- Anamnese Nutricional (dietary habits, intolerances, goals)
- Recordatorio Alimentar 24h (24-hour food recall)
- Avaliacao Antropometrica (body measurements)

#### Psychology (Psicologia)
- Anamnese Psicologica (mental health history)
- Escala de Ansiedade (anxiety assessment scale)
- Avaliacao Inicial (initial evaluation)

#### Aesthetics (Estetica)
- Anamnese Estetica (skin type, allergies, treatments)
- Avaliacao Facial (facial assessment with body map)
- Consentimento para Procedimento (procedure consent)

#### Physiotherapy (Fisioterapia)
- Anamnese Fisioterapeutica (pain assessment, mobility)
- Avaliacao Postural (postural evaluation with body map)
- Evolucao de Tratamento (treatment progress)

### Template Library UI

```
/settings/forms/library      — Browse pre-built templates
```

- Grid of template cards organized by specialty
- Preview button (shows form without editing)
- "Usar este modelo" button → clones template into workspace
- Cloned templates are fully editable
- Badge: "Modelo do sistema" vs "Personalizado"

## Form Rendering Engine

### Renderer Component

`src/components/form-renderer.tsx` — Reusable component that renders any FormTemplate:

```typescript
interface FormRendererProps {
  template: FormTemplate
  initialData?: Record<string, unknown>  // Pre-filled values
  onSubmit: (data: Record<string, unknown>) => void
  onSaveDraft?: (data: Record<string, unknown>) => void
  readOnly?: boolean
  showProgress?: boolean  // Progress bar (X of Y fields completed)
}
```

**Features:**
- Renders all 15 field types
- Handles conditional field visibility (evaluates conditions in real-time)
- Client-side validation (required, pattern, min/max, custom)
- Section collapsing
- Progress indicator
- Auto-save draft (debounced)
- Read-only mode for viewing completed responses
- Print-friendly CSS for printing forms

### Validation

- Required fields checked on submit
- Type-specific validation (number ranges, date formats, file size)
- Custom regex patterns
- Conditional required (field only required when condition is met)
- Error messages in pt-BR
- Visual indicators: red border + error text below field

## Integration Points

### Appointments

When creating or completing an appointment:
- Option to attach a form response
- "Preencher formulario" button on appointment detail
- Select which template to use (defaults to workspace default)
- Form response linked via `FormResponse.appointmentId`
- AI consultation summary can reference form data

### Patient Profile

New tab on patient detail page: **"Formularios"**
- List all form responses for this patient
- Chronological order with template name, date, status
- Click to view completed form (read-only)
- "Novo formulario" button to fill a new form
- Filter by template category

### AI Voice Integration

When processing voice consultations, the AI can:
- Pre-fill form fields from transcript data (future V2)
- Reference existing form responses in consultation summary
- Suggest which form template to use based on appointment type

### Calendar / Scheduling

- When scheduling an appointment, optionally attach a form template
- "Pre-consulta" forms can be sent to patient before appointment (future V2)
- Form completion status shown on appointment card

## Migration Strategy

### Existing Anamnesis Data

Current anamnesis data lives in:
1. `Workspace.anamnesisTemplate` — the template (questions array)
2. `Patient.customData` — the responses

Migration approach:

1. **Auto-generate FormTemplate** from existing `anamnesisTemplate`:
   - Each question becomes a `text` or `textarea` field
   - Template named "Anamnese [Profession]"
   - Marked as workspace default

2. **Auto-generate FormResponse** from existing `customData`:
   - For each patient with `customData`, create a FormResponse
   - Map old question keys to new field IDs
   - Status: "completed"
   - Date: patient's createdAt

3. **Keep backward compatibility:**
   - `Patient.customData` remains populated (read-only, for old UI)
   - New form responses go to FormResponse model
   - Gradual migration: old anamnesis tab shows both old data and new form responses

### Migration Script

```typescript
async function migrateAnamnesis(workspaceId: string) {
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: { patients: true }
  })

  if (!workspace?.anamnesisTemplate) return

  const template = workspace.anamnesisTemplate as Array<{ question: string; type?: string }>

  // Create FormTemplate
  const fields = template.map((q, index) => ({
    id: createId(),
    type: q.type === "boolean" ? "radio" : "textarea",
    label: q.question,
    required: false,
    order: index,
    options: q.type === "boolean"
      ? [{ label: "Sim", value: "sim" }, { label: "Nao", value: "nao" }]
      : undefined,
  }))

  const formTemplate = await db.formTemplate.create({
    data: {
      workspaceId,
      name: `Anamnese - ${workspace.professionType}`,
      category: "anamnese",
      fields,
      isDefault: true,
    }
  })

  // Migrate patient responses
  for (const patient of workspace.patients) {
    if (!patient.customData || Object.keys(patient.customData as object).length === 0) continue

    const data: Record<string, unknown> = {}
    const customData = patient.customData as Record<string, unknown>

    fields.forEach((field, index) => {
      const oldKey = template[index].question
      if (customData[oldKey] !== undefined) {
        data[field.id] = customData[oldKey]
      }
    })

    await db.formResponse.create({
      data: {
        workspaceId,
        templateId: formTemplate.id,
        patientId: patient.id,
        data,
        status: "completed",
        completedAt: patient.createdAt,
        completedFields: Object.keys(data).length,
        totalFields: fields.filter(f => f.required).length,
      }
    })
  }
}
```

## Implementation Plan

### Phase 1: Data Model & Core (2 days)

- Add Prisma models: `FormTemplate`, `FormResponse`
- Create server actions: `form-template.ts` (CRUD), `form-response.ts` (CRUD)
- Define TypeScript types for FormField, FormSection
- Zod validation schemas for field definitions and responses

### Phase 2: Form Renderer (3 days)

- Build `FormRenderer` component with all 15 field types
- Conditional field visibility logic
- Client-side validation
- Progress tracking
- Read-only mode
- Auto-save draft
- Print-friendly CSS

### Phase 3: Form Builder UI (4 days)

- 3-panel editor layout
- Field palette with drag-to-add
- Canvas with drag-to-reorder (@dnd-kit)
- Field config panel
- Section management
- Preview mode
- Template list page (`/settings/forms`)
- Create/edit pages

### Phase 4: Template Library & Integration (2 days)

- Pre-built templates (at least 2 per specialty, ~12 total)
- Template library browsing and cloning UI
- Patient profile "Formularios" tab
- Appointment form attachment
- Dashboard/calendar form status indicators

### Phase 5: Migration & Polish (2 days)

- Migration script for existing anamnesis data
- Backward compatibility with old anamnesis UI
- Edge cases (deleted templates with existing responses, version handling)
- Performance optimization (lazy loading form builder)
- Manual testing across specialties

**Total estimated: 13 days**

## Testing

### Unit Tests

- Field type rendering for all 15 types
- Conditional visibility evaluation
- Validation logic (required, pattern, min/max)
- Form data serialization/deserialization
- Template cloning preserves all field properties
- Section ordering and field grouping

### Integration Tests

- Create template → fill form → save response → view response
- Conditional fields show/hide based on other field values
- File upload fields store files in Supabase and save URL
- Form response linked to patient and appointment
- Migration script converts old anamnesis data correctly
- Multiple responses per patient (when allowMultiple is true)
- Draft auto-save and resume

### Manual Testing

- Form builder drag-and-drop on desktop and tablet
- Form rendering on mobile (responsive layout)
- Print output for completed forms
- Template library browse and clone flow
- Patient detail "Formularios" tab with multiple responses
- Body map field interaction (click regions)
- Signature pad on touch devices
- Scale/slider field on mobile
