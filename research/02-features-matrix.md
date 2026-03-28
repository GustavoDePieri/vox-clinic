# Matriz de Funcionalidades — CRMs Medicos

> **Data:** 2026-03-28
> **Objetivo:** Mapeamento exaustivo de funcionalidades de 23 CRMs medicos (13 Brasil + 10 Internacional) para identificar gaps e priorizar features do VoxClinic.

---

## Sumario Executivo

Este documento analisa 23 sistemas de gestao clinica, mapeando ~80 funcionalidades em 9 areas. As conclusoes principais:

1. **IA e transcricao** sao diferenciais emergentes — apenas ~30% dos CRMs oferecem (Feegow NOA, Amplimed Ampli IA, Clinica nas Nuvens, Doctoralia Noa Notes, Jane AI Scribe, SimplePractice AI Notes, Clinicminds Quinn AI, Conclinica AI)
2. **TISS/NFS-e** sao table stakes no Brasil — 10 de 13 CRMs brasileiros oferecem TISS
3. **WhatsApp integrado** e ubiquo no Brasil mas raro internacionalmente
4. **Funil de vendas/CRM** e diferencial de poucos (Ninsaude, Medesk, Tebra, Clinicea)
5. **Controle de estoque** e oferecido por ~60% dos brasileiros mas raro entre internacionais
6. **Prescricao digital com Memed** e padrao no Brasil — 8 de 13 oferecem

---

## Legenda

| Simbolo | Significado |
|---------|-------------|
| ✅ | Funcionalidade completa/nativa |
| ⚠️ | Parcial, add-on pago, ou via integracao |
| ❌ | Nao oferece |
| ❓ | Informacao nao confirmada |

---

## 1. AGENDAMENTO

| Funcionalidade | iClinic | GestaoDS | Amplimed | Clin.Nuvens | Shosp | Feegow | Doctoralia | App Health | Conclinica | OnDoctor | ProDoctor | Ninsaude | Simples Dental |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Agenda multi-profissional | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agendamento online (publico) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Link compartilhavel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agenda por sala/equipamento | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Recorrencia | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lista de espera (waitlist) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Overbooking | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Confirmacao auto (WhatsApp) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Confirmacao auto (SMS) | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Confirmacao auto (Email) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sync Google Calendar | ❓ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Widget embeddable | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

| Funcionalidade | Jane App | Cliniko | SimplePractice | Practice Better | Tebra | DrChrono | Medesk | Clinicminds | WriteUpp | Clinicea |
|---|---|---|---|---|---|---|---|---|---|---|
| Agenda multi-profissional | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agendamento online (publico) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Link compartilhavel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agenda por sala/equipamento | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Recorrencia | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lista de espera (waitlist) | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Overbooking | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Confirmacao auto (WhatsApp) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠️ | ❌ | ❌ |
| Confirmacao auto (SMS) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Confirmacao auto (Email) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sync Google Calendar | ✅ | ❌ | ✅ | ✅ | ❌ | ⚠️ | ❌ | ❌ | ✅ | ✅ |
| Widget embeddable | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |

---

## 2. PRONTUARIO ELETRONICO (EHR)

| Funcionalidade | iClinic | GestaoDS | Amplimed | Clin.Nuvens | Shosp | Feegow | Doctoralia | App Health | Conclinica | OnDoctor | ProDoctor | Ninsaude | Simples Dental |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Templates por especialidade | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (odonto) |
| E-prescricao (Memed) | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ |
| Prescricao digital propria | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CID-10 / CID-11 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| CIAP-2 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assinatura digital (ICP-Brasil) | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Imagens clinicas (antes/depois) | ❌ | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ✅ | ✅ |
| Body map / mapa corporal | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SOAP notes | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Formularios customizaveis | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| IA - Transcricao de consulta | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| IA - Sugestoes/resumo | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Odontograma | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Scores clinicos (IMC, etc) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

| Funcionalidade | Jane App | Cliniko | SimplePractice | Practice Better | Tebra | DrChrono | Medesk | Clinicminds | WriteUpp | Clinicea |
|---|---|---|---|---|---|---|---|---|---|---|
| Templates por especialidade | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| E-prescricao (integrada) | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| CID-10 / ICD-10 | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Assinatura digital | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Imagens clinicas (antes/depois) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Body map | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| SOAP notes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Formularios customizaveis | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| IA - Transcricao | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| IA - Sugestoes/resumo | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |

---

## 3. COMUNICACAO COM PACIENTE

| Funcionalidade | iClinic | GestaoDS | Amplimed | Clin.Nuvens | Shosp | Feegow | Doctoralia | App Health | Conclinica | OnDoctor | ProDoctor | Ninsaude | Simples Dental |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| WhatsApp integrado | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| SMS | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Email marketing | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Chatbot | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Lembretes automaticos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| NPS / Pesquisa satisfacao | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Campanhas marketing | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Mensagens aniversario | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Chat privado c/ paciente | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

| Funcionalidade | Jane App | Cliniko | SimplePractice | Practice Better | Tebra | DrChrono | Medesk | Clinicminds | WriteUpp | Clinicea |
|---|---|---|---|---|---|---|---|---|---|---|
| WhatsApp integrado | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠️ | ❌ | ❌ |
| SMS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Email marketing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chatbot | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Lembretes automaticos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| NPS / Pesquisa satisfacao | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Campanhas marketing | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠️ | ✅ | ⚠️ | ❌ | ✅ |
| Mensagens aniversario | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Chat privado c/ paciente | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## 4. FINANCEIRO

| Funcionalidade | iClinic | GestaoDS | Amplimed | Clin.Nuvens | Shosp | Feegow | Doctoralia | App Health | Conclinica | OnDoctor | ProDoctor | Ninsaude | Simples Dental |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Contas a pagar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Contas a receber | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fluxo de caixa | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Faturamento TISS | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Gestao de convenios | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Tabela de precos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comissao profissional | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| NFS-e | ❌ | ❌ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Gateway de pagamento | ❌ | ❌ | ✅ | ⚠️ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Conciliacao bancaria | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Boleto | ❌ | ✅ | ✅ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| PIX integrado | ❌ | ❌ | ✅ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cartao (maquininha) | ❌ | ❌ | ✅ | ⚠️ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| DRE | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

| Funcionalidade | Jane App | Cliniko | SimplePractice | Practice Better | Tebra | DrChrono | Medesk | Clinicminds | WriteUpp | Clinicea |
|---|---|---|---|---|---|---|---|---|---|---|
| Contas a pagar | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Contas a receber | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fluxo de caixa | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Insurance billing | ⚠️ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tabela de precos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comissao profissional | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gateway de pagamento | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Stripe | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 5. TELEMEDICINA

| Funcionalidade | iClinic | GestaoDS | Amplimed | Clin.Nuvens | Shosp | Feegow | Doctoralia | App Health | Conclinica | OnDoctor | ProDoctor | Ninsaude | Simples Dental |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Teleconsulta integrada | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Gravacao de consulta | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Compartilhamento de tela | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Sala de espera virtual | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Consentimento digital | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Acesso paciente sem login | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

| Funcionalidade | Jane App | Cliniko | SimplePractice | Practice Better | Tebra | DrChrono | Medesk | Clinicminds | WriteUpp | Clinicea |
|---|---|---|---|---|---|---|---|---|---|---|
| Teleconsulta integrada | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gravacao de consulta | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Compartilhamento de tela | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Sala de espera virtual | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Consentimento digital | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Multi-participante | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 6. MARKETING & CRM

| Funcionalidade | iClinic | GestaoDS | Amplimed | Clin.Nuvens | Shosp | Feegow | Doctoralia | App Health | Conclinica | OnDoctor | ProDoctor | Ninsaude | Simples Dental |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Funil de vendas / leads | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Rastreamento de origem | ❌ | ✅ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Automacao de follow-up | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Reativacao de inativos | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Landing pages | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Facebook/Google Ads | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ranking de pacientes | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Reputacao online | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

| Funcionalidade | Jane App | Cliniko | SimplePractice | Practice Better | Tebra | DrChrono | Medesk | Clinicminds | WriteUpp | Clinicea |
|---|---|---|---|---|---|---|---|---|---|---|
| Funil de vendas / leads | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ⚠️ | ❌ | ✅ |
| Rastreamento de origem | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Automacao de follow-up | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Reativacao de inativos | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Landing pages | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Reputacao online | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |

---

## 7. RELATORIOS

| Funcionalidade | iClinic | GestaoDS | Amplimed | Clin.Nuvens | Shosp | Feegow | Doctoralia | App Health | Conclinica | OnDoctor | ProDoctor | Ninsaude | Simples Dental |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard personalizado | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Relatorios financeiros | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Relatorios de pacientes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export Excel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export PDF | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| BI integrado | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Relatorios customizaveis | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

| Funcionalidade | Jane App | Cliniko | SimplePractice | Practice Better | Tebra | DrChrono | Medesk | Clinicminds | WriteUpp | Clinicea |
|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard personalizado | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Relatorios financeiros | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export Excel/CSV | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| BI integrado | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 40+ templates relatorios | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## 8. ESTOQUE

| Funcionalidade | iClinic | GestaoDS | Amplimed | Clin.Nuvens | Shosp | Feegow | Doctoralia | App Health | Conclinica | OnDoctor | ProDoctor | Ninsaude | Simples Dental |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Controle de insumos | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lote/validade | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Alerta estoque minimo | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Baixa auto por procedimento | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Leitor codigo de barras | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

| Funcionalidade | Jane App | Cliniko | SimplePractice | Practice Better | Tebra | DrChrono | Medesk | Clinicminds | WriteUpp | Clinicea |
|---|---|---|---|---|---|---|---|---|---|---|
| Controle de insumos | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Lote/validade | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Alerta estoque minimo | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 9. DIFERENCIAIS UNICOS POR CRM

### Brasil

**iClinic**
- Marketing medico integrado (email campaigns, segmentacao, sequencias automaticas)
- Teleconsulta com gravacao e compartilhamento de tela (raro no Brasil)
- Pesquisa NPS transacional (enviada apos cada consulta)
- App mobile com ligacao direta ao paciente
- Fonte: [iclinic.com.br](https://iclinic.com.br/)

**GestaoDS**
- **Ranking de pacientes** — identifica pacientes mais lucrativos para acoes de marketing segmentadas (unico)
- **Body map / mapa corporal** para dermatologia e cirurgia plastica
- Prontuarios por especialidade com modulos especificos (dermatologia, cirurgia plastica, oftalmologia, pediatria, obstetricia)
- Conciliacao bancaria automatica com importacao de extratos
- Fonte: [gestaods.com.br](https://www.gestaods.com.br/)

**Amplimed**
- **Ampli IA** — transcricao automatica que reduz 40% do tempo de registro
- **Faturamento TISS** com reducao de 99% de glosas
- **Gestao de vacinas** integrada ao estoque
- **NFS-e integrada** nativamente
- Integracao Memed com assinatura ICP-Brasil
- Fonte: [amplimed.com.br](https://www.amplimed.com.br/)

**Clinica nas Nuvens**
- **IA de transcricao** que categoriza informacoes automaticamente
- +200 recursos, atende +30 especialidades
- Integracao com RD Station e PipeDrive para CRM/marketing externo
- Assinatura digital com validade juridica (padrao bancario)
- TISS + receita digital Memed
- Fonte: [clinicanasnuvens.com.br](https://clinicanasnuvens.com.br/)

**Shosp**
- **TISS completo** + controle de glosas
- **Controle de estoque** com alerta de estoque minimo e registro de compras
- Plano gratuito disponivel
- Campanhas personalizadas e automatizadas
- Fonte: [shosp.com.br](https://www.shosp.com.br/)

**Feegow**
- **+280 funcionalidades** — o mais completo do mercado brasileiro
- **Feegow NOA** — IA que prepara documentacao automaticamente durante atendimento
- **Fila de espera** + **overbooking** (unicos no Brasil)
- **NFS-e** integrada
- **Certificacao SBIS** de prontuario eletronico
- Integracao com Doctoralia para captacao de pacientes
- Fonte: [feegowclinic.com.br](https://feegowclinic.com.br/)

**Doctoralia**
- **Marketplace de pacientes** — maior plataforma de busca medica do Brasil
- **Midia 360** — promocao multicanal
- **Noa Notes AI** — documentacao clinica automatica
- **Reputacao online** — gestao de avaliacoes publicas
- **Widget de agendamento** para websites
- Chat privado e seguro com pacientes
- Foco em visibilidade e captacao (nao em gestao financeira completa)
- Fonte: [pro.doctoralia.com.br](https://pro.doctoralia.com.br/)

**App Health**
- **Modulo hospitalar** — unico que escala de clinica para hospital
- Conciliacao bancaria + NFS-e + boleto + PIX integrados
- Pesquisa de satisfacao nativa
- Controle de estoque com lote/validade
- Fonte: [apphealth.com.br](https://www.apphealth.com.br/)

**Conclinica**
- **IA de transcricao** — transforma conversas em documentacao clinica estruturada
- **Cobranca inteligente** — boletos + lembretes automaticos para reducao de inadimplencia
- **TISS + NFS-e** integrados
- Integracao com laboratorios e equipamentos (interfaceamento)
- Indicadores de desempenho em tempo real
- Fonte: [conclinica.com.br](https://conclinica.com.br/)

**OnDoctor**
- **Versao gratuita sem limite de pacientes** (unico)
- Integracao com **Power BI** para analytics avancado
- **Multi-clinica** nativa
- e-Signatures, NPS surveys, campanhas de marketing
- ERP completo + CRM
- Fonte: [ondoctor.app](https://ondoctor.app/)

**ProDoctor**
- **+25 anos de mercado** — sistema mais tradicional
- **TISS 03.05.00** (versao mais recente)
- Prescricao com **banco de medicamentos proprio** (o mais completo do Brasil)
- **Leitor de codigo de barras** para estoque
- Confirmacao via WhatsApp com **selo verificado Meta** e IA
- Taxa de resposta >90% em confirmacoes
- Versoes: Cloud, Plus, Corp (diferentes portes)
- Fonte: [prodoctor.net](https://prodoctor.net/)

**Ninsaude Clinic**
- **Funil de vendas CRM** nativo (unico entre CRMs medicos brasileiros alem de Clinica nas Nuvens via integracao)
- **Scores clinicos** (IMC, AOFAS, EMAPO) integrados ao prontuario
- **Check-in digital com QR Code**
- **Ninsaude Sign** — assinatura eletronica propria
- **Ninsaude Safe** — modulo de seguranca adicional
- **API aberta** para integracoes customizadas
- Gestao de estoque com lotes/validades + cotacoes
- DRE integrado
- Fonte: [ninsaude.com](https://www.ninsaude.com/)

**Simples Dental**
- **Odontograma digital** interativo (diferencial odontologico)
- **Simples IA** — transcricao + "Melhorar com IA" para notas clinicas
- **Integracao Alexa** para controle por voz (unico!)
- **Link de indicacao rastreavel** para programa de referral
- **Website convertendo** — landing page para captacao
- Gestao de orcamentos odontologicos com parcelamento
- WhatsApp automatizado para campanhas
- NFS-e + PIX + cartao integrados
- Fonte: [simplesdental.com](https://www.simplesdental.com/)

### Internacional

**Jane App** (Canada)
- **AI Scribe** — transcricao em tempo real para SOAP notes (lancado 2025)
- **1000+ templates** de prontuario
- **Waitlist automatica** — notifica pacientes quando vaga aparece
- Teleconsulta para 1-12 participantes simultaneos
- **Sync com Google/Outlook/Apple Calendar**
- Room + equipment scheduling
- Insurance billing (add-on $20/mo, com CLAIM.MD, TELUS eClaims)
- Fonte: [jane.app](https://jane.app/)

**Cliniko** (Australia)
- **65,000+ profissionais em 95+ paises**
- Interface extremamente clean e simples
- SMS + email reminders robustos
- Online booking embeddable
- Multiplas locacoes
- Internal message board para equipe
- Sem estoque, sem CRM — foco em simplicidade
- Fonte: [cliniko.com](https://www.cliniko.com/)

**SimplePractice** (EUA)
- **225,000+ practitioners** — maior base de usuarios
- **Wiley Treatment Planners** incluidos (templates clinicos licenciados)
- **AI-powered therapy notes** (2025)
- HIPAA-compliant telehealth com whiteboard interativo
- Insurance claim filing + ERA/EOB automatico
- Client Portal completo
- Sync Google Calendar (plano Plus)
- Fonte: [simplepractice.com](https://www.simplepractice.com/)

**Practice Better** (Canada)
- **50,000+ practitioners** de wellness/nutricao
- Integracao **That Clean Life** — planejamento nutricional com receitas
- **Food & mood journals** para clientes
- **Programas online e cursos** — monetizacao alem da consulta
- **Group programming** com chat
- Sync Google/Outlook Calendar
- Stripe integrado
- Fonte: [practicebetter.io](https://practicebetter.io/)

**Tebra (Kareo + PatientPop)** (EUA)
- **140,000+ providers, 120M+ patients**
- **AI Review Replies** — resposta automatica a avaliacoes online
- **Reputation management** — sync com 80+ diretorios (Google, Care Connect)
- **Marketing nativo** com landing pages, SEO, ads
- **Patient Portal** completo
- RCM (Revenue Cycle Management) completo
- Fusao de duas empresas (Kareo billing + PatientPop growth)
- Fonte: [tebra.com](https://www.tebra.com/)

**DrChrono** (EUA)
- **iPad-first** — app nativo pioneiro na App Store
- **Medical speech-to-text** + drawing tools
- **SDOH automatico** — identifica determinantes sociais de saude
- **e-Prescribing** de controlados (EPCS) direto do iPhone/iPad
- **98% clean claims rate** no billing
- API robusta para integracoes (ZOHO, Google Analytics, Mailchimp)
- Fonte: [drchrono.com](https://www.drchrono.com/)

**Medesk** (UK)
- **40+ templates de relatorios** prontos
- **CRM com lead module** — pipeline de vendas para clinicas
- **WhatsApp + SMS + email** campaigns (raro entre internacionais)
- **Telemedicina** com pagamento online integrado
- GDPR-compliant
- Forte em analytics de marketing (qual canal funciona melhor)
- Fonte: [medesk.net](https://www.medesk.net/)

**Clinicminds** (Holanda)
- **Especializado em estetica/MedSpa** (injetaveis, skincare, hair transplant, laser)
- **Quinn AI** — transcricao multilingual + smart summary
- **Fotos antes/depois** + body map para registro visual
- **Gestao de lotes** de insumos (botox, fillers)
- Video appointments integrados ao workflow
- HIPAA + GDPR + PIPEDA compliant
- Fonte: [clinicminds.com](https://www.clinicminds.com/)

**WriteUpp** (UK)
- **50,000+ clinicians em 30+ paises**
- Interface ultra-simples
- Smart forms que pacientes preenchem antes da consulta
- ISO27001 certified
- Sync Google/Apple/Outlook
- Stripe integrado
- Sem estoque, sem CRM avancado — foco em simplicidade
- Fonte: [writeupp.com](https://www.writeupp.com/)

**Clinicea** (India)
- **Smart Virtual Assistants** — bots que automatizam surveys, consent, scheduling
- **20+ especialidades** com templates customizados
- **Integracoes massivas**: Google Calendar, Stripe, PayPal, RazorPay, Flutterwave, Twilio, Plivo, Mailchimp, etc.
- **Multi-location management**
- **Military-grade security** (Azure, HIPAA/GDPR)
- Feedback loop integrado (Curofic)
- Fonte: [clinicea.com](https://clinicea.com/)

---

## 10. ANALISE DE GAPS — VoxClinic vs. Mercado

### O que o VoxClinic JA TEM (diferenciais)

| Feature | Status VoxClinic | Quantos concorrentes tem |
|---|---|---|
| IA transcricao + extracao dados | ✅ Nativo (Whisper + Claude) | ~8/23 (35%) |
| Onboarding por profissao com IA | ✅ Unico | 0/23 (0%) |
| Prontuario gerado por voz | ✅ Diferencial principal | ~5/23 (22%) |
| Multiplas agendas com cores | ✅ | ~15/23 (65%) |
| NFS-e (DPS Nacional) | ✅ | ~8/23 (35%) |
| NPS surveys | ✅ | ~7/23 (30%) |
| WhatsApp integrado (Cloud API) | ✅ | ~12/23 (52%) |
| Teleconsulta (Daily.co) | ✅ | ~20/23 (87%) |
| Gravacao de teleconsulta | ✅ | ~3/23 (13%) |
| Prescricoes e atestados | ✅ | ~20/23 (87%) |
| Planos de tratamento | ✅ | ~10/23 (43%) |
| Drag & drop na agenda | ✅ | ~5/23 (22%) |
| Agendamento online publico | ✅ | ~22/23 (96%) |
| Mensagens de aniversario | ✅ | ~12/23 (52%) |
| Export Excel | ✅ | ~20/23 (87%) |
| Audit log | ✅ | ~3/23 (13%) |

### GAPS CRITICOS (features que >70% dos concorrentes tem e VoxClinic NAO)

| Feature | % concorrentes | Prioridade | Impacto |
|---|---|---|---|
| **Faturamento TISS** | 77% (BR) | P0 | Essencial para clinicas com convenios — sem isso, perde mercado de clinicas medias/grandes |
| **Gestao de convenios** | 77% (BR) | P0 | Acoplado ao TISS, gerencia elegibilidade e autorizacoes |
| **E-prescricao com Memed** | 62% (BR) | P1 | Padrao de mercado, base de 60k+ medicamentos |
| **Assinatura digital ICP-Brasil** | 77% (BR) | P1 | Validade juridica do prontuario eletronico — exigencia CFM |
| **CID-10/CID-11** | 85% (BR) | P1 | Codificacao diagnostica padrao — necessario para TISS e prontuario |
| **Controle de estoque** | 77% (BR) | P1 | Clinicas de estetica, odonto e procedimentos precisam |
| **Contas a pagar** | 77% (BR) | P1 | Gestao financeira completa (temos apenas receitas) |
| **Comissao profissional** | 77% (BR) | P1 | Essencial para clinicas com multiplos profissionais |
| **SMS reminders** | 87% (total) | P2 | Canal complementar ao WhatsApp |
| **Formularios/anamnese customizaveis** | 91% (total) | P0 | Temos template fixo por IA — falta builder visual |

### GAPS IMPORTANTES (features que 30-70% tem)

| Feature | % concorrentes | Prioridade | Impacto |
|---|---|---|---|
| **Funil de vendas / CRM leads** | 26% | P2 | Diferencial emergente (Ninsaude, Medesk, Tebra, Clinicea) |
| **Conciliacao bancaria** | 13% | P2 | Poucos oferecem, mas alto valor para gestao financeira |
| **Boleto/PIX integrado** | 38% (BR) | P1 | Gateway de pagamento para reduzir inadimplencia |
| **Widget agendamento embeddable** | 35% | P2 | Para sites de profissionais |
| **Lista de espera** | 26% | P2 | Otimiza ocupacao da agenda |
| **Google Calendar sync** | 35% | P2 | Conveniencia para profissionais |
| **DRE (relatorio contabil)** | 17% | P2 | Relatorio financeiro avancado |
| **Imagens clinicas (antes/depois)** | 30% | P2 | Essencial para estetica e dermatologia |
| **SOAP notes** | 43% (intl.) | P3 | Mais relevante para mercado internacional |
| **Landing pages** | 13% | P3 | Baixa prioridade — integracao com builders externos melhor |

### OPORTUNIDADES (features raras que seriam diferenciais)

| Feature | Quem tem | Oportunidade VoxClinic |
|---|---|---|
| **Onboarding IA por profissao** | Ninguem | JA TEMOS — comunicar como diferencial principal |
| **IA generativa no prontuario** | ~35% | JA TEMOS — expandir (sugestoes de diagnostico, CID automatico) |
| **Gravacao de teleconsulta** | iClinic, Practice Better, Clinicminds | JA TEMOS — raro, comunicar melhor |
| **Chatbot WhatsApp** | ProDoctor (parcial) | Oportunidade: chatbot IA que responde perguntas e agenda |
| **AI Review Replies** | Tebra | Oportunidade futura: responder avaliacoes Google com IA |
| **Scores clinicos automaticos** | Ninsaude | Oportunidade: calcular IMC, Glasgow etc. automaticamente |
| **Controle por voz (Alexa)** | Simples Dental | Nosso core e voz — podemos expandir para comandos de voz |
| **Smart Virtual Assistants** | Clinicea | Oportunidade: bots que fazem pre-triagem |
| **SDOH automatico** | DrChrono | IA pode detectar determinantes sociais na transcricao |

---

## 11. RECOMENDACOES PRIORIZADAS

### Fase 1 — Table Stakes (P0, proximo trimestre)

1. **Faturamento TISS** — Sem isso, clinicas com convenios nao podem adotar o VoxClinic. Implementar guias TISS 03.05.00 (consulta, SP/SADT, honorarios) com geracao XML.
2. **CID-10 integrado** — Base de codigos no prontuario com busca. Necessario para TISS e documentacao clinica.
3. **Builder de formularios customizaveis** — Permitir que profissionais criem anamneses e formularios proprios (drag & drop de campos).
4. **Assinatura digital ICP-Brasil** — Validade juridica do prontuario. Integrar com certificado digital A1 (ja temos upload para NFS-e).

### Fase 2 — Competitivo (P1, 2-3 meses)

5. **E-prescricao Memed** — Integrar Memed SDK para prescricao com base de medicamentos e interacoes.
6. **Controle de estoque basico** — CRUD de insumos, alertas de estoque minimo, movimentacoes.
7. **Contas a pagar** — Complementar modulo financeiro (temos receitas, falta despesas fixas/variaveis).
8. **Comissao profissional** — Split automatico baseado em regras configuráveis.
9. **Gestao de convenios** — Tabela de convenios, elegibilidade, valores diferenciados.
10. **Boleto/PIX** — Integrar gateway (Asaas, PagBank, ou Stripe BR) para cobrar pacientes.

### Fase 3 — Diferencial (P2, 3-6 meses)

11. **CID automatico por IA** — Claude sugere CID-10 baseado na transcricao (nenhum concorrente faz).
12. **Lista de espera inteligente** — Notifica pacientes quando vaga abre (WhatsApp + email).
13. **Widget de agendamento** — Codigo embed para sites de profissionais.
14. **Google Calendar sync** — Bidirecional para conveniencia.
15. **Funil de vendas / CRM** — Pipeline de leads com origem rastreada.
16. **Fotos antes/depois** — Upload e comparacao para estetica.
17. **DRE simplificado** — Demonstrativo de resultados no modulo financeiro.

### Fase 4 — Inovacao (P3, 6-12 meses)

18. **Chatbot IA WhatsApp** — Bot que agenda, responde duvidas e faz triagem.
19. **Scores clinicos automaticos** — IMC, Glasgow, SOFA etc. extraidos da transcricao.
20. **Portal do paciente** — Acesso web para historico, prescricoes, agendamento.
21. **Comandos de voz** — Expandir voice-first para navegacao do sistema.

---

## 12. FONTES

### CRMs Brasileiros
- [iClinic](https://iclinic.com.br/) | [Precos](https://iclinic.com.br/precos/) | [Capterra](https://www.capterra.com/p/191984/iClinic/)
- [GestaoDS](https://www.gestaods.com.br/) | [Diferenciais](https://www.gestaods.com.br/diferencias-da-gestaods/)
- [Amplimed](https://www.amplimed.com.br/) | [Planos](https://www.amplimed.com.br/planos-e-recursos/) | [TISS](https://www.amplimed.com.br/faturamento-tiss/)
- [Clinica nas Nuvens](https://clinicanasnuvens.com.br/) | [Planos](https://clinicanasnuvens.com.br/planos-e-precos)
- [Shosp](https://www.shosp.com.br/) | [Funcionalidades](https://www.shosp.com.br/funcionalidades)
- [Feegow](https://feegowclinic.com.br/) | [Analise](https://saudeaz.com.br/10-funcionalidades-do-feegow-clinic-analise-completa/)
- [Doctoralia](https://pro.doctoralia.com.br/) | [Funcionalidades](https://pro.doctoralia.com.br/produtos/funcionalidades)
- [App Health](https://www.apphealth.com.br/) | [Funcionalidades](https://www.apphealth.com.br/funcionalidades)
- [Conclinica](https://conclinica.com.br/) | [Funcionalidades](https://conclinica.com.br/software-medico-conclinica-funcionalidades/)
- [OnDoctor](https://ondoctor.app/) | [Recursos](https://ondoctor.app/recurso/) | [Capterra](https://www.capterra.com/p/267185/OnDoctor/)
- [ProDoctor](https://prodoctor.net/) | [Faturamento](https://prodoctor.net/funcionalidades/faturamento) | [Estoque](https://prodoctor.net/funcionalidades/estoque)
- [Ninsaude Clinic](https://www.ninsaude.com/) | [TISS](https://www.ninsaude.com/pt-br/faturamento-de-convenios-software-clinica/) | [Blog](https://blog.apolo.app/ninsaude-apolo-tudo-o-que-voce-precisa-saber/)
- [Simples Dental](https://www.simplesdental.com/) | [Financeiro](https://www.simplesdental.com/gestao-e-financeiro)

### CRMs Internacionais
- [Jane App](https://jane.app/) | [Features](https://jane.app/features) | [Capterra](https://www.capterra.com/p/178984/Jane-App/)
- [Cliniko](https://www.cliniko.com/) | [Features](https://www.cliniko.com/features/)
- [SimplePractice](https://www.simplepractice.com/) | [Capterra](https://www.capterra.com/p/178984/SimplePractice/)
- [Practice Better](https://practicebetter.io/)
- [Tebra (Kareo)](https://www.tebra.com/) | [Software Advice](https://www.softwareadvice.com/medical/kareo-profile/)
- [DrChrono](https://www.drchrono.com/) | [Features](https://www.drchrono.com/ehr-emr/features/)
- [Medesk](https://www.medesk.net/) | [CRM](https://www.medesk.net/en/medical-crm/)
- [Clinicminds](https://www.clinicminds.com/) | [Features](https://www.clinicminds.com/features/)
- [WriteUpp](https://www.writeupp.com/) | [Features](https://www.writeupp.com/features)
- [Clinicea](https://clinicea.com/) | [Features](https://clinicea.com/features)

### Reviews e Comparativos
- [Cloudia — 15 Principais Softwares Medicos 2025](https://www.cloudia.com.br/8-melhores-softwares-medicos-do-mercado-2024/)
- [Capterra Brasil — Medical Software](https://www.capterra.com/medical-practice-management-software/)
- [Software Advice — Medical 2026](https://www.softwareadvice.com/medical/)
- [GetApp — Healthcare Software](https://www.getapp.com/healthcare-pharmaceuticals-software/)
- [Medesk — Jane App Review](https://www.medesk.net/en/blog/jane-app-review/)
- [Dental Cremer — Softwares Odontologicos 2026](https://blog.dentalcremer.com.br/melhores-softwares-odontologicos/)
