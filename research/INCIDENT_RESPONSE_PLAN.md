# Plano de Resposta a Incidentes de Seguranca com Dados Pessoais

**VoxClinic — Documento Interno e Confidencial**

Versao: 1.0
Data de criacao: 28/03/2026
Proxima revisao: 28/09/2026
Responsavel: Encarregado de Protecao de Dados (DPO)

---

## 1. Objetivo

Este documento estabelece o Plano de Resposta a Incidentes de Seguranca envolvendo dados pessoais da VoxClinic, em conformidade com a Lei Geral de Protecao de Dados (LGPD — Lei 13.709/2018) e a Resolucao CD/ANPD n. 15/2024.

O plano visa garantir uma resposta rapida, coordenada e documentada a incidentes de seguranca, minimizando danos aos titulares e assegurando o cumprimento das obrigacoes legais de notificacao.

---

## 2. Definicao de Incidente de Seguranca

Constitui incidente de seguranca com dados pessoais qualquer evento adverso confirmado ou sob suspeita, relacionado a violacao na seguranca de dados pessoais, tais como:

- **Acesso nao autorizado**: invasao de sistemas, credenciais comprometidas, acesso indevido a registros de pacientes
- **Vazamento de dados**: exposicao publica ou compartilhamento nao autorizado de dados pessoais ou dados pessoais sensiveis (dados de saude)
- **Perda de dados**: exclusao acidental ou maliciosa de registros sem backup adequado
- **Alteracao indevida**: modificacao nao autorizada de prontuarios, consultas ou cadastros
- **Indisponibilidade**: ataque DDoS, ransomware ou falha que impossibilite o acesso aos dados
- **Interceptacao**: captura de dados em transito (ex.: audio de consultas, transcricoes)
- **Comprometimento de infraestrutura**: vulnerabilidade explorada em servidor, banco de dados ou servico terceiro (Supabase, Clerk, Vercel)

### 2.1 Dados Pessoais Tratados pela VoxClinic

| Categoria | Exemplos | Sensibilidade |
|-----------|----------|---------------|
| Dados cadastrais | Nome, CPF, RG, email, telefone, endereco | Pessoal |
| Dados de saude | Prontuarios, anamnese, historico medico, alergias, prescricoes, atestados | **Sensivel (Art. 5, II)** |
| Dados biometricos de voz | Gravacoes de audio de consultas | **Sensivel** |
| Dados financeiros | Valores de consultas, convenios, NFS-e | Pessoal |
| Dados de menores | Pacientes com responsavel/guardiao | **Atencao especial** |

---

## 3. Equipe de Resposta a Incidentes

### 3.1 Composicao

| Papel | Responsavel | Contato | Responsabilidades |
|-------|-------------|---------|-------------------|
| **DPO (Encarregado)** | [NOME DO DPO] | dpo@voxclinic.com | Coordenacao geral, comunicacao com ANPD e titulares, avaliacao juridica |
| **CTO (Lider Tecnico)** | [NOME DO CTO] | [EMAIL] | Contencao tecnica, investigacao forense, remediacao de sistemas |
| **CEO** | [NOME DO CEO] | [EMAIL] | Decisoes estrategicas, comunicacao institucional, aprovacao de notificacoes |
| **Engenheiro de Plantao** | [NOME/ESCALA] | [EMAIL/TELEFONE] | Primeiro respondente tecnico, isolamento imediato |
| **Assessoria Juridica** | [ESCRITORIO/NOME] | [EMAIL/TELEFONE] | Suporte juridico, revisao de notificacoes, avaliacao de responsabilidade |

### 3.2 Escalonamento

1. **Primeiro contato**: Engenheiro de Plantao (disponivel 24/7)
2. **Escalonamento nivel 1** (ate 1h): CTO e DPO
3. **Escalonamento nivel 2** (ate 2h): CEO e Assessoria Juridica
4. **Escalonamento nivel 3** (incidentes criticos): Todos os membros simultaneamente

---

## 4. Classificacao de Severidade

### 4.1 Niveis

| Nivel | Classificacao | Criterios | Tempo de Resposta |
|-------|---------------|-----------|-------------------|
| **1** | **Baixa** | Tentativa de acesso sem sucesso; vulnerabilidade identificada mas nao explorada; dados de teste expostos | 72 horas |
| **2** | **Media** | Acesso nao autorizado a dados cadastrais de poucos titulares (< 100); perda de dados com backup disponivel | 24 horas |
| **3** | **Alta** | Vazamento de dados de saude; acesso nao autorizado a prontuarios; comprometimento de credenciais de acesso ao banco | 4 horas |
| **4** | **Critica** | Vazamento massivo (> 1000 titulares); exposicao de audios de consultas; ransomware com dados sensiveis; comprometimento de chaves API (Supabase, Clerk) | **Imediato** |

### 4.2 Fatores Agravantes

- Envolvimento de dados de saude (dados sensiveis)
- Envolvimento de dados de menores de idade
- Grande volume de titulares afetados
- Dados que permitem identificacao direta (CPF + nome + dados de saude)
- Possibilidade de dano material, moral ou discriminatorio aos titulares
- Dados de audio/voz (biometria)

---

## 5. Fases de Resposta

### Fase 1 — Deteccao e Contencao (Primeiras 24 horas)

**Objetivo**: Identificar o incidente, conter o dano e preservar evidencias.

#### Acoes Imediatas (0-2h)

- [ ] Registrar data/hora exata da deteccao e canal de origem (alerta automatico, relato interno, relato externo)
- [ ] Classificar severidade preliminar (Baixa/Media/Alta/Critica)
- [ ] Acionar equipe de resposta conforme nivel de escalonamento
- [ ] Abrir registro do incidente com numero de protocolo (formato: INC-AAAA-MM-NNN)

#### Contencao Tecnica (2-12h)

- [ ] Isolar sistemas afetados (revogar tokens, bloquear IPs, desativar contas comprometidas)
- [ ] Revogar chaves API comprometidas (Supabase, Clerk, OpenAI, Anthropic)
- [ ] Rotacionar credenciais de banco de dados se necessario
- [ ] Verificar e revogar signed URLs ativas do Supabase Storage
- [ ] Ativar modo de manutencao se necessario para proteger dados
- [ ] Preservar logs de acesso (Vercel, Supabase, Clerk) — **NAO apagar evidencias**
- [ ] Capturar snapshot dos audit logs do VoxClinic (tabela AuditLog)

#### Documentacao Inicial (12-24h)

- [ ] Registrar cronologia detalhada do incidente
- [ ] Identificar vetor de ataque ou causa raiz preliminar
- [ ] Listar sistemas e dados potencialmente afetados
- [ ] Estimar numero de titulares potencialmente afetados

### Fase 2 — Avaliacao de Impacto (24-48 horas)

**Objetivo**: Determinar a extensao do incidente e avaliar riscos aos titulares.

- [ ] Confirmar quais dados foram acessados/expostos/alterados/perdidos
- [ ] Quantificar titulares afetados (por workspace, por tipo de dado)
- [ ] Avaliar se os dados permitem identificacao dos titulares
- [ ] Avaliar potencial de dano: material, moral, discriminatorio, fisico
- [ ] Classificar o risco aos titulares: nenhum, baixo, moderado, alto, muito alto
- [ ] Verificar se medidas de seguranca existentes mitigaram o dano (ex.: criptografia, isolamento multi-tenant)
- [ ] Determinar se notificacao a ANPD e obrigatoria (Art. 48 LGPD + Resolucao 15/2024)
- [ ] Determinar se notificacao aos titulares e obrigatoria
- [ ] Consultar Assessoria Juridica para validacao

#### Criterios para Notificacao Obrigatoria (Resolucao 15/2024)

A comunicacao a ANPD e obrigatoria quando o incidente puder acarretar **risco ou dano relevante** aos titulares. Indicadores:

- Dados pessoais sensiveis envolvidos (dados de saude, biometria)
- Dados de criancas e adolescentes
- Dados que permitam fraude financeira ou roubo de identidade
- Grande volume de titulares afetados
- Impossibilidade de mitigar integralmente os efeitos do incidente

### Fase 3 — Notificacao a ANPD (Ate 3 dias uteis)

**Prazo**: Ate **3 (tres) dias uteis** contados do conhecimento do incidente que possa acarretar risco ou dano relevante (Art. 6 da Resolucao CD/ANPD n. 15/2024).

**Canal**: Sistema Peticionamento Eletronico da ANPD (SUPER.BR) ou formulario especifico no site da ANPD.

- [ ] Preencher formulario de Comunicacao de Incidente de Seguranca (ver modelo na Secao 6)
- [ ] Submeter via canal oficial da ANPD
- [ ] Registrar protocolo de recebimento
- [ ] Designar responsavel pelo acompanhamento junto a ANPD

#### Informacoes Complementares

Caso nao disponha de todas as informacoes no prazo de 3 dias uteis, a comunicacao deve ser feita com as informacoes disponiveis, complementando-as em ate **20 dias uteis** (Art. 6, §2, Resolucao 15/2024).

### Fase 4 — Notificacao aos Titulares (Quando Necessario)

**Criterio**: Quando o incidente puder acarretar risco ou dano relevante aos titulares (Art. 48, §1 LGPD).

- [ ] Preparar comunicacao clara e em linguagem acessivel (ver modelo na Secao 7)
- [ ] Definir canal de comunicacao: email individual (via Resend), notificacao in-app, WhatsApp
- [ ] Enviar notificacao com todas as informacoes obrigatorias
- [ ] Disponibilizar canal de atendimento para duvidas dos titulares
- [ ] Registrar envio e recebimento das notificacoes

### Fase 5 — Remediacao

**Objetivo**: Corrigir as vulnerabilidades e restaurar a operacao segura.

- [ ] Implementar correcoes tecnicas definitivas
- [ ] Atualizar dependencias/bibliotecas com vulnerabilidades
- [ ] Realizar testes de seguranca pos-correcao
- [ ] Restaurar dados de backup se necessario (verificar integridade)
- [ ] Reativar sistemas em modo normal
- [ ] Rotacionar todas as credenciais potencialmente comprometidas
- [ ] Validar isolamento multi-tenant (workspaceId)
- [ ] Revisar permissoes de acesso (Clerk roles, Supabase policies)
- [ ] Monitorar indicadores de recorrencia por 30 dias

### Fase 6 — Pos-Incidente (Licoes Aprendidas)

**Prazo**: Ate 30 dias apos o encerramento do incidente.

- [ ] Realizar reuniao de retrospectiva com toda a equipe de resposta
- [ ] Documentar timeline completa do incidente (deteccao ate resolucao)
- [ ] Identificar falhas nos processos, controles e ferramentas
- [ ] Definir acoes preventivas e melhorias (com responsaveis e prazos)
- [ ] Atualizar este Plano de Resposta se necessario
- [ ] Atualizar politica de seguranca e privacy policy
- [ ] Comunicar melhorias implementadas aos stakeholders
- [ ] Arquivar toda documentacao do incidente por 5 anos (Art. 8, Resolucao 15/2024)
- [ ] Atualizar registro de incidentes (historico)

---

## 6. Modelo de Notificacao a ANPD

Conforme Art. 6 da Resolucao CD/ANPD n. 15/2024:

```
COMUNICACAO DE INCIDENTE DE SEGURANCA COM DADOS PESSOAIS

1. IDENTIFICACAO DO CONTROLADOR
   - Razao Social: VoxClinic Tecnologia Ltda.
   - CNPJ: [CNPJ DA EMPRESA]
   - Endereco: [ENDERECO COMPLETO]
   - Telefone: [TELEFONE]
   - E-mail: contato@voxclinic.com

2. ENCARREGADO DE PROTECAO DE DADOS (DPO)
   - Nome: [NOME DO DPO]
   - E-mail: dpo@voxclinic.com
   - Telefone: [TELEFONE DO DPO]

3. DESCRICAO DO INCIDENTE
   - Data e hora do incidente: [DD/MM/AAAA HH:MM]
   - Data e hora do conhecimento pelo controlador: [DD/MM/AAAA HH:MM]
   - Descricao resumida: [DESCREVER O QUE OCORREU]
   - Natureza dos dados pessoais afetados: [CADASTRAIS/SAUDE/BIOMETRICOS/FINANCEIROS]
   - Categorias de titulares afetados: [PACIENTES/PROFISSIONAIS/MENORES]
   - Numero de titulares afetados (estimativa): [NUMERO]

4. CONSEQUENCIAS DO INCIDENTE
   - Riscos ou danos identificados: [DESCREVER]
   - Potencial de dano material: [SIM/NAO — DESCREVER]
   - Potencial de dano moral: [SIM/NAO — DESCREVER]
   - Potencial de dano discriminatorio: [SIM/NAO — DESCREVER]

5. MEDIDAS ADOTADAS
   - Medidas de contencao: [DESCREVER]
   - Medidas de mitigacao: [DESCREVER]
   - Medidas preventivas para evitar recorrencia: [DESCREVER]

6. COMUNICACAO AOS TITULARES
   - Comunicacao realizada: [SIM/NAO]
   - Data da comunicacao: [DD/MM/AAAA]
   - Meio utilizado: [EMAIL/WHATSAPP/SITE/OUTRO]
   - Se nao comunicado, justificativa: [DESCREVER]

7. MEDIDAS DE SEGURANCA EXISTENTES
   - Criptografia em transito (HTTPS/TLS)
   - Isolamento multi-tenant por workspace
   - Autenticacao via Clerk (com suporte a 2FA)
   - URLs de audio assinadas com expiracao de 5 minutos
   - Audit log de todas as operacoes
   - Soft delete com retencao de 20 anos (CFM)
   - Validacao de ambiente via Zod (fail-fast)
   - Consentimento LGPD registrado antes de gravacoes

8. INFORMACOES COMPLEMENTARES
   [CAMPO LIVRE PARA INFORMACOES ADICIONAIS]

Data: [DD/MM/AAAA]
Responsavel: [NOME E CARGO]
```

---

## 7. Modelo de Notificacao aos Titulares

```
Assunto: Aviso Importante — Incidente de Seguranca de Dados

Prezado(a) [NOME DO TITULAR],

Estamos entrando em contato para informa-lo(a) sobre um incidente de seguranca
envolvendo seus dados pessoais, identificado em [DATA DO INCIDENTE].

O QUE ACONTECEU
[Descricao clara e objetiva do incidente, sem jargoes tecnicos]

QUAIS DADOS FORAM AFETADOS
[Lista dos tipos de dados: nome, CPF, dados de saude, etc.]

O QUE ESTAMOS FAZENDO
- [Medida de contencao 1]
- [Medida de contencao 2]
- [Medida de remediacao]

O QUE VOCE PODE FAZER
- Fique atento(a) a comunicacoes suspeitas em seu nome
- Monitore sua conta bancaria e movimentacoes financeiras
- Em caso de duvida, entre em contato conosco pelo canal abaixo
- Voce pode exercer seus direitos de titular enviando solicitacao para
  dpo@voxclinic.com ou acessando voxclinic.com/dpo

CANAL DE ATENDIMENTO
E-mail: dpo@voxclinic.com
Pagina do DPO: https://app.voxclinic.com/dpo
Prazo de resposta: 15 dias conforme Art. 18, §5 da LGPD

Este incidente foi comunicado a Autoridade Nacional de Protecao de Dados (ANPD)
conforme exigido pela legislacao vigente.

Pedimos desculpas pelo ocorrido e reafirmamos nosso compromisso com a
seguranca e privacidade dos seus dados.

Atenciosamente,
[NOME]
[CARGO]
VoxClinic
```

---

## 8. Contatos de Emergencia

| Funcao | Nome | Telefone | Email | Disponibilidade |
|--------|------|----------|-------|-----------------|
| DPO | [A PREENCHER] | [A PREENCHER] | dpo@voxclinic.com | Horario comercial |
| CTO | [A PREENCHER] | [A PREENCHER] | [A PREENCHER] | 24/7 (emergencias) |
| CEO | [A PREENCHER] | [A PREENCHER] | [A PREENCHER] | Horario comercial |
| Engenheiro Plantao | [A PREENCHER] | [A PREENCHER] | [A PREENCHER] | 24/7 |
| Assessoria Juridica | [A PREENCHER] | [A PREENCHER] | [A PREENCHER] | Horario comercial |
| Suporte Supabase | — | — | support@supabase.io | Via dashboard |
| Suporte Clerk | — | — | support@clerk.dev | Via dashboard |
| Suporte Vercel | — | — | support@vercel.com | Via dashboard |
| ANPD (Ouvidoria) | — | (61) 2026-7462 | ouvidoria@anpd.gov.br | Horario comercial |

---

## 9. Registro de Incidentes

Todos os incidentes devem ser registrados na tabela abaixo (ou sistema equivalente), independentemente da severidade:

| Protocolo | Data Deteccao | Descricao | Severidade | Titulares Afetados | Notificou ANPD | Notificou Titulares | Status | Encerramento |
|-----------|---------------|-----------|------------|---------------------|----------------|---------------------|--------|--------------|
| INC-2026-03-001 | — | — | — | — | — | — | — | — |

---

## 10. Revisao Periodica

Este plano deve ser revisado a cada **6 (seis) meses** ou sempre que:

- Ocorrer um incidente de seguranca
- Houver alteracao significativa na infraestrutura ou nos servicos utilizados
- Houver alteracao na legislacao ou regulamentacao aplicavel (LGPD, ANPD)
- Houver mudanca na equipe de resposta
- Forem identificadas melhorias no processo de resposta

### Historico de Revisoes

| Versao | Data | Autor | Descricao |
|--------|------|-------|-----------|
| 1.0 | 28/03/2026 | [NOME] | Versao inicial do plano |

---

## 11. Referencias Legais

- **Lei 13.709/2018 (LGPD)** — Art. 46 a 49 (Seguranca e Boas Praticas)
- **Resolucao CD/ANPD n. 15/2024** — Regulamenta comunicacao de incidentes de seguranca
- **Art. 48 LGPD** — Obrigacao de comunicar incidentes a ANPD e titulares
- **Art. 18, §5 LGPD** — Prazo de 15 dias para atender requisicoes de titulares
- **Resolucao CFM 1.821/2007** — Guarda de prontuarios por 20 anos
- **Resolucao CFM 2.314/2022** — Telemedicina

---

*Este documento e confidencial e de uso exclusivo da equipe VoxClinic. Nao compartilhar externamente.*
