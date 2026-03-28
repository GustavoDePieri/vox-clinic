# Widget de Agendamento Embeddable — Feature Document

## 1. Overview

VoxClinic ja possui agendamento online via `/booking/[token]` — uma pagina full-page multi-step (procedimento → data/hora → dados pessoais → confirmar). O Widget Embeddable permite que clinicas incorporem essa funcionalidade diretamente em seus websites, sem redirecionar o paciente para fora do site da clinica.

**Beneficios:**
- Paciente agenda sem sair do site da clinica (menos friccao, maior conversao)
- Clinica personaliza cores e logo para manter identidade visual
- Facil instalacao: 1 linha de HTML
- Reutiliza toda a infraestrutura existente (API /api/booking, /api/booking/slots)

---

## 2. Estado Atual

### Infraestrutura existente (100% reutilizavel)

| Componente | Caminho | Status |
|------------|---------|--------|
| BookingConfig model | `prisma/schema.prisma` | Pronto |
| Token management | `src/server/actions/booking-config.ts` | Pronto |
| Public booking API | `src/app/api/booking/route.ts` | Pronto |
| Available slots API | `src/app/api/booking/slots/route.ts` | Pronto |
| Availability engine | `src/lib/booking-availability.ts` | Pronto |
| Rate limiting | `src/lib/rate-limit.ts` | Pronto |
| Full-page booking | `src/app/booking/[token]/page.tsx` | Pronto |
| Advisory lock (anti-double) | Dentro do POST handler | Pronto |
| Anti-abuse checks | Dentro do POST handler | Pronto |

Nenhuma mudanca nas APIs existentes e necessaria. O widget consumira exatamente os mesmos endpoints.

---

## 3. Opcoes de Implementacao

| Abordagem | Pros | Contras |
|-----------|------|---------|
| **(A) iframe + compact mode** | Reutiliza page existente, zero duplicacao, seguro (same-origin nao necessario) | Menos customizacao visual, iframe sizing pode ser ruim em mobile, cross-origin comms limitada |
| **(B) JS widget standalone** | Controle total, melhor UX, responsivo, customizavel | Mais codigo para manter, bundle separado, CORS ja habilitado |
| **(C) Web Component** | Encapsulamento via Shadow DOM, framework-agnostic | Complexidade extra, browser support ok mas nao perfeito |

### Decisao: Abordagem (A) iframe com compact mode + postMessage bridge

**Justificativa:**
1. A page `/booking/[token]` ja esta 100% funcional com multi-step flow, validacoes, rate limiting, e anti-abuse
2. Adicionar um `?mode=compact` query param que ativa layout sem header/footer (padding reduzido, fundo transparente)
3. postMessage API para comunicacao iframe ↔ parent (altura, evento de booking confirmado)
4. Script `widget.js` leve (~2KB) que cria o iframe, gerencia resize, e expoe callbacks
5. Menor esforco, menor superficie de bugs, reutilizacao maxima

---

## 4. Customizacao

### Via data attributes no script tag

```html
<script
  src="https://app.voxclinic.com/widget.js"
  data-token="abc123def456"
  data-color="#14B8A6"
  data-position="bottom-right"
  data-button-text="Agendar Consulta"
  data-locale="pt-BR"
  data-width="400"
  data-height="600"
></script>
```

### Opcoes

| Atributo | Default | Descricao |
|----------|---------|-----------|
| `data-token` | (obrigatorio) | Token do BookingConfig |
| `data-color` | `#14B8A6` | Cor primaria (botao + accent) |
| `data-position` | `bottom-right` | Posicao do botao flutuante: `bottom-right`, `bottom-left`, `inline` |
| `data-button-text` | `Agendar` | Texto do botao flutuante |
| `data-locale` | `pt-BR` | Idioma (futuro: en, es) |
| `data-width` | `400` | Largura do popup (px) |
| `data-height` | `620` | Altura do popup (px) |
| `data-open` | `false` | Se `true`, abre automaticamente (para inline embed) |

### Modo inline

Para embutir diretamente na pagina (sem botao flutuante):

```html
<div id="voxclinic-booking"></div>
<script
  src="https://app.voxclinic.com/widget.js"
  data-token="abc123"
  data-position="inline"
  data-target="voxclinic-booking"
></script>
```

---

## 5. Arquitetura Tecnica

### widget.js (public/widget.js)

Script leve (~2KB minificado) que:
1. Le data attributes do proprio script tag
2. Cria botao flutuante (ou nada se mode=inline)
3. Ao clicar, cria iframe apontando para `/booking/[token]?mode=compact&color=xxx`
4. Escuta postMessage do iframe para:
   - `voxclinic:resize` → ajusta altura do iframe
   - `voxclinic:booked` → callback opcional, fecha popup, mostra confirmacao
   - `voxclinic:close` → fecha popup
5. Injeta CSS isolado para botao e popup (sem afetar host page)

### Compact mode na booking page

`/booking/[token]?mode=compact&color=%2314B8A6`

Mudancas na page existente (`src/app/booking/[token]/page.tsx`):
- Detectar `searchParams.mode === "compact"`
- Remover header grande, reduzir padding
- Usar `color` param para override da cor primaria (CSS custom property)
- No step "done", enviar postMessage para parent
- Enviar postMessage de resize quando step muda (altura varia)
- Botao "Fechar" no compact mode que envia postMessage close

### CORS / Headers

As APIs `/api/booking` e `/api/booking/slots` ja sao publicas (sem auth). Para o iframe funcionar:
- Adicionar header `X-Frame-Options: ALLOWALL` apenas para `/booking/[token]` quando `mode=compact`
- Ou usar `Content-Security-Policy: frame-ancestors *` (mais moderno)
- As APIs ja funcionam cross-origin (fetch do iframe usa mesma origin)

### postMessage Protocol

```typescript
// iframe → parent
{ type: "voxclinic:resize", height: 580 }
{ type: "voxclinic:booked", data: { appointmentId, date, procedure, patientName } }
{ type: "voxclinic:close" }
{ type: "voxclinic:ready" }

// parent → iframe
{ type: "voxclinic:config", color: "#14B8A6" }
```

---

## 6. Embed Code Generator

Na Settings de agendamento online (`/settings`), ao ativar booking:
- Mostrar secao "Widget para seu site"
- Preview do widget com configuracoes atuais
- Botao "Copiar codigo" com snippet pronto
- Opcoes visuais: cor, posicao, texto do botao
- Preview ao vivo (mini iframe)

---

## 7. Modelo de Dados

Nenhuma mudanca no schema Prisma. O BookingConfig existente ja tem tudo necessario:
- `token` — identificador publico
- `isActive` — toggle
- `allowedAgendaIds` / `allowedProcedureIds` — filtros
- `maxDaysAhead`, `startHour`, `endHour` — configuracao

Opcao futura: adicionar campos de customizacao visual ao BookingConfig:
```prisma
// Futura extensao (nao necessaria para v1)
widgetColor      String?   @default("#14B8A6")
widgetButtonText String?   @default("Agendar")
widgetPosition   String?   @default("bottom-right")
```

---

## 8. Implementation Plan

### Fase 1: Compact Mode (2-3 dias)

| Step | Task | Arquivo |
|------|------|---------|
| 1.1 | Adicionar deteccao de `mode=compact` e `color` param | `src/app/booking/[token]/page.tsx` |
| 1.2 | Layout compact: sem header grande, padding reduzido | `src/app/booking/[token]/page.tsx` |
| 1.3 | postMessage emitter (resize, booked, close, ready) | `src/app/booking/[token]/page.tsx` |
| 1.4 | CSS custom property para cor dinamica | `src/app/booking/[token]/page.tsx` |
| 1.5 | Headers X-Frame para compact mode | `next.config.ts` ou middleware |

### Fase 2: Widget Script (2-3 dias)

| Step | Task | Arquivo |
|------|------|---------|
| 2.1 | widget.js — leitura de data attributes | `public/widget.js` |
| 2.2 | Botao flutuante com CSS isolado | `public/widget.js` |
| 2.3 | Popup iframe com overlay | `public/widget.js` |
| 2.4 | postMessage listener (resize, booked, close) | `public/widget.js` |
| 2.5 | Modo inline (target container) | `public/widget.js` |
| 2.6 | Minificacao e cache headers | Build script ou manual |

### Fase 3: Settings UI (1-2 dias)

| Step | Task | Arquivo |
|------|------|---------|
| 3.1 | Secao "Widget para seu site" no booking settings | `src/app/(dashboard)/settings/sections/booking-widget-section.tsx` |
| 3.2 | Snippet generator com opcoes visuais | Mesmo componente |
| 3.3 | Preview ao vivo com mini iframe | Mesmo componente |
| 3.4 | Botao copiar codigo | Mesmo componente |

### Fase 4: Polish (1 dia)

| Step | Task |
|------|------|
| 4.1 | Responsividade mobile (full-screen no mobile) |
| 4.2 | Animacao open/close suave |
| 4.3 | Fallback se token invalido (mensagem amigavel) |
| 4.4 | Documentacao para clinicas |

**Esforco total: 6-9 dias**

---

## 9. Seguranca

- Token publico — ja existente, nao expoe dados sensiveis
- Rate limiting — ja aplicado nas APIs (/api/booking, /api/booking/slots)
- Advisory locks — ja previnem double-booking
- Anti-abuse — limite de 20 bookings/hora por workspace ja existe
- Anti-duplicate — 5 min window por phone+email ja existe
- iframe sandbox: widget.js nao injeta JS na host page (apenas cria iframe)
- CSP: restringir frame-ancestors ao dominio do widget.js + wildcard para sites de clinicas

---

## 10. Testing

### Manual QA
- Embed widget em pagina HTML local → verificar botao aparece
- Clicar botao → popup abre com booking flow
- Agendar → postMessage de confirmacao recebido
- Mobile → popup vira full-screen
- Token invalido → mensagem de erro amigavel
- Modo inline → renderiza dentro do container target
- Customizacao de cor → refletida no iframe

### Consideracoes de Browser
- Chrome, Firefox, Safari, Edge (ultimas 2 versoes)
- iOS Safari: iframe height quirks — testar
- postMessage: suportado em todos browsers modernos
