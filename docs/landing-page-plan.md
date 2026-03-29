# Landing Page — Enterprise Redesign

## Público-alvo
Profissionais de saúde brasileiros: médicos, dentistas, psicólogos, fisioterapeutas, nutricionistas, esteticistas, fonoaudiólogos.

## Features reais do VoxClinic (mostradas na landing)
1. IA de voz — transcrição + extração estruturada + revisão humana
2. Prontuário completo — 8 tabs (resumo, histórico, tratamentos, prescrições, documentos, imagens, gravações, formulários)
3. Prescrição eletrônica — simples, controlada, antimicrobiana, manipulada + assinatura ICP-Brasil + envio WhatsApp/email
4. Atestados — atestado, declaração, encaminhamento, laudo + assinatura digital
5. Agenda modular — semana/dia/mês/lista, DnD, múltiplas agendas, bloqueio, recorrência, conflitos
6. Agendamento online — widget embeddable, booking page pública
7. Financeiro — contas a receber, despesas, fluxo de caixa, comissões
8. NFS-e — emissão via NuvemFiscal
9. TISS — guias para convênios
10. Gateway pagamento — Asaas (PIX, boleto, cartão)
11. WhatsApp Business — inbox integrado, lembretes automáticos, confirmação com botões, NPS
12. Teleconsulta — Daily.co com gravação
13. Estoque — categorias, itens, movimentações
14. Form builder — formulários customizados (11 tipos de campo)
15. Lista de espera — prioridade, agendamento automático
16. RBAC — 5 roles (owner/admin/doctor/secretary/viewer)
17. Onboarding IA — workspace gerado por IA baseado na profissão
18. LGPD — consentimento, auditoria, DPO, criptografia, signed URLs
19. Imagens clínicas — antes/depois, categorias, anotações

## Estrutura atual (enterprise-grade, dark theme)
1. Navbar — sticky, backdrop blur, minimal, white CTA button
2. Hero — concise headline, subtitle, white CTA, dashboard mockup with BorderBeam
3. Social proof — 4 stats (NumberTicker)
4. How it works — 3-column grid (Grave → Revise → Pronto)
5. Features 01-05 — blocos numerados com tabs/toggles, mockups do produto
6. Segurança — 6 cards grid (AES-256, Brasil, LGPD, CFM, ICP-Brasil, Backup)
7. Testimonials — 2-row Marquee
8. Pricing — 3 planos em grid unificado
9. FAQ — 6 perguntas em accordion
10. CTA final + Footer

## Componentes UI em uso
BlurFade, BorderBeam, Marquee, NumberTicker

## Arquivos
```
src/components/landing/
├── landing-page.tsx        # Orchestrator
├── nav-bar.tsx             # Sticky nav
├── hero-section.tsx        # Hero + dashboard mockup
├── social-proof-bar.tsx    # Stats
├── how-it-works-section.tsx
├── features-bento-section.tsx  # 5 feature blocks with mockups
├── security-section.tsx
├── testimonials-section.tsx
├── pricing-section.tsx
├── faq-section.tsx
└── final-cta-section.tsx   # CTA + footer
```
