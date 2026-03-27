# [f06] NFS-e — Implementation Document

> **Issue:** [#15](https://github.com/vox-clinic/vox-clinic/issues/15)
> **Priority:** Essential | **Effort:** High | **Milestone:** MVP
> **Description:** Geracao de nota fiscal de servico.

---

## 1. Problem Statement

Brazilian clinics are legally required to issue NFS-e (Nota Fiscal de Servico Eletronica) for services rendered. VoxClinic currently has no fiscal document capability — only receipts (recibos) for print.

Without NFS-e integration, professionals must use separate systems to emit invoices, which is a major friction point and a dealbreaker for many clinics.

---

## 2. NFS-e Landscape in Brazil (2026)

### The NFS-e Nacional Mandate

As of **January 1, 2026**, Brazil mandates the unified **NFS-e Nacional** pattern nationwide (Lei Complementar 214/2025). This replaces the fragmented per-municipality systems (each city had its own webservice, XML format, and quirks).

**This is great news for SaaS products:** Instead of integrating with hundreds of municipal APIs, there is now **a single national API** managed by Receita Federal.

### Technical Architecture (Direct API)
- **Protocol:** REST with JSON envelope, XML payloads (GZip+Base64 encoded)
- **Authentication:** mTLS using ICP-Brasil digital certificates (A1/A3)
- **Signing:** XML digital signature (XMLDSIG)
- **Operations:** Emit, consult, cancel, retrieve by NSU

### Why Use an Aggregator Instead

Direct integration requires handling mTLS certificates, XML signing, and complex edge cases. **Aggregator APIs** abstract all of this behind a simple REST/JSON interface:

| Service | Strengths | Pricing |
|---------|-----------|---------|
| **Nuvem Fiscal** | Most developer-friendly REST API, full NFS-e Nacional support, excellent docs | Per-document |
| **Focus NFe** | 1,000+ municipalities, fastest processing, 15-day new city guarantee | ~R$0.10/doc |
| **eNotas** | Strong automation, payment gateway integrations | Per-document |
| **Tecnospeed** | Mature, comprehensive SDK, enterprise support | Enterprise |

### Recommendation: Nuvem Fiscal

- Best developer experience (REST/JSON, no XML handling)
- Full NFS-e Nacional support already operational
- Transparent per-document pricing suitable for SaaS
- Handles certificate management on their side
- Comprehensive docs at `dev.nuvemfiscal.com.br`

---

## 3. Current System State

### What We Already Have
| Asset | Location | Notes |
|-------|----------|-------|
| `Appointment.price` | Prisma schema | Service value for NFS-e |
| `Appointment.procedures` | Prisma schema (JSON) | Service description |
| `Patient.document` (CPF) | Prisma schema | Tomador identification |
| `Patient.name` | Prisma schema | Tomador name |
| `Patient.address` | Prisma schema (JSON) | Tomador address (street, city, state, zipCode) |
| `User.clinicName` | Prisma schema | Prestador name |
| `Workspace.professionType` | Prisma schema | Maps to service code |
| Receipt system | `src/server/actions/receipt.ts` | Existing print-to-PDF pattern |

### What's Missing for NFS-e

**Fiscal identity data (not currently stored):**
- `cnpj` — CNPJ of the clinic/professional
- `inscricaoMunicipal` — Municipal registration number
- `codigoServico` — Service code (LC 116 item). Healthcare mappings:
  - Dentists: 4.17 (Odontologia)
  - Doctors: 4.01 (Medicina)
  - Nutritionists: 4.08 (Nutricao)
  - Psychologists: 4.08 (Terapias)
  - Lawyers: 17.14 (Advocacia)
- `aliquotaISS` — ISS tax rate (2-5% depending on municipality)
- `regimeTributario` — Tax regime (Simples Nacional, Lucro Presumido, MEI)
- Aggregator API credentials

---

## 4. Proposed Data Model

### 4.1 NfseConfig (Per-Workspace Fiscal Configuration)

```prisma
model NfseConfig {
  id                  String    @id @default(cuid())
  workspaceId         String    @unique
  workspace           Workspace @relation(fields: [workspaceId], references: [id])

  // Fiscal identity
  cnpj                String    // 14 digits
  inscricaoMunicipal  String
  codigoServico       String    // LC 116 item code
  descricaoServico    String    // Default service description for NFS-e
  aliquotaISS         Float     // e.g., 0.05 for 5%
  regimeTributario    String    // simples_nacional | lucro_presumido | lucro_real | mei

  // Aggregator config
  provider            String    @default("nuvem_fiscal") // nuvem_fiscal | focus_nfe
  apiKey              String    // encrypted
  certificateId       String?   // reference in aggregator (uploaded .pfx)

  // Clinic address (needed for ISS determination)
  clinicCity          String
  clinicState         String
  clinicCep           String

  isActive            Boolean   @default(true)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

### 4.2 Nfse (Individual Invoice Record)

```prisma
model Nfse {
  id                  String    @id @default(cuid())
  workspaceId         String
  workspace           Workspace @relation(fields: [workspaceId], references: [id])
  appointmentId       String?
  appointment         Appointment? @relation(fields: [appointmentId], references: [id])
  patientId           String
  patient             Patient   @relation(fields: [patientId], references: [id])
  chargeId            String?   // link to f04 Charge if available

  // NFS-e data
  numero              String?   // NFS-e number (filled after authorization)
  codigoVerificacao   String?   // Verification code
  status              String    @default("pending") // pending | processing | authorized | cancelled | error
  valor               Int       // in centavos
  issValor            Int       // ISS tax amount in centavos
  description         String    // Service description

  // Aggregator references
  externalId          String?   // Aggregator's reference ID
  pdfUrl              String?   // NFS-e PDF download URL
  xmlUrl              String?   // NFS-e XML download URL
  errorMessage        String?   // Error details if failed

  emittedAt           DateTime?
  cancelledAt         DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([workspaceId, status])
  @@index([workspaceId, patientId])
  @@index([appointmentId])
}
```

---

## 5. Aggregator Client

**File:** `src/lib/nfse/client.ts`

```typescript
// Nuvem Fiscal REST API client
class NfseClient {
  constructor(apiKey: string) {}

  // Emit NFS-e
  async emit(data: EmitNfseInput): Promise<NfseResponse> {}

  // Check status (async processing)
  async getStatus(externalId: string): Promise<NfseStatus> {}

  // Cancel NFS-e
  async cancel(externalId: string, reason: string): Promise<void> {}

  // Download PDF
  async getPdf(externalId: string): Promise<Buffer> {}

  // Download XML
  async getXml(externalId: string): Promise<string> {}
}
```

**No npm package needed** — use native `fetch` (same pattern as WhatsApp client).

### Emit Payload Structure

```typescript
interface EmitNfseInput {
  // Prestador (clinic)
  prestador: {
    cnpj: string
    inscricaoMunicipal: string
  }
  // Tomador (patient)
  tomador: {
    cpf: string
    nome: string
    endereco?: { logradouro, numero, bairro, cidade, uf, cep }
  }
  // Servico
  servico: {
    descricao: string
    codigoServico: string
    valorServicos: number // in BRL (not centavos — API format)
    aliquotaISS: number
  }
}
```

---

## 6. Server Actions

**File:** `src/server/actions/nfse.ts`

| Action | Description |
|--------|-------------|
| `emitNfse(appointmentId)` | Creates Nfse record, calls aggregator API, returns status. Wraps in `$transaction`. |
| `cancelNfse(nfseId, reason)` | Cancels NFS-e via aggregator, updates record. |
| `getNfseByAppointment(appointmentId)` | Get NFS-e for an appointment. |
| `getNfseList(filters)` | List with filters: status, patientId, dateRange. Paginated. |
| `getNfseStatus(nfseId)` | Poll aggregator for async status update. |
| `downloadNfsePdf(nfseId)` | Get signed URL for PDF. |

**File:** `src/server/actions/nfse-config.ts`

| Action | Description |
|--------|-------------|
| `getNfseConfig()` | Get workspace fiscal config. |
| `saveNfseConfig(data)` | Create/update fiscal config. |
| `testNfseConnection()` | Validate API key and certificate with aggregator. |

---

## 7. Integration Flow

### 7.1 Emission Trigger

```
Appointment completed + price set
  → (if f04 exists) Payment confirmed on Charge
    → Professional clicks "Emitir NFS-e"
      → Call aggregator API
        → Store result in Nfse table
          → Show status badge on appointment
```

**Emission modes:**
1. **Manual (MVP):** Button on appointment detail / receipt page — "Emitir NFS-e"
2. **Auto after payment (future):** When payment is confirmed in f04, auto-emit
3. **Batch (future):** Monthly batch emission for all unpaid NFS-e

### 7.2 Async Processing

Aggregators may process NFS-e asynchronously (especially during high volume):
1. `emitNfse()` → status = `processing`, externalId stored
2. Webhook from aggregator (or polling) → status = `authorized`, numero/PDF/XML filled
3. For MVP: poll on page load (`getNfseStatus`) — simpler than webhooks

---

## 8. UI Changes

### 8.1 Settings — New "Fiscal" Tab

Add to `/settings` page:

**Dados Fiscais section:**
- CNPJ (masked input: XX.XXX.XXX/XXXX-XX)
- Inscricao Municipal
- Regime Tributario (dropdown)
- Codigo de Servico (dropdown filtered by professionType)
- Aliquota ISS (% input)
- Descricao padrao do servico (text)

**Integracao section:**
- Provedor (Nuvem Fiscal / Focus NFe)
- API Key (password input)
- Certificado Digital (file upload for .pfx — sent to aggregator)
- "Testar Conexao" button

### 8.2 Appointment Detail — NFS-e Badge + Button

On appointment card / detail page:
- If no NFS-e: Show "Emitir NFS-e" button (only if NfseConfig exists and appointment has price)
- If processing: Show yellow "Processando" badge
- If authorized: Show green "NFS-e #12345" badge with PDF download link
- If error: Show red "Erro" badge with retry button

### 8.3 Financial Page — NFS-e Tab

Add tab to `/financial`:
- **NFS-e list:** Table with numero, patient, value, status, date, actions
- **Filters:** Status, date range, patient search
- **Actions:** Download PDF, Download XML, Cancel
- **Batch emission button** (future)

### 8.4 Receipt Page Enhancement

On `/appointments/[id]/receipt`, add:
- "Emitir NFS-e" button if not yet emitted
- Link to NFS-e PDF if already emitted
- NFS-e number displayed on receipt

---

## 9. Security Considerations

- **API keys stored encrypted** in NfseConfig (or use environment variable per workspace if single-tenant initially)
- **Certificate handling:** The .pfx file is uploaded directly to the aggregator — VoxClinic never stores the certificate file
- **CNPJ validation:** Validate CNPJ format and check digit on input
- **ISS rate validation:** Must be between 2% and 5% (legal range)
- **Audit logging:** All NFS-e emissions and cancellations logged to AuditLog

---

## 10. Environment Variables

```env
# Optional — only needed if using a single global aggregator account
# Per-workspace credentials stored in NfseConfig model instead
NUVEM_FISCAL_API_KEY=  # fallback if workspace doesn't have its own key
```

---

## 11. Implementation Order

1. Prisma schema: Add `NfseConfig` and `Nfse` models, run migration
2. Aggregator client: `src/lib/nfse/client.ts` (Nuvem Fiscal REST API)
3. Server actions: `saveNfseConfig`, `getNfseConfig`, `testNfseConnection`
4. Settings UI: "Fiscal" tab with config form
5. Server actions: `emitNfse`, `getNfseList`, `cancelNfse`, `getNfseStatus`
6. Appointment detail: NFS-e button + status badge
7. Financial page: NFS-e list tab
8. Receipt page: NFS-e link integration
9. Status polling on page load (for async processing)

---

## 12. Dependencies

- **No new npm packages** — native `fetch` for API calls
- **#13 (f04) Contas a Receber** — Optional but natural trigger (emit NFS-e after payment)
- **Aggregator account** — Nuvem Fiscal or Focus NFe account + API key required
- **Digital certificate** — ICP-Brasil A1 certificate (.pfx) required from the clinic

---

## 13. Profession-to-Service-Code Mapping

Auto-suggest based on `workspace.professionType`:

| Profession | LC 116 Code | Description |
|------------|-------------|-------------|
| dentist | 4.17 | Odontologia |
| doctor | 4.01 | Medicina e biomedicina |
| nutritionist | 4.08 | Nutricao |
| psychologist | 4.08 | Terapias de qualquer especie |
| physiotherapist | 4.09 | Terapias ocupacionais, fisioterapia |
| veterinarian | 5.01 | Medicina veterinaria e zootecnia |
| aesthetician | 6.02 | Cabeleireiros, estetica |
| lawyer | 17.14 | Advocacia |
| general | 17.01 | Assessoria ou consultoria |

---

## 14. Future Enhancements (Post-MVP)

- **Auto-emission after payment:** Emit NFS-e automatically when charge is paid in f04
- **Batch emission:** Monthly emission of all completed appointments
- **Webhook processing:** Receive status updates from aggregator instead of polling
- **RPS (Recibo Provisorio):** Generate RPS for clinics that need the intermediate step
- **NFS-e in patient timeline:** Show emitted notes on patient detail
- **Tax reports:** Monthly ISS summary, annual fiscal report

---

## 15. References

- [NFS-e Nacional 2026 - Certifica](https://certifica.com.br/blog/mudancas-na-emissao-da-nfs-e-entram-em-vigor-em-2026/)
- [API NFS-e Nacional - Tecnospeed](https://blog.tecnospeed.com.br/api-nfse-nacional-o-que-e-e-como-integrar/)
- [Nuvem Fiscal - Developer Docs](https://dev.nuvemfiscal.com.br/docs/nfse/)
- [Focus NFe - NFS-e Nacional](https://focusnfe.com.br/produtos/nfse-nacional/)
- [Comparativo APIs NF 2025 - Notaas](https://www.notaas.com.br/blog/post/comparativo-5-apis-para-emissao-de-nfe-nfse-e-nfce-2025)
- [Manual Contribuintes NFS-e Nacional (gov.br)](https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/)
