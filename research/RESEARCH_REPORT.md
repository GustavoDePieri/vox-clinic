# Relatório Consolidado de Pesquisa — CRMs de Clínicas Médicas

> **Data:** 28/03/2026
> **Metodologia:** 5 agentes de pesquisa especializados, 300+ buscas web, 23 CRMs analisados
> **Objetivo:** Embasar a evolução do VoxClinic para se tornar o melhor CRM de saúde do Brasil

---

## 1. Sumário Executivo

Analisamos **23 sistemas de gestão clínica** (13 brasileiros + 10 internacionais) em 5 dimensões: frontend/UX, funcionalidades, arquitetura, compliance e pricing. Os relatórios individuais totalizam **~200KB de pesquisa detalhada**.

### Principais Descobertas

1. **VoxClinic tem o stack mais moderno do mercado** — Next.js 16, Tailwind v4, Shadcn/UI. Nenhum concorrente usa tecnologia tão atual. O mais próximo é SimplePractice (React + Rails).

2. **IA de voz como core é único** — Nenhum dos 23 CRMs analisados tem transcrição + extração estruturada de dados clínicos como feature central. Concorrentes oferecem IA como add-on caro ou feature secundária.

3. **TISS e CID-10 são os gaps mais críticos** — 77-85% dos concorrentes brasileiros oferecem, e são requisitos para clínicas que atendem convênios (>50% do mercado).

4. **Compliance tem 5 gaps urgentes** — política de privacidade inexistente, sem audit log de leitura de prontuário, sem plano de incidentes, sem DPO registrado, sem consentimento WhatsApp explícito.

5. **Oportunidade de pricing: IA inclusa, não add-on** — O mercado cobra R$ 49-129/mês extra por IA. Incluir no plano intermediário (R$ 149/prof) é um diferencial competitivo forte.

6. **Consolidação acelerada via M&A** — Afya comprou iClinic (R$ 182M), Docplanner comprou Feegow, RaiaDrogasil comprou Amplimed. O mercado está consolidando rapidamente.

---

## 2. Onde o VoxClinic é Líder

| Área | Status | Detalhes |
|------|--------|----------|
| **IA de voz** | Único | Transcrição Whisper + extração Claude. 0% dos concorrentes têm como core feature |
| **Onboarding IA** | Único | Wizard gera workspace customizado por profissão. 0% dos concorrentes oferecem |
| **Stack tecnológico** | Mais moderno | Next.js 16 + Tailwind v4 + Shadcn. Concorrentes usam Rails, Django, Laravel |
| **Calendário DnD** | Top tier | Drag-drop 15min, multi-agenda, time blocking, now-line. Competitivo com Jane App |
| **Dark mode** | Raro | ~5% do mercado oferece. Implementado com next-themes |
| **NFS-e** | Competitivo | Via NuvemFiscal, formato DPS Nacional |

## 3. Onde Precisamos Evoluir

### Gaps Críticos (table-stakes que estão faltando)
- **TISS** — faturamento de convênios (77% dos BR têm)
- **CID-10/CID-11** — codificação de doenças (85% dos BR têm)
- **Prescrição digital (Memed)** — padrão no Brasil (62% têm)
- **Formulários customizáveis** — form builder (80% têm)
- **Assinatura digital ICP-Brasil** — requisito CFM

### Gaps Importantes
- Controle de estoque, comissões, gateway de pagamento, lista de espera, widget embeddable

### Gaps de Compliance
- Política de privacidade, audit log de leitura, DPO, plano de incidentes, RBAC granular

---

## 4. Insights por Área

### 4.1 Frontend & UX (01-frontend-ux.md — 50KB)

- **Cor:** 62% usam azul/teal. Nosso teal #14B8A6 é diferenciado e profissional
- **Navegação:** Sidebar esquerda é padrão universal. Nosso layout está correto
- **Tendência 2025-2026:** IA generativa em charting, WhatsApp-first no Brasil, teleconsulta como commodity
- **Oportunidade:** Guided onboarding tour (todos os top CRMs têm, nós não)

### 4.2 Funcionalidades (02-features-matrix.md — 36KB)

- **80 features mapeadas** across 23 CRMs
- **VoxClinic tem 16 features competitivas** e **10 gaps críticos**
- **Inovações possíveis:** sugestão de CID por IA, chatbot WhatsApp, comandos de voz
- **TISS é o #1 blocker** para vendas a clínicas com convênio

### 4.3 Backend & Infra (03-backend-infra.md — 38KB)

- **Rails domina:** Jane App, Cliniko, SimplePractice todos usam Ruby on Rails
- **PostgreSQL é padrão** — nossa escolha está correta
- **6 recomendações:** RLS no PostgreSQL, Inngest para filas, Upstash Redis, pg_trgm para busca, Sentry, versionamento de prontuário
- **4 diagramas Mermaid** de arquitetura sugerida

### 4.4 Compliance (04-compliance-lgpd.md — 32KB)

- **30+ items no checklist** de compliance
- **5 gaps urgentes (P0)** que representam risco legal
- **ProDoctor é o único** com certificação SBIS ativa
- **CFM 1.821/2007:** prontuário eletrônico precisa de audit trail de leitura — não temos

### 4.5 Pricing & Business (05-pricing-business.md — 39KB)

- **Faixa dominante:** R$ 89-249/prof/mês no Brasil
- **Modelo:** por profissional é universal
- **R$ 537M+ em M&A** no setor (Tebra, Afya+iClinic, Docplanner+Feegow)
- **Recomendação:** 3 planos (R$ 79/149/249) + freemium, com IA inclusa

---

## 5. Roadmap Recomendado

| Fase | Prazo | Foco | Items |
|------|-------|------|-------|
| **P0** | 2 semanas | Compliance urgente | Política privacidade, audit reads, DPO, plano incidentes, consentimento WhatsApp |
| **P1** | 1 trimestre | Table-stakes | CID-10, TISS básico, forms custom, Memed, RBAC, assinatura digital, onboarding tour |
| **P2** | 3-6 meses | Diferencial | Estoque, comissões, gateway pagamento, imagens clínicas, IA CID, lista espera, widget booking, Inngest, Redis |
| **P3** | 6-12 meses | Visão futura | Funil vendas, chatbot WhatsApp, portal paciente, API pública, marketplace, SBIS, voice commands |

---

## 6. Conclusão

O VoxClinic já tem **vantagens tecnológicas significativas** (stack, IA de voz, dark mode) que nenhum concorrente possui. A principal barreira para crescimento é a **falta de features table-stakes** (TISS, CID-10, Memed) que são esperadas por 70%+ do mercado brasileiro.

A estratégia recomendada é:
1. **Fechar gaps de compliance imediatamente** (risco legal)
2. **Implementar TISS + CID-10 no próximo trimestre** (desbloqueia mercado de convênios)
3. **Posicionar IA de voz como diferencial incluso** (não add-on) para justificar premium pricing
4. **Buscar certificação SBIS** como moat de longo prazo

---

## Arquivos de Referência

| Arquivo | Conteúdo | Tamanho |
|---------|----------|---------|
| [01-frontend-ux.md](01-frontend-ux.md) | Design, UX, tech stack de 23 CRMs | 50KB |
| [02-features-matrix.md](02-features-matrix.md) | Feature matrix com ~80 features | 36KB |
| [03-backend-infra.md](03-backend-infra.md) | Arquitetura, stack, banco de dados | 38KB |
| [04-compliance-lgpd.md](04-compliance-lgpd.md) | LGPD, CFM, TISS, segurança | 32KB |
| [05-pricing-business.md](05-pricing-business.md) | Preços, modelos, go-to-market | 39KB |
| [COMPETITIVE_MATRIX.md](COMPETITIVE_MATRIX.md) | Matriz competitiva consolidada | — |
| [ACTION_ITEMS.md](ACTION_ITEMS.md) | 30 ações priorizadas com esforço/impacto | — |
