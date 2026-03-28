# ICP-Brasil Digital Signatures — Feature Document

## 1. Overview

### O que é ICP-Brasil

ICP-Brasil (Infraestrutura de Chaves Públicas Brasileira) é o framework PKI regulado pela MP 2.200-2/2001. Certificados emitidos sob ICP-Brasil têm validade legal equivalente a assinatura manuscrita.

**Tipos de certificado relevantes:**

| Tipo | Formato | Armazenamento | Validade | Uso |
|------|---------|---------------|----------|-----|
| **A1** | Arquivo .pfx/.p12 | Disco/servidor | 1 ano | Assinatura server-side, NFS-e (já suportado) |
| **A3** | Token USB / Smart card | Hardware físico | 1-5 anos | Assinatura client-side via extensão |
| **Cloud** | HSM remoto | Cloud do provedor (BirdID, VIDaaS) | 1-5 anos | Assinatura via API, sem hardware |

### Requisitos CFM

Resoluções CFM 2.299/2021 e 2.218/2023:
- Prescrições eletrônicas precisam de assinatura digital ICP-Brasil para validade legal
- Atestados eletrônicos devem ser assinados digitalmente
- Receitas de substâncias controladas (Portaria 344/98) exigem ICP-Brasil
- Documentos devem ser verificáveis por terceiros (farmácias, empregadores)

### Estado Atual

Prescrições e certificados são HTML renderizados via `window.print()`. Sem PDF generation, sem assinatura digital, sem verificação eletrônica.

---

## 2. Opções de Assinatura

### Opção A: Server-Side com A1 (Fase 1 - MVP)

Certificado A1 (.pfx) armazenado no servidor. Servidor usa chave privada para PAdES signature no PDF.

- **Prós:** UX simples (1 clique), upload A1 já existe para NFS-e, sem extensão/hardware
- **Contras:** Certificado 1 ano, chave privada no servidor (risco), tipicamente CNPJ (não pessoal)
- **Veredicto:** Viável para prescriações não-controladas e certificados gerais

### Opção B: Cloud Signing via BirdID (Fase 2 - Recomendado)

Certificado cloud ICP-Brasil hospedado em HSM remoto. Assinatura via API + confirmação no celular.

**Provedores:**

| Provedor | API | Auth | Pricing |
|----------|-----|------|---------|
| **BirdID (Soluti)** | REST + OAuth2 | OTP/biometria | Por assinatura |
| **VIDaaS (VALID)** | REST | OTP/push | Por assinatura |
| **Certisign Cloud** | REST/SOAP | OTP/push | Por assinatura |

**Flow BirdID:**
1. Profissional vincula conta BirdID (OAuth2)
2. VoxClinic gera PDF → computa hash → chama API BirdID
3. BirdID envia push/OTP → profissional confirma no celular
4. BirdID retorna hash assinado → VoxClinic embute no PDF

- **Prós:** Sem hardware, funciona mobile, certificado pessoal (CPF), compliance CFM total
- **Contras:** Profissional precisa certificado cloud (~R$150-250/ano), custo por assinatura
- **Veredicto:** Melhor equilíbrio compliance × UX. Método principal recomendado.

### Opção C: Client-Side via Web PKI (Fase 3 - Opcional)

Extensão browser (Lacuna Web PKI) acessa certificado A1/A3 local do usuário.

- **Prós:** Suporta A3 hardware, chave nunca sai do computador
- **Contras:** Requer extensão, não funciona mobile, complexidade UX
- **Veredicto:** Para profissionais que já têm A3 e preferem assinatura local

### Recomendação por Fase

| Fase | Método | Cobertura |
|------|--------|-----------|
| **Fase 1 (MVP)** | Server-side A1 | Prescrições gerais, certificados |
| **Fase 2** | Cloud BirdID | Controlados, compliance CFM total |
| **Fase 3** | Web PKI Lacuna | A3 hardware token |

---

## 3. PDF Generation

### Stack Recomendada

- **pdf-lib** (~250KB) — construção programática de PDF, funciona em Node.js
- **node-signpdf** (~30KB) — embedding PAdES signatures
- **@peculiar/x509** (~80KB) — parsing e validação de certificados
- **qrcode** (~50KB) — QR code para verificação

### Arquitetura

```
src/lib/pdf/
  prescription-pdf.ts   — gera PDF de prescrição
  certificate-pdf.ts    — gera PDF de certificado
  signer.ts             — PAdES signature embedding
```

O PDF gerado espelha o layout HTML existente: header (branding, clínica), dados paciente, corpo (medicamentos/texto), bloco assinatura (representação visual + QR code), footer (data, URL verificação).

---

## 4. Signature Flow

### Flow Server-Side A1 (Fase 1)

```
Profissional cria prescrição/certificado
  → Revisa na preview page
    → Clica "Assinar Digitalmente"
      → Server gera PDF (pdf-lib)
        → Server carrega certificado A1 do NfseConfig
          → Server assina PDF (PAdES-B)
            → PDF assinado uploaded para Supabase Storage
              → DB atualizado (signedPdfUrl, signedAt, certificateSerial)
                → UI mostra badge "Assinado digitalmente" + download
```

### Flow Cloud BirdID (Fase 2)

```
Profissional clica "Assinar com Certificado Digital"
  → Se não vinculado: redirect OAuth2 BirdID
  → Server gera PDF sem assinatura com placeholder
    → Server computa hash do documento
      → Server chama API BirdID com hash
        → BirdID envia push/OTP para celular
          → Profissional confirma
            → BirdID retorna hash assinado
              → Server embute hash no PDF
                → Upload + update DB
```

### UX

**Antes de assinar:**
- Botão "Assinar Digitalmente" ao lado do PrintButton existente

**Durante:**
- Loading "Assinando documento..." (A1)
- "Confirme no seu celular" com countdown (Cloud)

**Depois:**
- Badge verde "Assinado digitalmente" com ícone shield
- Nome, CRM, serial do certificado
- "Baixar PDF Assinado"
- QR code para verificação

---

## 5. Data Model

### Campos em Prescription e MedicalCertificate

```prisma
signedPdfUrl        String?    // path no Supabase Storage
signedAt            DateTime?
signatureProvider   String?    // "a1_server" | "birdid" | "vidaas" | "webpki"
certificateSerial   String?
certificateSubject  String?    // CN do cert (ex: "JOAO DA SILVA:12345678900")
signedByUserId      String?    // clerkId
verificationToken   String?   @unique  // token público para página de verificação
```

### Novo Model: SignatureConfig

```prisma
model SignatureConfig {
  id                 String   @id @default(cuid())
  workspaceId        String   @unique
  useNfseCertificate Boolean  @default(false)  // reusar A1 da NFS-e
  cloudProvider      String?  // "birdid" | "vidaas"
  cloudClientId      String?
  cloudClientSecret  String?  // encrypted
  defaultMethod      String   @default("a1_server")
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

### Novo Model: ProfessionalCertLink (Cloud)

```prisma
model ProfessionalCertLink {
  id               String    @id @default(cuid())
  userId           String
  workspaceId      String
  provider         String    // "birdid" | "vidaas"
  accessToken      String    // encrypted
  refreshToken     String?   // encrypted
  expiresAt        DateTime?
  certificateCN    String?
  certificateSerial String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  @@unique([userId, workspaceId, provider])
}
```

---

## 6. Verificação Pública

### Página `/verificar/[token]`

Rota pública (adicionar ao `isPublicRoute` no middleware). Mostra:
- Tipo de documento (Prescrição / Atestado)
- Nome paciente (parcialmente mascarado: "Jo** da Si***")
- Nome profissional e CRM
- Timestamp da assinatura
- Serial do certificado e CA emissora
- Status da assinatura (válida / certificado expirado)
- **NÃO** mostra conteúdo completo do documento (LGPD)

### QR Code no PDF

Embedded no footer do PDF assinado. Codifica: `https://{domain}/verificar/{token}`

---

## 7. Reuso do Certificado NFS-e

O certificado A1 para NFS-e é enviado ao NuvemFiscal e **não armazenado localmente**. Para reusar:

**Recomendação:** Opção separada de upload para assinatura digital (SignatureConfig), mas com toggle "Usar mesmo certificado da NFS-e" que copia o .pfx.

---

## 8. Implementation Plan

### Fase 1: Server-Side A1 (2-3 semanas)

| Step | Task | Arquivos |
|------|------|----------|
| 1 | Instalar pdf-lib, qrcode, @peculiar/x509 | `package.json` |
| 2 | Módulo PDF de prescrição | `src/lib/pdf/prescription-pdf.ts` |
| 3 | Módulo PDF de certificado | `src/lib/pdf/certificate-pdf.ts` |
| 4 | Módulo de assinatura PAdES | `src/lib/pdf/signer.ts` |
| 5 | Migration: campos assinatura em Prescription e MedicalCertificate | `prisma/schema.prisma` |
| 6 | Migration: SignatureConfig model | `prisma/schema.prisma` |
| 7 | Storage: uploadSignedPdf, getSignedPdfUrl | `src/lib/storage.ts` |
| 8 | Server actions: signPrescription, signCertificate | `src/server/actions/sign-document.ts` |
| 9 | Server actions: getSignatureConfig, saveSignatureConfig | `src/server/actions/signature-config.ts` |
| 10 | UI: botão "Assinar" na página de prescrição | `prescriptions/[id]/page.tsx` |
| 11 | UI: botão "Assinar" na página de certificado | `certificates/[id]/page.tsx` |
| 12 | Página de verificação pública | `src/app/verificar/[token]/page.tsx` |
| 13 | Settings: seção assinatura digital | settings page |

### Fase 2: Cloud BirdID (3-4 semanas)

| Step | Task | Arquivos |
|------|------|----------|
| 14 | Registrar VoxClinic como client OAuth2 BirdID | Externo |
| 15 | BirdID client lib | `src/lib/signing/birdid-client.ts` |
| 16 | Migration: ProfessionalCertLink model | `prisma/schema.prisma` |
| 17 | Flow de vinculação OAuth2 | Settings + callback route |
| 18 | Modify sign actions para suportar cloud | `sign-document.ts` |
| 19 | UX: modal "Confirme no celular" | Componente client |

### Fase 3: Web PKI (2-3 semanas, opcional)

| Step | Task |
|------|------|
| 20 | Integrar lacuna-web-pki |
| 21 | Client-side hash signing flow |

---

## 9. Testing

### Unit Tests
- PDF generation: output válido, contém texto esperado
- Signature embedding: PAdES corretamente inserida
- Certificate parsing: .pfx lido, serial/subject extraídos
- Verification token: geração e lookup

### Integration Tests
- Flow completo: criar prescrição → assinar → PDF no storage → campos DB atualizados
- Verification page: token válido retorna metadata, inválido retorna 404
- Audit logging: ações de assinatura logadas

### Manual QA
- [ ] Gerar e assinar PDF prescrição → verificar no Adobe Reader
- [ ] Scan QR code → abre página verificação com dados corretos
- [ ] Upload certificado A1 → armazenado com segurança
- [ ] Tentar assinar sem certificado → mensagem de erro clara
- [ ] Badge "Assinado" aparece na listagem
- [ ] Download via signed URL → URL expira após timeout
- [ ] Verificação não expõe dados completos do paciente (LGPD)

### Segurança
- Senha .pfx nunca em plaintext (usar `encrypt()` existente)
- PDFs assinados não podem ser modificados (tamper detection)
- Rate limiting no endpoint público de verificação

---

## Dependências

### Novos npm packages
| Package | Propósito | Tamanho |
|---------|-----------|---------|
| pdf-lib | Geração e manipulação PDF | ~250KB |
| qrcode | QR code para verificação | ~50KB |
| @peculiar/x509 | Parsing de certificados | ~80KB |

### Serviços Externos (Fase 2+)
| Serviço | Propósito | Custo |
|---------|-----------|-------|
| BirdID (Soluti) | Cloud signing API | Por assinatura |
| Lacuna Software | Web PKI (Fase 3) | Por transação |

---

## Arquivos Críticos
- `prisma/schema.prisma` — campos assinatura em Prescription/MedicalCertificate, SignatureConfig, ProfessionalCertLink
- `src/lib/storage.ts` — uploadSignedPdf, getSignedPdfUrl
- `src/server/actions/nfse-config.ts` — referência para upload de certificado
- `src/app/(dashboard)/prescriptions/[id]/page.tsx` — botão assinar + badge
- `src/middleware.ts` — adicionar `/verificar(.*)` ao isPublicRoute
