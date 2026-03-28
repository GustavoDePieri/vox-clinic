# CID-10/CID-11 Disease Code Integration — Feature Document

## 1. Overview

### What is CID-10/CID-11

CID-10 (Classificação Internacional de Doenças, 10ª revisão) é a adaptação brasileira/portuguesa do ICD-10, o padrão internacional da OMS para codificação de diagnósticos, doenças, sintomas e condições de saúde. CID-11 é seu sucessor, adotado pela OMS em 2019 e gradualmente sendo introduzido mundialmente.

No Brasil, CID-10 é a classificação legalmente obrigatória para:
- Atestados médicos — Resolução CFM 1.658/2002 exige código CID quando autorizado pelo paciente
- Faturamento de convênios (TISS/ANS) — requer CID nas guias de atendimento
- Notificação epidemiológica (DATASUS)
- Documentação para afastamento (INSS)

### Por que importa para o VoxClinic

- **85% dos CRMs médicos brasileiros oferecem CID-10** — é feature table-stakes
- Clínicas que atendem convênios não conseguem faturar sem CID nas guias
- O campo `MedicalCertificate.cid` existente (schema.prisma:395) é texto livre sem validação ou autocomplete
- A IA já extrai campo `diagnosis` das consultas mas não mapeia para código CID
- Suporte a CID cria caminho natural para TISS billing

### Estado Atual

| Asset | Localização | Status |
|-------|------------|--------|
| `MedicalCertificate.cid` | `prisma/schema.prisma:395` | Free-text `String?`, sem validação |
| Input CID no dialog | `src/components/create-certificate-dialog.tsx:59,148` | `<Input>` simples |
| Impressão certificado | `src/app/(dashboard)/certificates/[id]/page.tsx:98-103` | Mostra string raw |
| AI `diagnosis` extraction | `src/lib/claude.ts:129`, `src/lib/schemas.ts:72` | Texto livre, sem CID |
| `Appointment` model | `prisma/schema.prisma:100-136` | Sem campo CID |
| `AppointmentSummary` type | `src/types/index.ts:66-74` | Tem `diagnosis?: string`, sem CID |

---

## 2. Data Model Changes

### 2.1 Novo campo em `Appointment`

```prisma
model Appointment {
  // ... existing fields ...
  cidCodes    Json    @default("[]")  // [{ code: "J06.9", description: "Infecção aguda das vias aéreas superiores" }]
}
```

Razão para `Json` array ao invés de `String?` simples:
- Uma consulta pode envolver múltiplos diagnósticos (comorbidades)
- Segue padrão existente de `procedures` (também `Json @default("[]")`)
- Evita join table para o que é essencialmente uma tag leve

### 2.2 Melhorar `MedicalCertificate.cid`

O `cid String?` existente permanece para backward compatibility, mas a UI será atualizada para usar autocomplete. Adicionar campo de descrição:

```prisma
model MedicalCertificate {
  // ... existing fields ...
  cid           String?   // Código CID (ex: "J06.9") — já existe
  cidDescription String?  // Nome legível (ex: "Infecção aguda das vias aéreas superiores")
}
```

---

## 3. CID Database Strategy

### Análise de Opções

| Estratégia | Prós | Contras |
|------------|------|---------|
| **(a) Tabela CID-10 no PostgreSQL (~70k rows)** | Queries rápidas, offline, full-text search com `pg_trgm` | Overhead de migração, dados globais redundantes |
| **(b) API externa** (DATASUS, icd.who.int) | Sempre atualizado, zero storage | Latência, rate limits, DATASUS historicamente instável |
| **(c) Arquivo JSON embutido** | Zero latência, bundled, sem migração | Bundle maior (~2-3 MB), carregado em memória |

### Recomendação: Híbrido — Arquivo JSON estático + API route server-side

1. **CID-10 é essencialmente estático.** WHO publicou última revisão em 2019. Updates são raros.
2. **Busca server-side evita bloat no bundle.** O JSON completo (~2-3 MB) fica no servidor como `src/data/cid10.json`. Uma API route (`/api/cid/search`) faz substring matching e retorna top 20 resultados.
3. **Sem migração de banco, sem dependência externa.**
4. **Path para CID-11.** Quando Brasil adotar, basta trocar o arquivo JSON.

### Estrutura de Arquivos

```
src/
  data/
    cid10.json           # [{ "code": "A00", "description": "Cólera" }, ...]
    cid10-index.ts       # Map<string, CidEntry> carregado no module load
  app/
    api/
      cid/
        search/
          route.ts       # GET /api/cid/search?q=gripe&limit=20
```

O CID-10 oficial em português é publicado pelo DATASUS. Dataset prático contém ~12.500 códigos de subcategoria (nível clinicamente usado).

---

## 4. UI/UX Design

### 4.1 Componente `<CidAutocomplete>`

Componente reutilizável usado em todas as superfícies:

- Input com ícone de busca e debounce de 300ms
- Dropdown mostra matches formatados: `J06.9 - Infecção aguda das vias aéreas superiores`
- Suporta seleção múltipla (retorna array de `{ code, description }`)
- Botão de limpar por código selecionado
- Empty state: "Digite o código ou nome da doença"
- Navegação por teclado (arrow keys + Enter)
- Mínimo 2 caracteres para disparar busca

### 4.2 Pontos de Integração

**A. Página de Revisão de Consulta** (`src/app/(dashboard)/appointments/review/page.tsx`)
- Novo Card entre "Diagnóstico" e "Observações Clínicas"
- Título: "CID-10" com ícone médico
- Mostra CIDs sugeridos pela IA (seção 5)
- Usuário pode aceitar, remover ou buscar/adicionar manualmente
- Códigos salvos em `Appointment.cidCodes` ao confirmar

**B. Dialog de Certificado** (`src/components/create-certificate-dialog.tsx`)
- Substituir `<Input>` por `<CidAutocomplete>` (modo single-select)
- Ao selecionar, salva `cid` e `cidDescription`

**C. Aba Histórico do Paciente** (`historico-tab.tsx`)
- No card expandido, após "Diagnóstico", mostrar badges CID: `CID-10: [J06.9] [R50.9]`
- Tooltip com descrição completa

**D. Popover do Calendário** (`appointment-popover.tsx`)
- Se `cidCodes` não vazio, mostrar linha compacta: `CID: J06.9`

**E. Relatório do Paciente** (`report/page.tsx`)
- Incluir histórico de CID no export

---

## 5. AI Integration

### 5.1 Adicionar `cidCodes` ao tool schema do Claude

Em `src/lib/claude.ts`, adicionar ao `GENERATE_CONSULTATION_SUMMARY_TOOL`:

```typescript
cidCodes: {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Código CID-10 (ex: J06.9)' },
      description: { type: 'string', description: 'Descrição do código CID-10' },
    },
    required: ['code', 'description'],
  },
  description: 'Códigos CID-10 sugeridos com base no diagnóstico. Apenas inclua se houver diagnóstico claro.',
}
```

### 5.2 Atualizar prompt do sistema

Adicionar regra: "Se houver diagnóstico ou hipótese diagnóstica, sugira os códigos CID-10 correspondentes no campo cidCodes."

### 5.3 Atualizar schemas Zod

```typescript
export const CidCodeSchema = z.object({
  code: z.string(),
  description: z.string(),
})

// Adicionar ao AppointmentSummarySchema:
cidCodes: z.array(CidCodeSchema).optional().default([]),
```

### 5.4 Validação

Após AI sugerir códigos, validar contra dataset local `cid10.json`. Códigos não encontrados são marcados como "não verificado" na UI.

---

## 6. Implementation Plan

### Fase 1: Data Layer + CID Search (1-2 dias)

| # | Task | Arquivo(s) |
|---|------|-----------|
| 1.1 | Obter e limpar JSON CID-10 do DATASUS | `src/data/cid10.json` |
| 1.2 | Criar módulo de índice com função de busca | `src/data/cid10-index.ts` |
| 1.3 | Criar API route para busca CID | `src/app/api/cid/search/route.ts` |
| 1.4 | Adicionar `cidCodes` ao Appointment | `prisma/schema.prisma` |
| 1.5 | Adicionar `cidDescription` ao MedicalCertificate | `prisma/schema.prisma` |

### Fase 2: Componente UI (1 dia)

| # | Task | Arquivo(s) |
|---|------|-----------|
| 2.1 | Construir `<CidAutocomplete>` | `src/components/cid-autocomplete.tsx` |
| 2.2 | Suporte single-select e multi-select | mesmo arquivo |

### Fase 3: AI Integration (0.5 dia)

| # | Task | Arquivo(s) |
|---|------|-----------|
| 3.1 | Adicionar `cidCodes` ao tool schema Claude | `src/lib/claude.ts` |
| 3.2 | Atualizar prompt com regra CID | `src/lib/claude.ts` |
| 3.3 | Adicionar `CidCodeSchema` ao Zod | `src/lib/schemas.ts` |
| 3.4 | Atualizar tipo `AppointmentSummary` | `src/types/index.ts` |

### Fase 4: UI Integration (2 dias)

| # | Task | Arquivo(s) |
|---|------|-----------|
| 4.1 | CID card na review page | `appointments/review/page.tsx` |
| 4.2 | Salvar `cidCodes` no `confirmConsultation` | `consultation.ts` |
| 4.3 | Substituir input CID no certificado | `create-certificate-dialog.tsx` |
| 4.4 | Mostrar CID no histórico do paciente | `historico-tab.tsx` |
| 4.5 | Mostrar CID no popover do calendário | `appointment-popover.tsx` |

### Fase 5: Polish (0.5 dia)

| # | Task | Arquivo(s) |
|---|------|-----------|
| 5.1 | CID no relatório do paciente | `report/page.tsx` |
| 5.2 | Validar CIDs sugeridos pela IA | review page |

**Esforço total estimado: 5-6 dias**

---

## 7. Migration Strategy

- `cidCodes` default `@default("[]")` — **sem migração necessária**
- Appointments existentes mostram sem badges CID — totalmente backward compatible
- `cidDescription` default `null` no MedicalCertificate
- Certificados existentes com CID free-text continuam funcionando
- Migração SQL é puramente aditiva (zero downtime):

```sql
ALTER TABLE "Appointment" ADD COLUMN "cidCodes" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "MedicalCertificate" ADD COLUMN "cidDescription" TEXT;
```

---

## 8. Testing Considerations

### Unit Tests
- Busca CID: substring matching, accent-insensitive, por código vs descrição
- Validação: código válido ("A00") encontrado, inválido ("ZZZ99") não
- Schema Zod: parse com e sem `cidCodes`

### Integration Tests
- API route `/api/cid/search`: vários queries, response shape
- `confirmConsultation`: persiste `cidCodes` no appointment
- `createCertificate`: salva `cidDescription` junto com `cid`

### E2E/Manual
- Fluxo completo: gravar → review com CID sugerido → editar → confirmar → aparece no histórico
- Certificado: autocomplete → selecionar → imprimir com código e descrição
- Performance: busca CID < 100ms
