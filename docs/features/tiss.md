# TISS — Troca de Informacao em Saude Suplementar

> Feature doc for ANS/TISS billing integration in VoxClinic.

## Overview

TISS (Troca de Informacao em Saude Suplementar) is the mandatory standard defined by ANS (Agencia Nacional de Saude Suplementar) for all data exchange between healthcare providers and health insurance operators (operadoras) in Brazil. Any clinic that accepts convenio patients must generate TISS XML guides to bill the operator for services rendered.

### TISS Guide Types

| Guide Type | Code | Use Case |
|---|---|---|
| Guia de Consulta | `guia_consulta` | Standard office visits |
| Guia SP/SADT | `guia_sp_sadt` | Procedures, exams, therapies |
| Guia de Internacao | `guia_internacao` | Hospital admissions (out of scope V1) |
| Guia de Honorarios | `guia_honorarios` | Professional fees for hospital procedures (out of scope V1) |
| Guia Odontologica | `guia_odontologica` | Dental procedures (out of scope V1) |

### ANS TISS Versions

The current standard is **TISS 4.01.00** (as of 2025). VoxClinic will implement against this version with a version field in config to allow future upgrades.

## Scope

### V1 (MVP)

- **Guia de Consulta** — covers the majority of use cases for clinics (doctors, nutritionists, psychologists)
- **Guia SP/SADT** — covers procedures, exams, and therapies (aestheticians, physiotherapists, labs)
- Operadora (insurance operator) management
- TISS XML generation compliant with ANS 4.01.00 schema
- Guide lifecycle: draft → submitted → paid / denied / appealed
- Batch (lote) generation for multiple guides
- PDF printing of individual guides
- Integration with Financial module for receivables tracking

### V2 (Future)

- Guia de Internacao, Honorarios, Odontologica
- Electronic submission via web services (when operators support it)
- Automatic TUSS code suggestion from AI transcription
- Glosa (denial) management workflow
- ANS XML schema validation before submission

## Data Model

### New Models

```prisma
model Operadora {
  id              String   @id @default(cuid())
  workspaceId     String
  workspace       Workspace @relation(fields: [workspaceId], references: [id])

  // ANS registration
  registroAns     String   // 6-digit ANS registry number
  razaoSocial     String
  nomeFantasia    String?
  cnpj            String

  // Billing config
  codigoPrestador String?  // Provider code assigned by this operator
  tussTableVersion String? // e.g., "TUSS 2024" — which fee table to use
  defaultCbos     String?  // Default CBOS code for this operator

  // Contact
  email           String?
  phone           String?
  notes           String?

  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  guides          TissGuide[]
  tissConfig      TissConfig?

  @@unique([workspaceId, registroAns])
  @@index([workspaceId])
}

model TissConfig {
  id              String   @id @default(cuid())
  workspaceId     String
  workspace       Workspace @relation(fields: [workspaceId], references: [id])

  // Provider identification
  cnes            String   // CNES number (Cadastro Nacional de Estabelecimentos de Saude)
  cnpjPrestador   String   // Clinic CNPJ
  razaoSocial     String   // Clinic legal name
  codigoCbos      String   // CBOS occupation code (e.g., "225120" for dentist)

  // Professional identification
  conselhoProfissional String // e.g., "CRM", "CRO", "CRN"
  numeroConselho  String   // Registration number
  ufConselho      String   // State of registration (e.g., "SP")

  // TISS versioning
  tissVersion     String   @default("4.01.00")

  // Numbering
  nextGuideNumber Int      @default(1) // Auto-increment guide number
  nextBatchNumber Int      @default(1) // Auto-increment batch number

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([workspaceId])
}

model TissGuide {
  id              String   @id @default(cuid())
  workspaceId     String
  workspace       Workspace @relation(fields: [workspaceId], references: [id])

  // Relationships
  patientId       String
  patient         Patient  @relation(fields: [patientId], references: [id])
  appointmentId   String?
  appointment     Appointment? @relation(fields: [appointmentId], references: [id])
  operadoraId     String
  operadora       Operadora @relation(fields: [operadoraId], references: [id])

  // Guide identification
  guideType       String   // "guia_consulta" | "guia_sp_sadt"
  guideNumber     String   // Sequential number (unique per workspace)
  operatorGuideNumber String? // Number assigned by operator (after submission)

  // Authorization
  authorizationNumber String? // Numero da guia do operador / autorizacao
  authorizationDate   DateTime?
  validUntil          DateTime? // Authorization expiry

  // Clinical data
  procedures      Json     // [{ tussCode, description, quantity, unitPrice, totalPrice }]
  cid10Principal  String?  // Primary CID-10 code
  cid10Secondary  String?  // Secondary CID-10
  observations    String?

  // Beneficiary data (snapshot at time of guide creation)
  beneficiaryCard String   // Carteirinha number
  beneficiaryName String
  beneficiaryCpf  String?
  beneficiaryDob  DateTime?
  beneficiaryPlan String?  // Plan name/code

  // Financial
  totalAmount     Decimal  @db.Decimal(10, 2)
  paidAmount      Decimal? @db.Decimal(10, 2)
  glosaAmount     Decimal? @db.Decimal(10, 2) // Denied amount

  // Lifecycle
  status          String   @default("draft")
  // draft → submitted → in_review → paid | partial_paid | denied | appealed | cancelled
  submittedAt     DateTime?
  paidAt          DateTime?
  deniedAt        DateTime?

  // Batch
  batchId         String?  // Lote number (when submitted in batch)

  // XML
  xmlContent      String?  @db.Text // Generated XML
  xmlHash         String?  // SHA-256 hash for integrity

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([workspaceId, guideNumber])
  @@index([workspaceId, status])
  @@index([workspaceId, operadoraId])
  @@index([workspaceId, patientId])
  @@index([appointmentId])
}
```

### Patient Model Extension

Add structured insurance data to the Patient model (currently `insurance` is a free-text string):

```prisma
// Add to Patient model
insuranceData   Json?    // Structured: { operadoraId, cardNumber, planName, planCode, validUntil }
```

This allows linking patients to specific Operadoras while keeping the existing `insurance` field as a display name for backward compatibility.

## XML Generation

### Approach

Use the `xml-builder` npm package (already lightweight, no heavy dependencies) to generate TISS-compliant XML. The XML must conform to the ANS XSD schemas.

### Guia de Consulta Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                   xsi:schemaLocation="http://www.ans.gov.br/padroes/tiss/schemas tissV4_01_00.xsd">
  <ans:cabecalho>
    <ans:identificacaoTransacao>
      <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>
      <ans:sequencialTransacao>1</ans:sequencialTransacao>
      <ans:dataRegistroTransacao>2026-03-28</ans:dataRegistroTransacao>
      <ans:horaRegistroTransacao>14:30:00</ans:horaRegistroTransacao>
    </ans:identificacaoTransacao>
    <ans:origem>
      <ans:identificacaoPrestador>
        <ans:CNPJ>12345678000100</ans:CNPJ>
      </ans:identificacaoPrestador>
    </ans:origem>
    <ans:destino>
      <ans:registroANS>123456</ans:registroANS>
    </ans:destino>
    <ans:versaoPadrao>4.01.00</ans:versaoPadrao>
  </ans:cabecalho>
  <ans:prestadorParaOperadora>
    <ans:loteGuias>
      <ans:numeroLote>1</ans:numeroLote>
      <ans:guiasTISS>
        <ans:guiaConsulta>
          <!-- Guide content here -->
        </ans:guiaConsulta>
      </ans:guiasTISS>
    </ans:loteGuias>
  </ans:prestadorParaOperadora>
  <ans:epilogo>
    <ans:hash>SHA256_HASH</ans:hash>
  </ans:epilogo>
</ans:mensagemTISS>
```

### Key Implementation Files

```
src/lib/tiss/
  types.ts          — TypeScript types matching ANS schema
  xml-builder.ts    — XML generation functions (guiaConsulta, guiaSPSADT, lote)
  hash.ts           — SHA-256 hash calculation for epilogo
  validation.ts     — Pre-generation validation (required fields, TUSS codes)
  tuss-codes.ts     — Common TUSS procedure codes lookup table
```

### XML Generation Flow

1. User creates guide from appointment or manually
2. System populates guide fields from patient, appointment, and operadora data
3. On "Generate XML", `buildGuiaConsultaXml()` or `buildGuiaSPSADTXml()` creates the XML string
4. SHA-256 hash computed and inserted into `<ans:epilogo>`
5. XML stored in `TissGuide.xmlContent`
6. User can download XML file or print guide as PDF

## UI/UX

### Financial Page — TISS Tab

Add a new "TISS" tab to the existing Financial page (`/financial`), alongside the existing tabs (Receitas, Despesas, Contas a Receber, Fluxo de Caixa, NFS-e, Tabela de Precos).

```
/financial?tab=tiss
```

**TISS Tab Layout:**
- **Summary cards:** Total pending, Total submitted, Total paid this month, Total denied
- **Filter bar:** Status filter (chips), Operadora filter (select), Date range, Search (guide number / patient name)
- **Guide list:** Table with columns: Numero, Paciente, Operadora, Tipo, Valor, Status (badge), Data, Actions
- **Actions per guide:** View, Edit (if draft), Generate XML, Download XML, Print, Change status
- **Batch actions:** Select multiple → "Gerar Lote XML" (creates batch XML with all selected guides)

### Create Guide Dialog

Triggered from:
1. "Nova Guia TISS" button on TISS tab
2. Quick action on appointment card (if patient has insurance)
3. After completing a consultation (if patient has insurance)

**Dialog Flow:**
1. Select patient (pre-filled if from appointment)
2. Select operadora (auto-detected from patient's insuranceData)
3. Select guide type (Consulta or SP/SADT)
4. Fill procedures (TUSS code autocomplete + description + quantity + price)
5. Fill CID-10 (autocomplete from existing CID-10 database)
6. Review and create (draft status)

### Operadora Management

New section in Settings page or sub-page:

```
/settings?tab=operadoras
```

- List all operadoras with ANS code, name, provider code
- Add/Edit operadora dialog
- TISS Config section (CNES, CNPJ, professional council data)
- Per-operadora fee table configuration (future V2)

### Settings — TISS Configuration

Add TISS config section to Settings page:

```
/settings?tab=tiss
```

Fields:
- CNES number
- CNPJ Prestador
- Razao Social
- Conselho Profissional (select: CRM, CRO, CRN, CRP, CREFITO, etc.)
- Numero do Conselho
- UF do Conselho
- CBOS code (autocomplete)
- TISS version (read-only, shows "4.01.00")

## Integration Points

### Appointments → TISS

When an appointment is completed for a patient with insurance:
- Show "Gerar Guia TISS" button on appointment detail
- Pre-fill guide with appointment data (date, procedures, patient, duration)
- Map workspace procedures to TUSS codes (configurable mapping in settings)

### Patients → TISS

- Patient detail page shows insurance card info in structured format
- "Guias TISS" sub-tab on patient detail showing all guides for that patient
- Quick link to create new guide for the patient

### Financial → TISS

- TISS guides with status "submitted" appear in Contas a Receber (receivables)
- When guide status changes to "paid", creates a financial entry (receita)
- Denied amounts (glosa) tracked separately for reconciliation
- Dashboard KPI: "Faturamento TISS" (total billed via TISS this month)

### NFS-e → TISS

- Option to auto-generate NFS-e when TISS guide is paid (for operators that require nota fiscal)
- Links between TissGuide and any generated NFS-e

## Implementation Plan

### Phase 1: Data Model & Config (2 days)

- Add Prisma models: `Operadora`, `TissConfig`, `TissGuide`
- Add `insuranceData` JSON field to Patient
- Create server actions: `tiss-config.ts`, `operadora.ts`
- Settings UI: TISS configuration page
- Operadora CRUD UI

### Phase 2: Guide Creation (3 days)

- Create guide dialog component
- Server actions: `tiss-guide.ts` (create, update, delete, list, get)
- TUSS code autocomplete component (with common codes)
- CID-10 integration (reuse existing CID-10 data)
- Auto-population from appointment data

### Phase 3: XML Generation (3 days)

- `src/lib/tiss/` module implementation
- Guia de Consulta XML builder
- Guia SP/SADT XML builder
- Lote (batch) XML builder
- SHA-256 hash generation
- XML download endpoint

### Phase 4: TISS Tab in Financial (2 days)

- TISS tab on Financial page
- Guide list with filters and search
- Status management (draft → submitted → paid/denied)
- Summary cards (KPIs)
- Batch selection and batch XML generation

### Phase 5: Integration (2 days)

- Appointment → TISS guide quick action
- Patient detail TISS sub-tab
- Financial receivables integration
- Dashboard TISS KPI card

### Phase 6: Print & Export (1 day)

- Print-friendly guide page (Ctrl+P → PDF)
- XML file download
- Batch XML download (zip)

### Phase 7: Polish & Testing (2 days)

- Validation rules (required fields per guide type)
- Error handling and user feedback
- Edge cases (cancelled guides, partial payments)
- Manual testing with real ANS schema validation

**Total estimated: 11-16 days**

## Compliance

### ANS Requirements

- All XML must conform to TISS 4.01.00 XSD schemas
- Guide numbers must be sequential and unique per provider
- Batch numbers must be sequential
- SHA-256 hash in epilogo is mandatory
- Provider must be identified by CNPJ and CNES
- Beneficiary must be identified by card number
- All procedures must use TUSS codes from the current ANS table

### TUSS Codes

TUSS (Terminologia Unificada da Saude Suplementar) codes are maintained by ANS. Common codes for V1:

- `10101012` — Consulta em consultorio (horario normal)
- `10101020` — Consulta em consultorio (horario especial)
- `10102019` — Consulta em domicilio
- `20101015` — Consulta em pronto socorro
- Procedure-specific codes vary by specialty

The system will ship with a curated list of common TUSS codes and allow workspaces to add custom mappings between their procedures and TUSS codes.

### CBOS Codes

Common CBOS (Classificacao Brasileira de Ocupacoes) codes:

- `225120` — Medico clinico geral
- `225125` — Medico de familia
- `225142` — Medico ginecologista
- `223208` — Cirurgiao-dentista clinico geral
- `223604` — Fisioterapeuta
- `223505` — Nutricionista
- `225133` — Medico dermatologista
- `251510` — Psicologo clinico

## Testing

### Unit Tests

- XML generation produces valid XML
- SHA-256 hash matches content
- Guide number auto-increment works correctly
- TUSS code lookup returns correct results
- Validation catches missing required fields

### Integration Tests

- Create guide from appointment populates all fields
- Status transitions work correctly (draft → submitted → paid)
- Batch XML includes all selected guides
- Financial integration creates receivable entry
- Patient insuranceData links to correct operadora

### Manual Validation

- Generated XML validates against ANS XSD schema (use online ANS validator)
- Print layout matches standard TISS guide format
- Guide numbering is sequential across multiple creations
- Multi-tenant isolation (guides scoped to workspace)
