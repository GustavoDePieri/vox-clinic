# Divida Tecnica — Modulo de Prescricao

> Itens pendentes identificados na auditoria tecnica de 2026-03-28.
> Organizados por prioridade de impacto no usuario e risco juridico.

---

## P0 — Risco Juridico / Compliance

### 1. Assinatura digital ICP-Brasil real
**Onde:** `src/server/actions/prescription.ts` — `signPrescription()` (linha ~230)
**Problema:** Assinatura e apenas logica (timestamp + UUID + status). Campos `signatureProvider`, `certificateSerial`, `certificateSubject` nunca sao preenchidos. Nao ha nenhuma criptografia ou certificado digital.
**Impacto:** Prescricoes nao tem validade juridica como documento eletronico assinado (Lei 14.063/2020, ICP-Brasil).
**Solucao:**
1. Integrar assinatura A1 server-side (certificado .pfx) para quem ja tem certificado NFS-e
2. Integrar assinatura cloud BirdID (OAuth2 flow) para assinatura remota
3. Ambos devem gerar assinatura PAdES no PDF via pdf-lib
4. Preencher os campos existentes: `signatureProvider`, `certificateSerial`, `certificateSubject`
5. Schema `SignatureConfig` ja existe no Prisma — reativar e conectar

**Arquivos envolvidos:**
- `src/server/actions/prescription.ts` — `signPrescription()` precisa chamar crypto real
- `src/lib/pdf/prescription-pdf.ts` — adicionar assinatura PAdES ao PDF
- `prisma/schema.prisma` — `SignatureConfig` model (ja existe, nao usado)
- Novo: `src/lib/signing/` — modulo de assinatura (A1 + BirdID)

---

### 2. Delete permite apagar prescricoes assinadas/enviadas
**Onde:** `src/server/actions/prescription.ts` — `deletePrescription()` (linha ~371)
**Problema:** Nao ha restrict por status. Prescricao assinada ou enviada pode ser deletada, perdendo rastreabilidade.
**Impacto:** Violacao de audit trail. Documento assinado juridicamente nao deveria ser deletavel.
**Solucao:**
```typescript
// Em deletePrescription, antes do delete:
if (prescription.status === "signed" || prescription.status === "sent") {
  throw new ActionError("Prescricoes assinadas ou enviadas nao podem ser excluidas. Use cancelar.")
}
```

---

## P1 — Funcionalidade Quebrada

### 3. signedPdfUrl armazena path, nao URL
**Onde:** `src/server/actions/prescription.ts` (linha ~448) e `src/app/(dashboard)/patients/[id]/tabs/prescricoes-tab.tsx` (linha ~228)
**Problema:** O campo `signedPdfUrl` recebe o **storage path** (ex: `prescriptions/ws123/rx456.pdf`), mas na tab de prescricoes do paciente e usado como `href` diretamente — o link nao funciona.
**Impacto:** Botao "Ver PDF" na lista de prescricoes do paciente esta quebrado.
**Solucao:** Na tab do paciente, gerar signed URL on-demand:
```typescript
// Em prescricoes-tab.tsx, ao clicar em "Ver PDF":
const result = await getSignedPdfUrl(prescription.id) // nova server action
window.open(result.url, "_blank")
```
Ou renomear o campo para `pdfStoragePath` e criar `getSignedPdfUrl()` server action.

---

### 4. PDF nao suporta multiplas paginas
**Onde:** `src/lib/pdf/prescription-pdf.ts` (linha ~262)
**Problema:** Comentario explicito no codigo: "we'd add a new page... For now, we continue on the same page". Prescricoes com muitos medicamentos terao conteudo cortado.
**Impacto:** Prescricoes longas (5+ medicamentos com instrucoes detalhadas) ficam ilegivel.
**Solucao:**
```typescript
// Em prescription-pdf.ts, dentro do loop de medicamentos:
if (yPosition < 100) { // margem inferior
  page = pdfDoc.addPage([595.28, 841.89]) // novo A4
  yPosition = 780 // reset para topo
  // Repetir header minimo (nome paciente + "continuacao")
}
```

---

### 5. QR code e placeholder no PDF
**Onde:** `src/lib/pdf/prescription-pdf.ts` (linha ~448-469)
**Problema:** Footer do PDF tem um retangulo vazio com texto "QR" em vez de QR code real apontando para `/verificar/[token]`.
**Impacto:** Verificacao de autenticidade so funciona digitalmente. Documento impresso nao tem como ser verificado.
**Solucao:** Usar biblioteca `qrcode` para gerar QR como PNG, embutir no PDF via `pdfDoc.embedPng()`:
```typescript
import QRCode from "qrcode"

const qrDataUrl = await QRCode.toDataURL(`https://app.voxclinic.com/verificar/${verificationToken}`, {
  width: 80, margin: 0
})
const qrImage = await pdfDoc.embedPng(Buffer.from(qrDataUrl.split(",")[1], "base64"))
page.drawImage(qrImage, { x: footerX, y: footerY, width: 60, height: 60 })
```
**Dependencia:** `npm install qrcode @types/qrcode`

---

## P2 — Performance

### 6. Drug interaction O(n^2) queries
**Onde:** `src/server/actions/drug-interaction.ts` (linha ~100-128)
**Problema:** Para cada par de ingredientes ativos, faz uma query individual ao banco. Com 10 medicamentos, sao ate 45 queries.
**Impacto:** Latencia perceptivel no editor ao adicionar medicamentos.
**Solucao:** Batch query unica:
```typescript
// Em vez de N queries individuais:
const allPairs = ingredients.flatMap((a, i) =>
  ingredients.slice(i + 1).map((b) => ({ drug1: a, drug2: b }))
)

const interactions = await db.drugInteraction.findMany({
  where: {
    OR: allPairs.flatMap(({ drug1, drug2 }) => [
      { drug1, drug2 },
      { drug1: drug2, drug2: drug1 }, // ordem inversa
    ]),
  },
})
```

---

### 7. Paginacao ausente em getPatientPrescriptions
**Onde:** `src/server/actions/prescription.ts` (linha ~201-204)
**Problema:** `take: 100` hardcoded sem paginacao real. Pacientes cronicos com historico longo terao problemas.
**Impacto:** Performance degrada com o tempo. Paciente com 200+ prescricoes carrega tudo de uma vez.
**Solucao:** Adicionar `page` e `pageSize` params, retornar `{ items, total, page, totalPages }`.

---

### 8. checkPrescriptionExpiry faz N writes individuais
**Onde:** `src/server/actions/prescription.ts` (linha ~208-223)
**Problema:** `Promise.all` com um `db.prescription.update` individual para cada prescricao expirada. 100 expiradas = 100 writes.
**Impacto:** Lentidao ao abrir lista de prescricoes de paciente com muitas prescricoes vencidas.
**Solucao:** Um unico `updateMany`:
```typescript
await db.prescription.updateMany({
  where: {
    id: { in: expiredIds },
    status: { in: ["signed", "sent"] },
  },
  data: { status: "expired" },
})
```

---

## P3 — UX / Polimento

### 9. Rate limiting no envio
**Onde:** `src/server/actions/prescription.ts` — `sendPrescriptionWhatsApp` (linha ~544), `sendPrescriptionEmail` (linha ~597)
**Problema:** Nao ha throttle. Usuario pode clicar repetidamente e enviar multiplas mensagens ao paciente.
**Solucao:** Verificar `sentAt` — se enviado ha menos de 5 minutos, recusar:
```typescript
if (prescription.sentAt && Date.now() - new Date(prescription.sentAt).getTime() < 5 * 60 * 1000) {
  throw new ActionError("Prescricao ja foi enviada recentemente. Aguarde 5 minutos.")
}
```

---

### 10. Bucket de storage mal nomeado
**Onde:** `src/server/actions/prescription.ts` (linha ~430)
**Problema:** PDFs de prescricao sao armazenados no bucket "audio" (comentario: "reuse existing bucket"). Dificulta governanca e permissoes.
**Solucao:** Criar bucket dedicado "documents" no Supabase e migrar. Ou pelo menos documentar que "audio" e o bucket geral.

---

### 11. Auto-save com setInterval em ref de setTimeout
**Onde:** `src/app/(dashboard)/patients/[id]/prescricao/prescription-editor.tsx` (linha ~178)
**Problema:** `setInterval` atribuido a uma ref tipada como `setTimeout`. Funciona mas e fragil.
**Solucao:** Tipar corretamente:
```typescript
const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null)
```

---

## Ordem sugerida de implementacao

```
1. [P0] #2 — Restrict delete de prescricoes assinadas (5 min)
2. [P1] #3 — Fix signedPdfUrl → signed URL on-demand (30 min)
3. [P2] #8 — checkPrescriptionExpiry batch update (15 min)
4. [P2] #6 — Drug interaction batch query (30 min)
5. [P3] #9 — Rate limiting envio (10 min)
6. [P3] #11 — Fix auto-save ref type (5 min)
7. [P1] #4 — PDF multiplas paginas (1-2h)
8. [P1] #5 — QR code real no PDF (1h)
9. [P2] #7 — Paginacao prescricoes (30 min)
10. [P3] #10 — Bucket rename (migration, cuidado)
11. [P0] #1 — ICP-Brasil real (1-2 dias, requer certificado de teste)
```

---

## Referencia de arquivos

| Arquivo | Funcao |
|---------|--------|
| `src/server/actions/prescription.ts` | CRUD, sign, cancel, PDF, send |
| `src/server/actions/drug-interaction.ts` | Verificacao interacoes |
| `src/lib/pdf/prescription-pdf.ts` | Geracao PDF A4 via pdf-lib |
| `src/app/(dashboard)/prescriptions/[id]/page.tsx` | Visualizacao/impressao |
| `src/app/(dashboard)/prescriptions/[id]/prescription-actions.tsx` | Sign/cancel UI |
| `src/app/(dashboard)/patients/[id]/prescricao/prescription-editor.tsx` | Editor avancado |
| `src/app/(dashboard)/patients/[id]/tabs/prescricoes-tab.tsx` | Lista no prontuario |
| `src/app/verificar/[token]/page.tsx` | Verificacao publica |
| `prisma/schema.prisma` | Models: Prescription, MedicationDatabase, DrugInteraction, etc. |
