# Ações Priorizadas — VoxClinic Roadmap Baseado em Pesquisa

> **Data:** 28/03/2026 | **Base:** Pesquisa de 23 CRMs + análise de compliance + inteligência de mercado

---

## Priorização: Impacto no Mercado × Esforço

### 🔴 P0 — URGENTE (próximas 2 semanas)

Ações de compliance e segurança que representam risco legal/reputacional.

| # | Ação | Esforço | Impacto | Fonte |
|---|------|---------|---------|-------|
| 1 | **Publicar Política de Privacidade** — LGPD exige, não temos | 1 dia | Compliance LGPD | 04-compliance |
| 2 | **Audit log de leitura de prontuário** — CFM exige saber quem acessou qual prontuário | 2-3 dias | Compliance CFM 1.821/2007 | 04-compliance |
| 3 | **Plano de resposta a incidentes** — ANPD exige notificação em 3 dias úteis | 1 dia (doc) | Compliance LGPD | 04-compliance |
| 4 | **Registrar DPO** — obrigatório para dados sensíveis de saúde | 1 dia (doc) | Compliance LGPD | 04-compliance |
| 5 | **Consentimento WhatsApp** — registrar aceite antes de enviar mensagens | 2 dias | Compliance LGPD | 04-compliance |

### 🟠 P1 — IMPORTANTE (próximo trimestre)

Features que são table-stakes no mercado brasileiro — sem elas, perdemos vendas.

| # | Ação | Esforço | Impacto | Fonte |
|---|------|---------|---------|-------|
| 6 | **CID-10/CID-11** — busca e associação a consultas | 1 semana | 85% dos concorrentes BR têm | 02-features |
| 7 | **TISS básico** — guias de consulta e SP/SADT | 2-3 semanas | 77% dos concorrentes BR têm — bloqueia venda para clínicas com convênio | 02-features |
| 8 | **Formulários customizáveis** — form builder para anamnese e avaliações por especialidade | 1-2 semanas | 80% dos concorrentes têm | 02-features |
| 9 | **Integração Memed** — prescrição digital padrão no Brasil | 1 semana | 62% dos concorrentes BR têm | 02-features |
| 10 | **RBAC granular** — perfis admin/médico/secretária/recepção com permissões | 1 semana | Compliance + feature esperada | 04-compliance |
| 11 | **Assinatura digital ICP-Brasil** — para prontuário e prescrição | 1-2 semanas | Compliance CFM | 04-compliance |
| 12 | **Guided onboarding tour** — tour interativo para novos usuários | 3-4 dias | Reduce churn, todos os top CRMs têm | 01-frontend |

### 🟡 P2 — DIFERENCIAL (3-6 meses)

Features que nos colocam acima da média do mercado.

| # | Ação | Esforço | Impacto | Fonte |
|---|------|---------|---------|-------|
| 13 | **Controle de estoque** — insumos, lotes, baixa por procedimento | 2 semanas | 60% dos BR têm, esperado por clínicas médias | 02-features |
| 14 | **Comissão/repasse de profissionais** — cálculo automático por procedimento | 1 semana | Feature muito pedida em clínicas multi-profissional | 02-features |
| 15 | **Gateway de pagamento** — PIX, cartão, boleto integrado | 2 semanas | Tendência forte (iClinic, Doctoralia já oferecem) | 02-features |
| 16 | **Imagens clínicas** — body map, antes/depois, câmera integrada | 2 semanas | Diferencial para dermatologia, estética, odonto | 02-features |
| 17 | **Sugestão IA de CID** — baseada na transcrição da consulta | 1 semana | Nenhum concorrente oferece — inovação | 02-features |
| 18 | **Lista de espera** — pacientes aguardando vaga com notificação | 3-4 dias | ~40% dos concorrentes têm | 02-features |
| 19 | **Widget de agendamento embeddable** — para site da clínica | 3-4 dias | Feature comum nos internacionais | 02-features |
| 20 | **Inngest para background jobs** — filas para processamento de áudio, WhatsApp, e-mails | 1-2 semanas | Elimina timeouts do Vercel, melhora UX | 03-backend |
| 21 | **Upstash Redis caching** — cache de config, dashboard, busca | 1 semana | Performance + reduz carga no DB | 03-backend |

### 🟢 P3 — VISÃO FUTURA (6-12 meses)

Features que nos posicionam como líder de mercado.

| # | Ação | Esforço | Impacto | Fonte |
|---|------|---------|---------|-------|
| 22 | **Funil de vendas/CRM** — leads, origem, conversão, reativação | 3-4 semanas | Diferencial raro (~15% têm) | 02-features |
| 23 | **Chatbot WhatsApp** — agendamento automático por conversa | 2-3 semanas | Inovação — quase ninguém tem bem feito | 02-features |
| 24 | **Portal do paciente** — acesso a prontuário, exames, agendamento | 3-4 semanas | Tendência forte nos internacionais | 02-features |
| 25 | **API pública REST** — documentação OpenAPI, webhooks | 2-3 semanas | Marketplace futuro, integrações | 03-backend |
| 26 | **Marketplace de integrações** — laboratórios, ERPs, farmácias | Ongoing | Lock-in e diferencial | 03-backend |
| 27 | **PostgreSQL RLS** — Row-Level Security para multi-tenancy | 1 semana | Segurança em profundidade | 03-backend |
| 28 | **Certificação SBIS NGS2** — eliminação do papel | 3-6 meses | Diferencial premium, ProDoctor é o único | 04-compliance |
| 29 | **Versionamento de prontuário** — append-only para compliance CFM | 1-2 semanas | Compliance 20 anos de retenção | 03-backend |
| 30 | **Voice commands** — "agendar consulta para João amanhã às 10" | 2-3 semanas | Ninguém tem — inovação radical | 02-features |

---

## Pricing Recomendado

Baseado na análise de 21 CRMs (research/05-pricing-business.md):

| Plano | Preço Sugerido | Target | Inclui |
|-------|---------------|--------|--------|
| **Gratuito** | R$ 0 | Profissional solo | 30 pacientes, agenda básica, 5 gravações/mês |
| **Profissional** | R$ 149/prof/mês | Consultórios | Tudo do grátis + IA voz ilimitada, WhatsApp, teleconsulta, NFS-e |
| **Clínica** | R$ 249/prof/mês | Clínicas multi | Tudo do Prof + TISS, estoque, comissões, multi-agenda, equipe |

**Diferencial de pricing:** IA de voz inclusa no plano intermediário (não add-on), enquanto concorrentes cobram R$ 49-129/mês extra por IA.

---

## Métricas de Sucesso

| Métrica | Meta 6 meses | Meta 12 meses |
|---------|-------------|---------------|
| Clínicas ativas | 50 | 200 |
| NPS | > 60 | > 70 |
| Churn mensal | < 5% | < 3% |
| Ticket médio | R$ 149 | R$ 180 |
| Features vs top 3 BR | 70% paridade | 90% paridade |

---

## Fontes

Cada ação referencia o relatório de pesquisa correspondente:
- `01-frontend-ux.md` — Design, UX, tech stack
- `02-features-matrix.md` — Feature matrix completa
- `03-backend-infra.md` — Arquitetura técnica
- `04-compliance-lgpd.md` — LGPD, CFM, segurança
- `05-pricing-business.md` — Preços e modelos de negócio
