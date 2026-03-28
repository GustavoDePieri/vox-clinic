# Imagens Clinicas — Feature Document

## 1. Overview

Profissionais de saude (especialmente estetica, dermatologia, odontologia, cirurgia plastica) precisam documentar evolucoes visuais de tratamentos com fotografias clinicas. Atualmente o VoxClinic permite upload de documentos genericos (PatientDocument), mas falta suporte para:

- **Antes/Depois:** Pareamento de fotos com comparacao visual lado a lado
- **Body Map:** Mapa corporal SVG interativo para anotacoes por regiao
- **Camera direta:** Captura de foto direto do dispositivo (mobile-first)
- **Galeria clinica:** Visualizacao organizada por data, regiao, tratamento
- **Anotacoes:** Marcacoes e textos sobre as imagens

**Profissoes beneficiadas:** esteticistas, dermatologistas, cirurgioes plasticos, dentistas (fotos intra-orais), fisioterapeutas, nutricionistas (evolucao corporal)

---

## 2. Data Model

### Novo Model: ClinicalImage

```prisma
model ClinicalImage {
  id              String        @id @default(cuid())
  workspaceId     String
  patientId       String
  patient         Patient       @relation(fields: [patientId], references: [id], onDelete: Cascade)
  appointmentId   String?
  appointment     Appointment?  @relation(fields: [appointmentId], references: [id], onDelete: SetNull)
  
  // Image storage
  url             String        // Supabase Storage path
  thumbnailUrl    String?       // Thumbnail path (gerado server-side ou client-side)
  mimeType        String        @default("image/jpeg")
  fileSize        Int?
  
  // Clinical metadata
  bodyRegion      String?       // "face", "torso_front", "torso_back", "arm_left", "arm_right", "leg_left", "leg_right", "mouth", "teeth", "skin", "other"
  bodySubRegion   String?       // "forehead", "cheek_left", "nose", etc.
  category        String        @default("general") // "before", "after", "progress", "general", "intraoral", "radiograph"
  
  // Before/After pairing
  pairedImageId   String?       // ID da imagem par (before ↔ after)
  pairedImage     ClinicalImage? @relation("ImagePair", fields: [pairedImageId], references: [id])
  pairedWith      ClinicalImage? @relation("ImagePair")
  
  // Annotations
  annotations     Json          @default("[]") // [{ x, y, width, height, type: "circle"|"arrow"|"text", text?, color? }]
  
  // Organization
  tags            String[]      @default([])
  notes           String?
  takenAt         DateTime?     // data real da foto (pode diferir do upload)
  
  createdBy       String        // clerkId
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([workspaceId, patientId])
  @@index([workspaceId, patientId, bodyRegion])
  @@index([workspaceId, patientId, category])
  @@index([appointmentId])
  @@index([pairedImageId])
}
```

### Relacoes

```prisma
model Patient {
  // ... existente ...
  clinicalImages  ClinicalImage[]
}

model Appointment {
  // ... existente ...
  clinicalImages  ClinicalImage[]
}
```

### Decisao: modelo separado vs estender PatientDocument

Optamos por modelo separado (`ClinicalImage`) porque:
1. PatientDocument e generico (PDF, Word, imagens diversas) — misturar metadata clinica nele poluiria o modelo
2. ClinicalImage tem relacoes especificas (pairedImageId, bodyRegion, annotations) que nao fazem sentido para documentos genericos
3. Queries diferentes: ClinicalImage precisa de filtro por regiao, categoria, pareamento — PatientDocument so lista por data
4. Futuro: ClinicalImage pode ter versionamento, thumbnails, processamento de imagem

---

## 3. Body Map

### SVG Interativo

Componente `BodyMapSelector` com SVG do corpo humano (vista frontal + traseira):

- **Regioes clicaveis:** face, torso frente, torso costas, braco esquerdo/direito, perna esquerda/direita, mao esquerda/direita, pe esquerdo/direito
- **Sub-regioes (face):** testa, bochechas, nariz, queixo, labios, olhos
- **Sub-regioes (boca/dental):** arcada superior, arcada inferior, quadrantes 1-4
- **Interacao:** tap/click na regiao → highlight → seleciona como `bodyRegion`
- **Anotacoes:** ao selecionar uma regiao, usuario pode adicionar pin com texto
- **Indicadores:** regioes com fotos existentes mostram badge com contagem

### Implementacao

- SVG base: 2 views (frontal + dorsal), paths nomeados por regiao
- React component com state para regiao selecionada
- Overlay de pins para anotacoes existentes
- Mobile: zoom + pan com touch gestures (CSS transform)
- Desktop: hover highlight + click select

### Profissao-especificas

Variantes do body map por profissao (detectado via `workspace.professionType`):
- **Estetica/Derma:** corpo inteiro frontal + dorsal (default)
- **Odontologia:** odontograma (arcadas dental) + face
- **Nutricao:** corpo inteiro com medidas (circunferencias)

---

## 4. Before/After

### Pareamento

- Ao fazer upload de "After", usuario seleciona a imagem "Before" correspondente
- Armazena `pairedImageId` em ambos (relacao bidirecional)
- Uma imagem so pode ter um par (1:1)

### Comparacao Visual

Componente `BeforeAfterComparison`:
- **Slider mode:** imagem "before" e "after" sobrepostas com slider vertical arrastavel
- **Side by side:** layout horizontal (before | after) com mesma proporcao
- **Toggle mode:** clique alterna entre before e after (animacao fade)
- Mostra datas de cada foto, intervalo entre elas
- Exportar como imagem unica (canvas → download) para compartilhar com paciente

---

## 5. Camera Integration

### Captura Direta (Mobile-First)

```html
<input type="file" accept="image/*" capture="environment" />
```

- `capture="environment"` abre camera traseira diretamente no mobile
- Fallback para galeria em desktop
- Preview instantaneo antes de confirmar upload
- Compressao client-side (canvas resize para max 2048px, JPEG 85% quality) para economizar storage

### Fluxo de Captura

```
Paciente na maca → Profissional abre aba Imagens no celular
  → Toca "Nova Foto" → Camera abre
    → Tira foto → Preview com opcoes:
      - Selecionar regiao (body map mini)
      - Categoria: antes | depois | progresso | geral
      - Notas rapidas
      - Vincular a consulta atual (se em consulta)
    → Confirmar → Upload com compressao
      → Thumbnail gerado
        → Imagem aparece na galeria
```

### Compressao Client-Side

```typescript
function compressImage(file: File, maxWidth = 2048, quality = 0.85): Promise<Blob> {
  // Canvas-based resize + JPEG compression
  // Preserva EXIF orientation
  // Target: < 500KB para fotos clinicas
}
```

---

## 6. Galeria — Nova Tab no Patient Detail

### Tab "Imagens" (apos "Documentos")

Layout com 3 modos de visualizacao:
1. **Grid:** Thumbnails em grade (3 colunas mobile, 4-6 desktop)
2. **Timeline:** Ordenado por data, agrupado por consulta
3. **Body Map:** Visualizacao por regiao corporal (body map com thumbnails nas regioes)

### Filtros

- Por regiao corporal (dropdown ou body map filter)
- Por categoria (antes/depois/progresso/geral)
- Por data range
- Por consulta especifica
- Por tags

### Lightbox

Ao clicar em imagem:
- Full-screen viewer
- Swipe/arrows entre imagens
- Zoom pinch (mobile) / scroll (desktop)
- Botoes: editar anotacoes, parear (before/after), deletar, download
- Se pareada: botao "Ver comparacao" abre BeforeAfterComparison

---

## 7. Storage

### Supabase Storage

Reutilizar o bucket `audio` existente (ja usado para documentos, videos):
- Path: `clinical-images/{workspaceId}/{patientId}/{timestamp}_{uuid}.jpg`
- Thumbnails: `clinical-images/{workspaceId}/{patientId}/thumb_{timestamp}_{uuid}.jpg`
- Signed URLs com 5min expiry (mesmo padrao existente)

### Funcoes em storage.ts

```typescript
export async function uploadClinicalImage(
  file: Buffer, 
  workspaceId: string, 
  patientId: string, 
  filename: string
): Promise<string>

export async function uploadClinicalThumbnail(
  file: Buffer, 
  workspaceId: string, 
  patientId: string, 
  filename: string
): Promise<string>

export async function getSignedImageUrl(path: string): Promise<string>
export async function deleteClinicalImage(path: string): Promise<void>
```

### Limites

- Max file size: 10MB (mesmo que PatientDocument)
- Formatos aceitos: JPEG, PNG, WebP, HEIC (conversao HEIC → JPEG server-side)
- Thumbnails: 300x300px, JPEG 70% quality
- Quota por workspace: baseado no plano (free: 500MB, pro: 5GB, enterprise: 50GB)

---

## 8. Integracao com Sistema Existente

### Patient Detail Page
- Nova tab "Imagens" apos "Documentos"
- `src/app/(dashboard)/patients/[id]/tabs/imagens-tab.tsx`

### Appointment Flow
- Durante consulta, opcao de capturar imagem vinculada ao appointment
- No review/confirmacao, mostrar thumbnails das imagens capturadas

### document.ts vs clinical-image.ts
- `document.ts` permanece inalterado para documentos genericos
- `clinical-image.ts` nova server action para operacoes de imagem clinica
- Sem sobreposicao — tipos diferentes

### Reports
- Futuro: contagem de imagens no relatorio, timeline visual no prontuario

---

## 9. Implementation Plan

### Fase 1: Data Layer (2-3 dias)

| Step | Task | Arquivo |
|------|------|---------|
| 1.1 | Schema: ClinicalImage model, relacoes Patient/Appointment | `prisma/schema.prisma` |
| 1.2 | Storage helpers: upload, thumbnail, signed URL, delete | `src/lib/storage.ts` |
| 1.3 | Server actions: CRUD de imagens clinicas | `src/server/actions/clinical-image.ts` |
| 1.4 | Server actions: pairing (before/after link) | `src/server/actions/clinical-image.ts` |

### Fase 2: Galeria Basica (3-4 dias)

| Step | Task | Arquivo |
|------|------|---------|
| 2.1 | Tab "Imagens" no patient detail | `src/app/(dashboard)/patients/[id]/tabs/imagens-tab.tsx` |
| 2.2 | Grid view com thumbnails | Mesmo componente |
| 2.3 | Upload dialog com camera capture | `src/components/clinical-image-upload.tsx` |
| 2.4 | Lightbox viewer (full-screen, zoom, nav) | `src/components/clinical-image-lightbox.tsx` |
| 2.5 | Compressao client-side antes do upload | `src/lib/image-compress.ts` |
| 2.6 | Registrar tab no patient detail page | `src/app/(dashboard)/patients/[id]/page.tsx` |

### Fase 3: Body Map (3-4 dias)

| Step | Task | Arquivo |
|------|------|---------|
| 3.1 | SVG body map (frontal + dorsal) | `src/components/body-map/body-map-svg.tsx` |
| 3.2 | Body map selector (click region → select) | `src/components/body-map/body-map-selector.tsx` |
| 3.3 | Body map view (gallery mode com pins) | `src/components/body-map/body-map-gallery.tsx` |
| 3.4 | Variante dental (odontograma) | `src/components/body-map/dental-map-svg.tsx` |

### Fase 4: Before/After (2-3 dias)

| Step | Task | Arquivo |
|------|------|---------|
| 4.1 | Pairing UI (selecionar par) | `src/components/clinical-image-pair-dialog.tsx` |
| 4.2 | Slider comparison component | `src/components/before-after-comparison.tsx` |
| 4.3 | Side-by-side + toggle modes | Mesmo componente |
| 4.4 | Export comparison as image | Mesmo componente |

### Fase 5: Annotations (2-3 dias)

| Step | Task | Arquivo |
|------|------|---------|
| 5.1 | Canvas overlay para anotacoes | `src/components/clinical-image-annotator.tsx` |
| 5.2 | Ferramentas: circulo, seta, texto, freehand | Mesmo componente |
| 5.3 | Salvar/carregar annotations (JSON) | Server action update |
| 5.4 | Render annotations no lightbox (read-only) | `src/components/clinical-image-lightbox.tsx` |

### Fase 6: Polish (1-2 dias)

| Step | Task |
|------|------|
| 6.1 | Timeline view agrupado por consulta |
| 6.2 | Filtros (regiao, categoria, data, tags) |
| 6.3 | Empty state com ilustracao |
| 6.4 | LGPD: consent check antes de capturar foto |
| 6.5 | Audit logging |

**Esforco total: 13-19 dias**

---

## 10. Seguranca e LGPD

- Imagens clinicas sao dados sensiveis (LGPD Art. 11 — dados de saude)
- Signed URLs com 5min expiry (nunca URLs publicas)
- Audit log para upload, visualizacao, e exclusao
- Consent record ao capturar primeira imagem (reutilizar ConsentRecord existente)
- Soft delete opcional (manter 30 dias antes de remover do storage)
- Thumbnails tambem protegidos por signed URL
- HEIC/HEIF: converter para JPEG antes de armazenar (evitar incompatibilidades)

---

## 11. Testing

### Unit Tests
- CRUD de ClinicalImage (mock Prisma)
- Compressao de imagem (mock canvas)
- Pairing logic (bidirecional, prevent self-pair)

### Manual QA
- Upload de foto via camera no celular → aparece na galeria
- Upload via galeria no desktop → thumbnail gerado
- Body map: clicar regiao → associar foto → badge aparece
- Before/After: parear → slider comparison funciona
- Anotacoes: desenhar circulo/seta → salvar → reabrir → annotations persistem
- HEIC upload (iPhone) → conversao para JPEG funciona
- Imagem > 10MB → erro amigavel
- Paciente sem imagens → empty state
