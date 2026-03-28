# Compliance Regulatorio — LGPD, CFM, ANS e Seguranca da Informacao

> Relatorio de pesquisa exaustivo para o VoxClinic CRM.
> Data: 28/03/2026

---

## Sumario Executivo

Este documento mapeia **todos os requisitos legais e regulatorios** aplicaveis a um CRM de saude operando no Brasil, com foco em:

1. LGPD (Lei 13.709/2018) — tratamento de dados sensiveis de saude
2. CFM — prontuario eletronico, telemedicina, prescricao digital
3. ANS/TISS — padrao de troca de informacoes com operadoras
4. Seguranca da informacao — criptografia, controle de acesso, auditoria
5. Benchmarking — como os principais CRMs implementam compliance

Para cada requisito, indicamos: **base legal**, **status atual do VoxClinic**, e **acoes necessarias**.

---

## 1. LGPD na Saude

### 1.1 Dados Sensiveis — Art. 5o, II

A LGPD define como **dados pessoais sensiveis** (Art. 5o, II):

- Dados referentes a **saude** ou a **vida sexual**
- Dados **geneticos** ou **biometricos**
- Origem racial/etnica, conviccao religiosa, opiniao politica

**Implicacao para o VoxClinic:** Praticamente TODOS os dados armazenados no sistema sao sensiveis — prontuario, anamnese, historico medico, gravacoes de consulta, prescricoes, atestados. Isso exige o **nivel mais alto de protecao** previsto na lei.

### 1.2 Bases Legais para Tratamento — Arts. 7 e 11

O Art. 11 da LGPD estabelece que dados sensiveis so podem ser tratados com:

| Base Legal | Artigo | Aplicacao no VoxClinic |
|---|---|---|
| **Consentimento explicito** | Art. 11, I | Gravacao de audio (LGPD consent modal ja implementado) |
| **Tutela da saude** | Art. 11, II, f | Prontuario medico, anamnese, historico — por profissionais de saude |
| **Obrigacao legal/regulatoria** | Art. 11, II, a | Retencao de 20 anos (CFM 1.821/2007), emissao de NFS-e |
| **Exercicio regular de direitos** | Art. 11, II, d | Defesa em processos judiciais (erro medico) |
| **Protecao da vida** | Art. 11, II, e | Emergencias medicas, alergias criticas |

**IMPORTANTE:** A base legal de **"tutela da saude"** (Art. 11, II, f) so pode ser utilizada **em procedimento realizado por profissionais de saude, servicos de saude ou autoridade sanitaria**. Isso cobre a maioria das operacoes do CRM quando usado por profissionais de saude.

**Restricao critica (Art. 11, par. 4o):** E **vedado** o compartilhamento de dados sensiveis de saude para **obter vantagem economica**, exceto para prestacao de servicos de saude em beneficio do titular.

### 1.3 Consentimento — Quando e Como

| Situacao | Base Legal Recomendada | Consentimento Necessario? |
|---|---|---|
| Prontuario medico | Tutela da saude (Art. 11, II, f) | Nao (mas recomendado informar) |
| Gravacao de audio | Consentimento (Art. 11, I) | **Sim, explicito** |
| Envio de lembretes WhatsApp | Consentimento (Art. 7, I) | **Sim** |
| Pesquisa NPS | Legitimo interesse (Art. 7, IX) | Nao (mas opt-out obrigatorio) |
| Compartilhamento com convenio | Execucao de contrato (Art. 7, V) | Depende do contrato |
| Analytics/relatorios | Legitimo interesse (Art. 7, IX) | Nao (dados anonimizados/agregados) |

**Status VoxClinic:** Ja implementado `ConsentRecord` model e modal de consentimento LGPD para gravacao de audio. Falta: consentimento para WhatsApp, politica de privacidade detalhada.

### 1.4 Direitos do Titular — Art. 18

O titular tem direito a:

| Direito | Artigo | Implementacao Necessaria |
|---|---|---|
| **Confirmacao de tratamento** | Art. 18, I | Endpoint/tela para o paciente verificar |
| **Acesso aos dados** | Art. 18, II | Export de dados do paciente (parcialmente existe: export Excel) |
| **Correcao** | Art. 18, III | Paciente pode solicitar correcao (via profissional) |
| **Anonimizacao/bloqueio** | Art. 18, IV | Soft delete ja existe; falta anonimizacao |
| **Portabilidade** | Art. 18, V | Export em formato estruturado (JSON/XML) |
| **Eliminacao** | Art. 18, VI | Limitado: prontuario tem retencao de 20 anos (CFM) |
| **Informacao sobre compartilhamento** | Art. 18, VII | Politica de privacidade |
| **Revogacao do consentimento** | Art. 18, IX | Mecanismo de opt-out |

**Conflito LGPD vs CFM:** O paciente pode pedir eliminacao (Art. 18, VI), mas o CFM exige retencao de 20 anos. A LGPD preve excecao: dados necessarios para **cumprimento de obrigacao legal** (Art. 16, I) nao precisam ser eliminados. O sistema deve informar o titular sobre essa retencao obrigatoria.

### 1.5 Encarregado de Dados (DPO) — Art. 41

- **Obrigatorio** para controladores que tratam dados sensiveis
- Clinicas medicas **devem** nomear um DPO, mesmo as menores
- ANPD Resolucao no 2/2022 flexibiliza para micro/pequenas empresas, **porem** o tratamento de dados sensiveis em larga escala exige nomeacao
- DPO foi incluido na CBO (Classificacao Brasileira de Ocupacoes) em 2024

**Implicacao VoxClinic:** O sistema deve permitir que cada workspace registre seu DPO e disponibilize o contato publicamente (exigencia do Art. 41, par. 1o).

### 1.6 RIPD — Relatorio de Impacto a Protecao de Dados

- **Art. 38:** A ANPD pode solicitar RIPD ao controlador, especialmente para dados sensiveis
- **Resolucao CD/ANPD (em regulamentacao):** O RIPD deve conter descricao dos dados, metodologia de coleta, medidas de seguranca e analise de riscos
- Para CRMs de saude, o RIPD e **altamente recomendado** mesmo sem solicitacao formal

**Conteudo minimo do RIPD:**
1. Descricao dos processos de tratamento (transcricao de audio, extracao por IA, prontuario)
2. Dados pessoais tratados (categorias, volume)
3. Agentes envolvidos (Supabase, OpenAI Whisper, Anthropic Claude, Daily.co)
4. Riscos identificados (vazamento, acesso nao autorizado, bias de IA)
5. Medidas de mitigacao implementadas

### 1.7 Transferencia Internacional de Dados — Art. 33

**Resolucao CD/ANPD no 19/2024** regulamenta transferencias internacionais:

| Servico | Localizacao | Transferencia Internacional? | Mitigacao |
|---|---|---|---|
| Supabase (PostgreSQL) | sa-east-1 (Sao Paulo) | **Nao** — dados no Brasil | OK |
| OpenAI Whisper API | EUA | **Sim** | Clausulas contratuais padrao |
| Anthropic Claude API | EUA | **Sim** | Clausulas contratuais padrao |
| Clerk (auth) | EUA | **Sim** (metadados de auth) | Clausulas contratuais padrao |
| Daily.co (teleconsulta) | EUA | **Sim** (video stream) | Clausulas contratuais padrao |
| Resend (email) | EUA | **Sim** (metadados de email) | Clausulas contratuais padrao |

**Art. 33 permite transferencia quando:**
- (I) Pais com grau adequado de protecao (EUA nao reconhecido pela ANPD)
- (II) Clausulas contratuais especificas (mecanismo mais viavel)
- (VIII) Consentimento especifico e destacado do titular

**Acoes necessarias:**
1. Documentar todas as transferencias internacionais
2. Verificar termos de servico de cada fornecedor (DPA — Data Processing Agreement)
3. Incluir na politica de privacidade: quais dados vao para fora do Brasil e por que
4. Considerar migrar processamento de IA para endpoints regionais quando disponiveis

### 1.8 Incidentes de Seguranca — Art. 48

**Resolucao CD/ANPD no 15/2024** (Regulamento de Comunicacao de Incidente de Seguranca — RCIS):

- **Prazo:** 3 dias uteis para comunicar a ANPD e aos titulares
- **Complementacao:** 20 dias uteis adicionais para informacoes complementares
- **Criterios de gravidade** (obrigam comunicacao):
  - Dados sensiveis (saude) — **sim, sempre**
  - Dados de criancas/adolescentes
  - Dados financeiros
  - Dados de autenticacao
  - Larga escala

**Implementacao necessaria:**
1. Plano de resposta a incidentes documentado
2. Canal interno para reporte de incidentes
3. Template de comunicacao a ANPD pre-preparado
4. Registro de todos os incidentes (mesmo nao graves)

### 1.9 Penalidades — Art. 52

| Sancao | Limite |
|---|---|
| Advertencia | Com prazo para correcao |
| Multa simples | Ate 2% do faturamento, max **R$ 50.000.000** por infracao |
| Multa diaria | Mesmo limite da multa simples |
| Publicizacao da infracao | Dano reputacional |
| Bloqueio dos dados | Suspensao do tratamento |
| Eliminacao dos dados | Perda total dos dados |
| Suspensao do banco de dados | Ate 6 meses, prorrogavel |

**Casos reais de enforcement da ANPD (2024-2025):**
- INSS: multa de R$ 10 milhoes por nao comunicar incidente de seguranca
- SEEDF: 4 advertencias por falta de RIPD e registros inadequados
- Exposicao de dados de saude de 3.030 menores: classificado como grave

---

## 2. Conselho Federal de Medicina (CFM)

### 2.1 Resolucao CFM 1.821/2007 — Prontuario Eletronico

**Base legal principal** para prontuarios eletronicos. Requisitos:

| Requisito | Descricao | Status VoxClinic |
|---|---|---|
| Integridade | Dados nao podem ser alterados sem rastreabilidade | Parcial (AuditLog existe) |
| Autenticidade | Identificacao inequivoca do autor de cada registro | Sim (auth via Clerk) |
| Confidencialidade | Acesso restrito a profissionais autorizados | Sim (multi-tenant + auth) |
| Disponibilidade | Sistema acessivel quando necessario | Depende de infra (Vercel/Supabase SLA) |
| Retencao 20 anos | A partir do ultimo registro do paciente | Sim (soft delete, sem purge) |
| Auditoria | Log de todos os acessos e alteracoes | Sim (AuditLog model) |

**Lei 13.787/2018** complementa, regulamentando a digitalizacao de prontuarios:
- Digitalizacao deve assegurar **integridade, autenticidade e confidencialidade**
- Uso de **certificado digital ICP-Brasil** para assinatura
- Documentos digitalizados podem substituir papel **somente com NGS2**
- Comissao permanente de revisao deve avalizar eliminacao de papel
- Prazo minimo de **20 anos** a partir do ultimo registro

### 2.2 Certificacao SBIS/CFM — NGS1 e NGS2

A SBIS (Sociedade Brasileira de Informatica em Saude), em convenio com o CFM, expede selo de qualidade:

**NGS1 (Nivel de Garantia de Seguranca 1):**
- Controle de versao do software
- Controle de acesso e autenticacao
- Disponibilidade e recuperacao
- Comunicacao remota segura (HTTPS)
- Auditoria completa (quem, quando, o que)
- Documentacao tecnica

**NGS2 (Nivel de Garantia de Seguranca 2):**
- Tudo do NGS1 +
- **Certificado digital ICP-Brasil** para assinatura e autenticacao
- Permite substituicao total do papel (100% digital)
- Validade juridica dos documentos eletronicos

**A certificacao SBIS e obrigatoria?**
- **Nao e obrigatoria por lei** para operar um sistema de prontuario eletronico
- Porem, **so sistemas com NGS2 podem eliminar o prontuario em papel**
- E um selo de qualidade e confiabilidade reconhecido pelo mercado
- Categorias certificaveis: PEP, Telessaude, Prescricao Eletronica, SADT

**Modelo de maturidade (3 estagios):**
- Estagio 1: Requisitos basicos de seguranca e funcionalidade
- Estagio 2: Requisitos avancados + interoperabilidade
- Estagio 3: Maturidade plena + conformidade total

**Sistemas com certificacao SBIS ativa (referencia):**
- TechSallus, Tasy (Philips), MV Soul, ProDoctor (entre outros)
- Lista completa em: https://sbis.org.br/certificacoes/certificacao-software/sistemas-certificados/

### 2.3 Resolucao CFM 2.314/2022 — Telemedicina

**Requisitos legais para teleconsulta:**

| Requisito | Descricao | Status VoxClinic |
|---|---|---|
| **Consentimento** | Termo de concordancia livre e esclarecido | Implementado (LGPD consent no RecordButton + consent na sala do paciente) |
| **Registro em prontuario** | Atendimento deve ser registrado em SRES | Sim (appointment + notes) |
| **Assinatura digital ICP-Brasil** | Medico deve possuir assinatura digital qualificada | **NAO implementado** |
| **Sede no Brasil** | Plataforma deve ter sede no Brasil e CRM | VoxClinic: sim. Daily.co: nao (EUA) |
| **Responsavel tecnico** | PJ deve ter RT medico inscrito no CRM | Depende da clinica |
| **Preservacao de dados** | Integridade, autenticidade, confidencialidade | Parcial |
| **Gravacao** | Se houver gravacao, paciente deve consentir | Implementado (consent record) |

**ALERTA CRITICO:** A Resolucao exige que **plataformas de telemedicina tenham sede no Brasil** e inscricao no CRM. O Daily.co (usado pelo VoxClinic para teleconsulta) e uma empresa americana. Alternativas a considerar:
- Documentar que o VoxClinic e a plataforma (Daily.co e apenas infraestrutura de video)
- Ou migrar para solucao nacional (ex: Whereby com servers brasileiros, ou solucao propria via WebRTC)

### 2.4 Resolucao CFM 2.299/2021 — Prescricao Eletronica

**Requisitos para documentos medicos eletronicos:**

| Requisito | Descricao | Status VoxClinic |
|---|---|---|
| **Assinatura digital ICP-Brasil (NGS2)** | Obrigatoria para validade legal | **NAO implementado** |
| **Identificacao do medico** | Nome, CRM, endereco, RQE | Parcial (clinicName existe) |
| **Identificacao do paciente** | Nome, documento legal | Sim |
| **Validacao ITI/CFM** | Assinatura validavel pelo ITI ou CFM | **NAO implementado** |
| **Data e hora** | Timestamp do documento | Sim |
| **Plataforma inscrita no CRM** | PJ deve estar inscrita no CRM da jurisdicao | Depende da clinica |

**Portal de Prescricao Eletronica do CFM:** https://prescricaoeletronica.cfm.org.br/

**Implicacao:** Atualmente o VoxClinic gera prescricoes e atestados como **paginas para impressao** (Ctrl+P -> PDF). Para terem **validade juridica digital** (sem necessidade de impressao), seria necessario integrar assinatura ICP-Brasil.

Alternativas de integracao:
- **SOLUTI Bird ID** — API de assinatura digital em nuvem
- **VALID VIDaaS** — Assinatura remota ICP-Brasil
- **Certisign RemoteID** — Certificado em nuvem
- **BRy Tecnologia** — SDK de assinatura para PEP

### 2.5 Retencao de Prontuario — 20 Anos

- **CFM Resolucao 1.821/2007, Art. 7o:** Prazo minimo de 20 anos a partir do ultimo registro
- **Lei 13.787/2018, Art. 6o:** Mesmo prazo para prontuarios digitalizados
- Apos 20 anos, pode ser eliminado **ou devolvido ao paciente**
- Documentos de **valor historico** devem ser preservados indefinidamente
- **Codigo Civil, Art. 205:** Prescricao geral de 10 anos para acoes civeis
- **ECA:** Para menores, prazo comeca a contar da maioridade (18 anos)

**Status VoxClinic:** Soft delete implementado (`isActive: false`). Dados nunca sao apagados fisicamente. **Porem falta:** politica documentada de retencao, mecanismo de purge apos 20 anos, alerta para documentos proximos do prazo.

---

## 3. ANS / TISS

### 3.1 Padrao TISS — Versao Atual

**TISS (Troca de Informacao de Saude Suplementar)** e o padrao obrigatorio da ANS para trocas eletronicas entre prestadores e operadoras de planos de saude.

**Versao atual (dez/2025):** 04.02.00

**5 Componentes do TISS:**

| Componente | Descricao |
|---|---|
| **Organizacional** | Regras operacionais, prazos, fluxos |
| **Conteudo e Estrutura** | Arquitetura XML, campos obrigatorios, schemas XSD |
| **Representacao de Conceitos** | TUSS (Terminologia Unificada da Saude Suplementar) |
| **Seguranca e Privacidade** | Sigilo, confidencialidade, autenticacao |
| **Comunicacao** | Meios e metodos de transmissao (webservice, upload) |

### 3.2 Guias Obrigatorias

| Guia | Uso | Campos-chave |
|---|---|---|
| **Consulta** | Consultas medicas | Dados do beneficiario, prestador, procedimento TUSS, CBO |
| **SP/SADT** | Exames, procedimentos, terapias, pequenas cirurgias | Procedimento, quantidade, tipo guia, indicacao clinica |
| **Honorarios** | Honorarios medicos individuais (em internacao) | Procedimento, via acesso, tecnica |
| **Internacao** | Resumo de internacao | CID, procedimentos, materiais/OPME |
| **Outras Despesas** | Materiais, medicamentos, gases | Codigo TUSS, quantidade, valor |

### 3.3 Schema XML e Validacao

- Schemas XSD disponiveis em: https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss
- Validacao concentrada no Schema XSD
- Campos marcados com asterisco (*) sao obrigatorios
- Formato: XML com encoding UTF-8

### 3.4 Webservice de Elegibilidade e Autorizacao

- Verificacao de elegibilidade do beneficiario em tempo real
- Solicitacao de autorizacao previa para procedimentos
- Acompanhamento de status de guias

### 3.5 Glosas e Recursos

- Operadoras podem glosar (negar pagamento) guias
- Prestador pode recorrer com justificativa
- Prazos e regras no componente organizacional TISS

### 3.6 Relevancia para o VoxClinic

**Atualmente:** O VoxClinic **nao implementa TISS**. Integracao TISS seria necessaria para:
- Clinicas que atendem convenios
- Envio automatico de guias de consulta
- Verificacao de elegibilidade antes do agendamento
- Faturamento de convenios

**Prioridade:** Media-alta para clinicas com convenio. Baixa para profissionais particulares.

---

## 4. Seguranca da Informacao

### 4.1 Criptografia

**LGPD Art. 46:** Agentes de tratamento devem adotar **medidas tecnicas e administrativas** aptas a proteger dados pessoais.

| Tipo | Requisito | Status VoxClinic | Recomendacao |
|---|---|---|---|
| **Em transito** | TLS 1.2+ (recomendado 1.3) | Sim (HTTPS via Vercel + Supabase) | Verificar TLS 1.3 |
| **Em repouso (banco)** | AES-256 | Sim (Supabase encryption at rest) | Documentar |
| **Em repouso (storage)** | AES-256 | Sim (Supabase Storage) | Documentar |
| **Tokens/credenciais** | AES-256-GCM | Sim (`src/lib/crypto.ts` implementado) | OK |
| **Backups** | Criptografia de backups | Depende de Supabase | Verificar |

**Algoritmos implementados no VoxClinic:**
- `aes-256-gcm` para criptografia de tokens (WhatsApp, etc.)
- IV de 12 bytes, AuthTag para integridade
- Chave via `ENCRYPTION_KEY` (env var, 32 bytes hex)

### 4.2 Controle de Acesso (RBAC)

| Controle | Status VoxClinic | Recomendacao |
|---|---|---|
| Autenticacao forte | Sim (Clerk — email/senha + OAuth) | Considerar MFA obrigatorio |
| Multi-tenant isolation | Sim (workspaceId em todas as queries) | OK |
| Role-based access | Parcial (user/superadmin) | Expandir: admin, medico, secretaria, estagiario |
| Perfis por funcionalidade | Nao implementado | Adicionar granularidade (quem pode ver prontuario, quem pode editar, etc.) |
| Timeout de sessao | Depende do Clerk | Configurar idle timeout |
| Bloqueio por tentativas | Depende do Clerk | Verificar rate limiting |

**Requisito SBIS/NGS1:** Controle de acesso baseado em perfis com log de autenticacao.

### 4.3 Auditoria de Acesso

**Requisito legal:** Quem acessou qual prontuario, quando, e que acao realizou.

| Aspecto | Status VoxClinic | Gap |
|---|---|---|
| Log de mutacoes (create/update/delete) | Sim (`AuditLog` model) | OK |
| Log de leitura (quem visualizou prontuario) | **NAO implementado** | CRITICO — CFM exige |
| Retencao de logs | Sem politica definida | Definir retencao (minimo 5 anos) |
| Consulta de logs | Sim (`/settings/audit`) | OK |
| Imutabilidade de logs | Nao garantida | Considerar append-only ou log externo |
| IP/dispositivo | Nao registrado | Recomendado |

**ACAO CRITICA:** Implementar **audit log de leitura** — toda vez que um profissional visualiza um prontuario, isso deve ser registrado. Isso e requisito do CFM e padrao SBIS.

### 4.4 Backup e Disaster Recovery

| Requisito | Status | Recomendacao |
|---|---|---|
| Backup automatico | Sim (Supabase daily backups) | Documentar frequencia |
| Redundancia geografica | Sim (Supabase sa-east-1 com redundancia) | Verificar RPO/RTO |
| Teste de restauracao | Nao documentado | Testar semestralmente (minimo) |
| RPO (Recovery Point Objective) | Depende do plano Supabase | Alvo: < 1 hora para dados de saude |
| RTO (Recovery Time Objective) | Depende da infra | Alvo: < 4 horas |
| Plano de DR documentado | **Nao existe** | Criar e testar |

### 4.5 Incidentes de Seguranca

**Resolucao CD/ANPD no 15/2024:**

```
Fluxo de resposta a incidentes:

1. Deteccao → Registro interno (hora, natureza, dados afetados)
2. Avaliacao → Gravidade (dados sensiveis de saude = SEMPRE grave)
3. Contencao → Isolar o incidente
4. Comunicacao ANPD → 3 dias uteis
5. Comunicacao titulares → 3 dias uteis
6. Complementacao → 20 dias uteis
7. Pos-incidente → Analise de causa raiz, correcoes
```

**Status VoxClinic:** Nao existe plano de resposta a incidentes documentado.

### 4.6 Penalidades por Vazamento de Dados Medicos

- **LGPD Art. 52:** Multa de ate R$ 50 milhoes
- **Codigo Penal Art. 154:** Violacao de sigilo profissional — detencao de 3 meses a 1 ano + multa
- **Codigo de Etica Medica:** Suspensao ou cassacao do registro profissional
- **Responsabilidade civil:** Indenizacao por danos morais (jurisprudencia: R$ 10.000 a R$ 100.000+)

---

## 5. Como os Principais CRMs Implementam Compliance

### 5.1 Comparativo de Features de Seguranca

| Feature | iClinic | Doctoralia | Amplimed | ProDoctor | Clinicorp | **VoxClinic** |
|---|---|---|---|---|---|---|
| Criptografia SSL/TLS | 256-bit | 256-bit | HTTPS | HTTPS | HTTPS | **Sim (TLS)** |
| Criptografia em repouso | Sim | Sim | Sim (TIER III) | Sim | Sim | **Sim (Supabase)** |
| Certificado digital ICP-Brasil | Via parceiro | Sim | SOLUTI/VALID/Certisign | Integrado (gratis) | Sim | **Nao** |
| Audit trail | Basico | Basico | Sim | Completo | Sim | **Parcial** |
| Audit de leitura | Nao claro | Nao claro | Nao claro | Sim | Sim | **Nao** |
| Perfis de acesso | Sim | Sim | Sim | Sim | Sim | **Basico** |
| SBIS certificacao | Nao | Nao | Nao | **Sim** | Nao | **Nao** |
| Backup automatico | Sim | Sim | Sim | Sim | Sim | **Sim** |
| Consentimento LGPD | Tela de consentimento | Sim | Sim | Sim | Sim | **Sim (audio)** |
| Politica privacidade | Publica | Publica | Publica | Publica | Publica | **Nao publicada** |
| DPO nomeado | Sim | Sim | Sim | Sim | Sim | **Nao** |
| Data center Brasil | Sim | Sim | Sim (TIER III) | Sim | Sim | **Sim (Supabase sa-east-1)** |

### 5.2 Destaques por CRM

**ProDoctor:**
- Unico com certificacao SBIS ativa entre os mais populares
- Assinatura digital ICP-Brasil integrada sem custo adicional
- Audit trail completo (insercoes, alteracoes, consultas)
- Referencia em compliance para o segmento

**Amplimed:**
- Data center com certificacoes TIER III, HIPAA e PCI
- 3 opcoes de certificado digital integrado (SOLUTI, VALID, Certisign)
- Controle de acesso granular por perfil

**iClinic:**
- Criptografia 256-bit SSL
- Segue requisitos NGS do CFM
- Foco em simplicidade para consultorio individual

**Doctoralia:**
- Foco em marketplace + agendamento
- Compliance basico de LGPD
- Integracao com agenda e prontuario simplificado

**Clinicorp:**
- Foco em odontologia
- Controle individual por login e permissoes
- Rastreabilidade completa de alteracoes

---

## 6. Checklist de Conformidade — VoxClinic

### 6.1 LGPD

| # | Requisito | Prioridade | Status | Acao |
|---|---|---|---|---|
| L01 | Politica de privacidade publica | **P0** | Nao existe | Criar e publicar em /privacy |
| L02 | Termos de uso | **P0** | Nao existe | Criar e publicar em /terms |
| L03 | Consentimento para gravacao de audio | P1 | **OK** | ConsentRecord + modal LGPD |
| L04 | Consentimento para WhatsApp | **P0** | Nao existe | Opt-in antes do primeiro envio |
| L05 | Portal de direitos do titular | P1 | Nao existe | Tela para paciente solicitar acesso/correcao/eliminacao |
| L06 | Portabilidade de dados | P1 | Parcial (export Excel) | Adicionar export JSON/XML completo |
| L07 | Nomeacao de DPO | **P0** | Nao existe | Campo no workspace settings + pagina publica |
| L08 | RIPD (Relatorio de Impacto) | P1 | Nao existe | Documento tecnico (template) |
| L09 | Registro de atividades de tratamento | P1 | Nao existe | Documento mapeando todos os tratamentos |
| L10 | Comunicacao de transferencia internacional | P1 | Nao documentado | Documentar na politica de privacidade |
| L11 | Plano de resposta a incidentes | **P0** | Nao existe | Criar procedimento + template ANPD |
| L12 | Consentimento para teleconsulta | P1 | **OK** | Consent na sala do paciente |
| L13 | Mecanismo de revogacao de consentimento | P1 | Nao existe | Implementar opt-out |

### 6.2 CFM

| # | Requisito | Prioridade | Status | Acao |
|---|---|---|---|---|
| C01 | Assinatura digital ICP-Brasil | P1 | **Nao implementado** | Integrar SOLUTI/VALID/Certisign API |
| C02 | Audit log de leitura de prontuario | **P0** | **Nao implementado** | Logar toda visualizacao de paciente |
| C03 | Retencao de 20 anos documentada | P1 | Parcial (soft delete) | Politica formal + campo lastRecordDate |
| C04 | Identificacao completa do medico na prescricao | P1 | Parcial | Adicionar CRM, RQE, endereco no perfil |
| C05 | Identificacao do medico no atestado | P1 | Parcial | Mesmo acima |
| C06 | Integridade do prontuario (versionamento) | P2 | Nao | Considerar versionamento de registros |
| C07 | Disponibilidade e SLA | P2 | Depende de infra | Documentar SLA Vercel + Supabase |

### 6.3 Seguranca

| # | Requisito | Prioridade | Status | Acao |
|---|---|---|---|---|
| S01 | Criptografia em transito (TLS 1.2+) | P0 | **OK** | Verificar TLS 1.3 |
| S02 | Criptografia em repouso | P0 | **OK** | Supabase encryption |
| S03 | Criptografia de tokens/credenciais | P0 | **OK** | AES-256-GCM implementado |
| S04 | MFA (autenticacao multifator) | P1 | Nao obrigatorio | Habilitar no Clerk, recomendado para saude |
| S05 | RBAC granular | P1 | Basico (user/superadmin) | Expandir perfis |
| S06 | Timeout de sessao | P1 | Depende do Clerk | Configurar 30min idle |
| S07 | Backup e DR documentado | **P0** | Nao documentado | Criar plano + testar restauracao |
| S08 | Imutabilidade de audit logs | P2 | Nao garantida | Avaliar append-only storage |
| S09 | Penetration testing | P2 | Nao realizado | Contratar pentest anual |
| S10 | Log de IP/dispositivo | P2 | Nao | Registrar em AuditLog |

### 6.4 ANS/TISS

| # | Requisito | Prioridade | Status | Acao |
|---|---|---|---|---|
| T01 | Geracao de guia de consulta TISS XML | P2 | Nao existe | Implementar quando houver demanda de convenios |
| T02 | Geracao de guia SP/SADT | P2 | Nao existe | Idem |
| T03 | Validacao contra XSD da ANS | P2 | Nao existe | Idem |
| T04 | Webservice de elegibilidade | P2 | Nao existe | Idem |
| T05 | Codigo TUSS nos procedimentos | P2 | Nao existe | Adicionar campo opcional de TUSS |

---

## 7. Acoes Prioritarias — Roadmap de Compliance

### Fase 1 — Urgente (1-2 meses)

1. **Politica de privacidade e termos de uso** (L01, L02)
   - Publicar em `/privacy` e `/terms`
   - Incluir: dados coletados, finalidades, bases legais, transferencia internacional, direitos do titular, DPO
   - Link no footer de todas as paginas

2. **Audit log de leitura** (C02)
   - Logar `patient.viewed`, `appointment.viewed`, `recording.played` no AuditLog
   - Incluir userId, IP (req.headers), timestamp
   - Requisito mais critico do CFM

3. **Plano de resposta a incidentes** (L11)
   - Documentar procedimento interno
   - Template de comunicacao ANPD
   - Responsaveis e contatos

4. **Consentimento WhatsApp** (L04)
   - Opt-in explicito antes do primeiro envio
   - Registrar em ConsentRecord
   - Opcao de opt-out em cada mensagem

5. **DPO** (L07)
   - Campo no workspace settings para nome e contato do DPO
   - Disponibilizar publicamente (requisito Art. 41)

### Fase 2 — Importante (3-6 meses)

6. **RBAC granular** (S05)
   - Perfis: admin, profissional, secretaria, estagiario
   - Permissoes por funcionalidade (prontuario, financeiro, configuracoes)
   - Modelo `Role` e `Permission` no Prisma

7. **Assinatura digital ICP-Brasil** (C01)
   - Integrar API de assinatura em nuvem (SOLUTI Bird ID ou similar)
   - Assinar prescricoes e atestados digitalmente
   - Validacao via ITI/CFM

8. **Portal de direitos do titular** (L05)
   - Tela onde paciente pode solicitar acesso, correcao ou eliminacao
   - Workflow: solicitacao → analise do profissional → resposta em 15 dias
   - Registro de todas as solicitacoes

9. **RIPD** (L08)
   - Documento tecnico mapeando todos os tratamentos de dados
   - Riscos e medidas de mitigacao
   - Atualizar anualmente

10. **MFA** (S04)
    - Habilitar MFA opcional no Clerk
    - Recomendacao forte para profissionais de saude

### Fase 3 — Diferencial (6-12 meses)

11. **Certificacao SBIS** (NGS1 inicialmente)
    - Mapear requisitos da lista v5.2
    - Implementar gaps
    - Submeter para certificacao

12. **Integracao TISS** (T01-T05)
    - Geracao de guias XML
    - Codigo TUSS nos procedimentos
    - Webservice de elegibilidade

13. **Versionamento de prontuario** (C06)
    - Historico de alteracoes com diff
    - Impossibilidade de apagar registros anteriores

14. **Penetration testing** (S09)
    - Contratar pentest profissional
    - Remediar vulnerabilidades
    - Repetir anualmente

---

## 8. Fontes Legais e Referencias

### Legislacao

- **Lei 13.709/2018 (LGPD)** — https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- **Lei 13.787/2018** (Digitalizacao de prontuarios) — https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13787.htm
- **Resolucao CFM 1.821/2007** — https://sistemas.cfm.org.br/normas/visualizar/resolucoes/BR/2007/1821
- **Resolucao CFM 2.314/2022** (Telemedicina) — https://sistemas.cfm.org.br/normas/visualizar/resolucoes/BR/2022/2314
- **Resolucao CFM 2.299/2021** (Prescricao eletronica) — https://sistemas.cfm.org.br/normas/arquivos/resolucoes/BR/2021/2299_2021.pdf
- **Resolucao CD/ANPD no 15/2024** (Incidentes de seguranca) — https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis
- **Resolucao CD/ANPD no 19/2024** (Transferencia internacional) — https://www.gov.br/anpd/pt-br/assuntos/noticias/resolucao-normatiza-transferencia-internacional-de-dados

### Certificacoes e Padroes

- **SBIS Certificacao S-RES** — https://sbis.org.br/certificacoes/certificacao-software/
- **SBIS Sistemas Certificados** — https://sbis.org.br/certificacoes/certificacao-software/sistemas-certificados/
- **SBIS Requisitos v5.2** — https://sbis.org.br/certificacoes/certificacao-software/manuais-e-listas-de-requisitos/
- **Padrao TISS ANS** — https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss
- **Portal Prescricao Eletronica CFM** — https://prescricaoeletronica.cfm.org.br/

### ANPD

- **ANPD Portal** — https://www.gov.br/anpd/pt-br
- **RIPD Orientacoes** — https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/relatorio-de-impacto-a-protecao-de-dados-pessoais-ripd
- **Guia Basico Privacidade e Seguranca** — https://bvsms.saude.gov.br/bvs/publicacoes/guiabasico_privacidade_seguranca_informacao.pdf

### Artigos e Analises

- **ANPD Enforcement 2024** — https://www.saudlaw.com/2025/03/balanco-da-atuacao-da-anpd-em-2024-novas-resolucoese-medidas-de-enforcement-aplicadas/
- **Multas LGPD 2025** — https://lgpdpro.com.br/multas-lgpd-2025-valores-casos-reais-e-como-evitar/
- **Tratamento de dados sensiveis de saude** — https://academiamedica.com.br/blog/tratamento-de-dados-da-saude-sensiveis-na-lei-geral-de-protecao-de-dados
- **iClinic LGPD** — https://blog.iclinic.com.br/lgpd-na-saude-iclinic/
- **Amplimed LGPD** — https://www.amplimed.com.br/blog/lei-geral-protecao-dados-area-medica/
- **Clinicorp LGPD Prontuario** — https://www.clinicorp.com/post/sistema-prontuario-eletronico-conforme-lgpd

---

## 9. Resumo de Gaps Criticos

| Gap | Risco | Prioridade | Esforco |
|---|---|---|---|
| Sem politica de privacidade publica | Multa ANPD, perda de confianca | **P0** | Baixo (documento) |
| Sem audit de leitura de prontuario | Nao-conformidade CFM | **P0** | Medio (dev) |
| Sem plano de resposta a incidentes | Multa ANPD (caso INSS: R$10M) | **P0** | Baixo (documento) |
| Sem assinatura digital ICP-Brasil | Prescricoes/atestados sem validade juridica digital | **P1** | Alto (integracao API) |
| RBAC basico (apenas user/superadmin) | Acesso excessivo por secretarias/estagiarios | **P1** | Alto (dev) |
| Sem DPO registrado | Nao-conformidade LGPD Art. 41 | **P0** | Baixo (campo + pagina) |
| Daily.co (teleconsulta) com sede fora do Brasil | Risco regulatorio CFM 2.314 | **P1** | Alto (avaliacao de alternativas) |
| Sem consentimento explicito para WhatsApp | Nao-conformidade LGPD | **P0** | Medio (dev) |
| Transferencias internacionais nao documentadas | Nao-conformidade LGPD Art. 33 | **P1** | Baixo (documentacao) |
| Sem teste de restauracao de backup | Risco operacional | **P1** | Baixo (procedimento) |
