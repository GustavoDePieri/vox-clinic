# Guided Onboarding Tour — Feature Document

## 1. Overview

### Problema

O fluxo atual de onboarding do VoxClinic é um wizard de 4 passos com IA (`src/app/onboarding/page.tsx`) que configura o workspace. Após completar, o usuário é redirecionado para `/dashboard` sem nenhuma orientação adicional — sem indicação de por onde começar.

### Por que importa

- Usuários que completam tour guiado têm 2-3x mais retenção em 30 dias
- Reduz tickets de suporte ("Como faço para...?")
- Paridade competitiva: iClinic, Feegow, Clinicorp todos oferecem

### Escopo

Tour interativo de 10 passos com overlay spotlight, tooltips, progress dots, e controles de skip/restart.

---

## 2. Escolha da Biblioteca: driver.js

| Critério | react-joyride | shepherd.js | intro.js | **driver.js** | Custom |
|---|---|---|---|---|---|
| Bundle (gzip) | ~18 kB | ~25 kB | ~10 kB | **~5 kB** | 0 kB |
| React-first | Sim | Wrapper | Wrapper | DOM-based | Sim |
| Licença | MIT | MIT | AGPL | **MIT** | N/A |
| Personalização | Moderada | Boa | Limitada | **Excelente** | Total |
| Manutenção | Ativa | Ativa | Parada | **Ativa (22k stars)** | N/A |

**Recomendação: driver.js** — menor bundle, MIT, altamente customizável, headless.

---

## 3. Passos do Tour (10 steps)

| # | Elemento | Título | Descrição | Página |
|---|----------|--------|-----------|--------|
| 1 | Hero card | Bem-vindo ao VoxClinic! | Este é seu painel principal. Resumo do dia, consultas e ações rápidas. | `/dashboard` |
| 2 | Stats grid | Seus números | Pacientes, consultas, agendamentos e gravações em tempo real. | `/dashboard` |
| 3 | Nova Consulta | Registrar consulta por voz | O diferencial: grave e a IA gera o resumo automaticamente. | `/dashboard` |
| 4 | Nav Pacientes | Seus pacientes | Cadastre, busque e gerencie. Cadastro por voz também! | `/dashboard` |
| 5 | Nav Agenda | Agenda inteligente | Dia, semana, mês ou lista. Drag & drop. | `/dashboard` |
| 6 | Nav Financeiro | Controle financeiro | Cobranças, pagamentos, despesas e NFS-e. | `/dashboard` |
| 7 | Nav Config | Personalize seu workspace | Procedimentos, campos, equipe, agendas e integrações. | `/dashboard` |
| 8 | Botão Agendar | Agende sua primeira consulta | Paciente, data, horário e tipo. | `/calendar` |
| 9 | Command Palette | Busca rápida | Ctrl+K para buscar qualquer coisa. | `/dashboard` |
| 10 | Modal central | Tudo pronto! | Pronto para começar. Suporte em Configurações. | `/dashboard` |

---

## 4. Progress Tracking

### Client-Side: TourProvider Context

```typescript
{ isActive: boolean, currentStep: number, totalSteps: number, hasCompleted: boolean }
```

### Server-Side: Campos no User model

```prisma
model User {
  tourCompleted  Boolean  @default(false)
  tourStep       Int      @default(0)     // 0=não iniciado, 1-10=último step, -1=skipado
}
```

### Comportamento

- **Skip**: `tourCompleted = true`, tour dismisses
- **Restart**: "Refazer tour" nas Configurações reseta campos
- **Resume**: Browser fechado no meio → retoma do último step no próximo login

---

## 5. Trigger Logic

**Trigger primário:** Primeiro load do dashboard após onboarding.

Fluxo: Onboarding completa → redirect `/dashboard` → layout verifica `tourCompleted === false && tourStep === 0` → inicia tour após 500ms delay.

**Trigger secundário:** Botão "Refazer tour guiado" nas Configurações.

### Edge Cases

| Cenário | Comportamento |
|---------|---------------|
| Refresh durante tour | Resume do `tourStep` |
| Navega para outra página | Tour pausa, resume no próximo `/dashboard` |
| Usuário existente (pré-feature) | `tourCompleted = false` por default, vê tour 1x |
| Membro da equipe entra | Tour independente por usuário |
| Mobile | Steps do sidebar adaptam para NavBottom |

---

## 6. UI Design

### Tooltip Style
- Background: `bg-popover`, border: `ring-1 ring-foreground/10`, `rounded-xl`
- Shadow: `shadow-lg`, max-width: `320px`
- Título: `text-sm font-semibold`, corpo: `text-[13px] text-muted-foreground`
- Accent: `bg-vox-primary`

### Spotlight Overlay
- `bg-black/50`, target element "recortado"
- Padding `8px` com `rounded-xl`
- Transições suaves via `motion`

### Progress
- Dots: ativo `bg-vox-primary`, completo `bg-vox-primary/40`, futuro `bg-border`
- Counter: "3 de 10" em `text-[11px]`

### Botões
- Next: `bg-vox-primary text-white rounded-xl text-xs`
- Previous: `variant="outline" rounded-xl text-xs`
- Skip: `text-[11px] text-muted-foreground` link-style

### Step Final
- Card centralizado sem spotlight
- Confetti/sparkle animation
- CTAs: "Agendar primeira consulta" (primary) + "Explorar sozinho" (outline)

---

## 7. Implementation Plan

### Fase 1: Data Model (1 dia)
| Task | Arquivo |
|------|---------|
| Adicionar `tourCompleted` e `tourStep` ao User | `prisma/schema.prisma` |
| Server actions: `getTourState`, `updateTourStep`, `completeTour`, `resetTour` | `src/server/actions/tour.ts` |
| Passar tour state pela layout | `src/app/(dashboard)/layout.tsx` |

### Fase 2: Tour Component (2-3 dias)
| Task | Arquivo |
|------|---------|
| Instalar driver.js | `package.json` |
| Criar TourProvider | `src/components/tour/tour-provider.tsx` |
| Definir steps | `src/components/tour/tour-steps.ts` |
| Custom tooltip component | `src/components/tour/tour-tooltip.tsx` |
| CSS overrides | `src/components/tour/tour.css` |

### Fase 3: Data Attributes (1 dia)
| Task | Arquivo |
|------|---------|
| `data-tour` no nav-sidebar | `src/components/nav-sidebar.tsx` |
| `data-tour` no nav-bottom | `src/components/nav-bottom.tsx` |
| `data-tour` no dashboard | `src/app/(dashboard)/dashboard/page.tsx` |
| `data-tour` no command palette | `src/components/command-palette.tsx` |
| `data-tour` no calendário | `src/app/(dashboard)/calendar/page.tsx` |
| Integrar TourProvider na layout | `src/app/(dashboard)/layout.tsx` |

### Fase 4: Cross-Page Navigation (1 dia)
| Task | Arquivo |
|------|---------|
| Handler para step Calendar (router.push + wait) | `tour-provider.tsx` |
| Adaptação mobile (swap steps para NavBottom) | `tour-steps.ts` |

### Fase 5: Restart e Settings (0.5 dia)
| Task | Arquivo |
|------|---------|
| Botão "Refazer tour" nas Settings | `src/app/(dashboard)/settings/page.tsx` |
| Opção no Command Palette (opcional) | `src/components/command-palette.tsx` |

**Esforço total estimado: 5-7 dias**

---

## 8. Testing

### Unit Tests
- Server actions: `updateTourStep` persiste, `completeTour` seta flag, `resetTour` reseta
- Step definitions: arrays têm tamanho correto, cada step tem element/title/description

### Integration Tests
- Tour inicia quando `tourCompleted=false, tourStep=0`
- Tour NÃO inicia quando `tourCompleted=true`
- Tour resume quando `tourStep=5`
- Skip dismiss e chama `completeTour`

### Manual Checklist
- [ ] Completar onboarding → tour inicia no dashboard
- [ ] Completar 10 steps → `tourCompleted` setado
- [ ] Skip no step 3 → não reaparece no refresh
- [ ] Restart pelas Configurações → começa do step 1
- [ ] Mobile: steps adaptam para bottom nav
- [ ] Cross-page: step Calendar funciona sem flicker
- [ ] Dark mode: overlay e tooltip renderizam corretamente
- [ ] Teclado: Tab, Enter, Escape funcionam
- [ ] Acessibilidade: `role="dialog"`, `aria-label` nos steps

---

## Arquivos Críticos
- `prisma/schema.prisma` — campos `tourCompleted` e `tourStep` no User
- `src/app/(dashboard)/layout.tsx` — integrar TourProvider
- `src/components/nav-sidebar.tsx` — `data-tour` attributes
- `src/app/(dashboard)/dashboard/page.tsx` — `data-tour` attributes
- `src/app/(dashboard)/calendar/page.tsx` — `data-tour` no botão Agendar
