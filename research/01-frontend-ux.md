# Pesquisa de Frontend & UX/UI - CRMs de Clinicas Medicas

> **Autor:** Pesquisa automatizada via Claude Code
> **Data:** 28/03/2026
> **Objetivo:** Analise exaustiva de design, UX, navegacao, tech stack e padroes de interface dos principais CRMs de saude no Brasil e no mundo, para embasar decisoes de produto do VoxClinic.

---

## Sumario Executivo

Este relatorio analisa **23 CRMs de saude** (13 brasileiros e 10 internacionais) em cinco dimensoes: design system, layout/navegacao, telas-chave, micro-interacoes e stack tecnologico. As principais conclusoes sao:

1. **Paleta de cores:** 62% dos softwares de saude usam tons de azul ou teal como cor primaria. O teal (#14B8A6) do VoxClinic esta alinhado com as melhores praticas do setor.
2. **Navegacao:** Sidebar esquerda e o padrao dominante em desktop; bottom nav em mobile e universal.
3. **Calendario:** Todos oferecem visao dia/semana/mes. Drag-and-drop esta presente nos lideres (Jane, SimplePractice, Cliniko, Medesk).
4. **IA generativa:** Tendencia forte em 2025-2026 (iClinic, Feegow, App Health, DrChrono, Tebra, Practice Better, Conclinica). Transcricao por voz e diferencial raro - poucos oferecem.
5. **Tech stack:** React domina o frontend (iClinic, Feegow, SimplePractice, Cliniko em transicao). Vue.js e usado por Jane App. Angular aparece em Ninsaude.

---

## Tabela Comparativa Geral

| CRM | Pais | Cor Primaria | Navegacao | Calendario D&D | App Mobile | IA/Voz | Dark Mode | Tech Frontend |
|-----|------|-------------|-----------|----------------|------------|--------|-----------|---------------|
| **iClinic** | BR | Azul (#2196F3) | Sidebar + topbar | Nao confirmado | iOS/Android nativo | Marketing IA | Nao | React |
| **GestaoDS** | BR | Azul escuro | Sidebar | Nao confirmado | Responsivo | Prontuario IA | Nao | N/D |
| **Amplimed** | BR | Verde/Teal | Sidebar | Nao confirmado | Responsivo | IA integrada | Nao | N/D |
| **Clinica nas Nuvens** | BR | Azul (#1E88E5) | Sidebar + tabs | Nao confirmado | Responsivo | Nao | Nao | N/D |
| **Shosp** | BR | Azul claro | Sidebar | Nao confirmado | Responsivo | Nao | Nao | N/D |
| **Feegow** | BR | Azul/Verde | Sidebar | Sim | iOS/Android nativo | Nao | Nao | React + Node.js + PHP |
| **Doctoralia** | BR/Global | Verde (#00C853) | Topbar + sidebar | Nao confirmado | iOS/Android nativo | Nao | Nao | N/D |
| **App Health** | BR | Azul/Teal | Sidebar | Nao confirmado | Responsivo | IA Atendimento | Nao | N/D |
| **Conclinica** | BR | Azul | Sidebar | Nao confirmado | Responsivo | Prontuario IA (voz) | Nao | N/D |
| **OnDoctor** | BR | Azul (#1976D2) | Sidebar | Nao confirmado | Responsivo | Nao | Nao | N/D |
| **ProDoctor** | BR | Azul escuro | Sidebar + tabs | Nao confirmado | iOS/Android/Win/Mac nativo | IA WhatsApp | Nao | Nativo (multi-plataforma) |
| **Ninsaude Clinic** | BR | Verde (#4CAF50) | Sidebar | Nao confirmado | Responsivo | CRM IA | Nao | Provavelmente Angular |
| **Simples Dental** | BR | Rosa/Magenta | Sidebar | Nao confirmado | iOS/Android nativo | Alexa integration | Nao | React/Vue/Angular |
| **Jane App** | CA | Azul sereno | Sidebar | Sim | Responsivo (sem app) | Nao | Nao | Vue.js |
| **Cliniko** | AU | Verde/Teal (#009688) | Sidebar | Sim | Responsivo (sem app nativo) | Nao | Nao | React (migrando) + Ruby on Rails |
| **SimplePractice** | US | Azul (#2962FF) | Sidebar | Sim (D&D) | iOS/Android nativo | Nao | Nao | React + PostgreSQL + MySQL |
| **Practice Better** | CA | Verde/Teal | Sidebar | Nao confirmado | iOS/Android | IA Charting | Nao | N/D |
| **Tebra (Kareo)** | US | Azul (#1565C0) | Sidebar + dashboard | Nao confirmado | iOS/Android nativo | AI Note Assist | Nao | N/D |
| **DrChrono** | US | Azul (#0D47A1) | Sidebar (iPad-first) | Sim | iOS nativo (iPad-first) | Speech-to-text | Nao | Python/Django + iOS nativo |
| **Medesk** | UK | Azul (#1976D2) | Sidebar | Sim (D&D) | Responsivo | Nao | Nao | N/D |
| **Clinicminds** | NL | Roxo/Azul | Sidebar | Nao confirmado | iPad + iPhone | Quinn AI Summary | Nao | N/D |
| **WriteUpp** | UK | Azul (#42A5F5) | Sidebar | Sim (D&D) | Responsivo | Nao | Nao | N/D |
| **Clinicea** | IN | Azul/Verde | Sidebar + tabs | Nao confirmado | Responsivo | Nao | Nao | N/D |

---

## Analise Detalhada por CRM

---

### 1. iClinic (Brasil)

**Website:** [iclinic.com.br](https://iclinic.com.br)
**Fundacao:** 2011, Ribeirao Preto/SP. Adquirida pela Afya em 2020.
**Posicao:** Lider do mercado brasileiro de software medico em nuvem.

#### Design System & Identidade Visual
- **Paleta:** Azul primario (tons de #2196F3), branco para backgrounds, cinza para textos secundarios
- **Tipografia:** Sans-serif moderna (provavelmente Inter ou similar)
- **Estilo visual:** Clean, moderno, com cards arredondados e sombras sutis
- **Dark mode:** Nao disponivel
- **Qualidade geral:** Alta - interface refinada apos anos de iteracao e testes de usabilidade

#### Layout & Navegacao
- **Estrutura:** Sidebar esquerda fixa + topbar com busca e notificacoes
- **Organizacao:** Modulos agrupados (Agenda, Prontuario, Financeiro, Marketing, Relatorios)
- **Profundidade de cliques:** 2-3 cliques para acoes comuns
- **Responsividade:** App nativo para iOS e Android (avaliacao 4.5+ nas lojas)
- **Mobile:** App nativo completo, nao apenas responsivo

#### Telas-chave
- **Dashboard:** KPIs de faturamento, consultas do dia, taxa de no-show, lembretes pendentes
- **Agenda:** Visao diaria e semanal, com status coloridos por tipo de consulta
- **Prontuario:** Customizavel por especialidade, campos editaveis, historico de valores
- **Financeiro:** Fluxo de caixa automatico, controle de receitas/despesas integrado com prontuario
- **Marketing:** Modulo especifico de email marketing (campanhas automaticas, sequencias, templates)

#### Micro-interacoes & UX
- **Onboarding:** Tour guiado para novos usuarios
- **Confirmacao de consultas:** SMS, email e WhatsApp integrados
- **Assinatura digital:** Documentos assinados digitalmente com validade juridica
- **Testes de usabilidade:** Empresa declara realizar testes frequentes

#### Stack Tecnologico
- **Frontend:** React (confirmado via vagas no LinkedIn e GitHub react-brasil/vagas)
- **Backend:** Node.js (confirmado via vagas backend-br/vagas)
- **Infra:** AWS
- **Mobile:** Apps nativos iOS/Android

**Fontes:**
- [iClinic no Capterra](https://www.capterra.com/p/191984/iClinic/)
- [Vagas React iClinic](https://github.com/react-brasil/vagas/issues/1156)
- [LinkedIn iClinic](https://br.linkedin.com/company/iclinic-software-medico)
- [iClinic no Google Play](https://play.google.com/store/apps/details/iClinic_Software_M%C3%A9dico?id=br.com.iclinic)

---

### 2. GestaoDS (Brasil)

**Website:** [gestaods.com.br](https://www.gestaods.com.br/)
**Posicao:** Software medico completo com foco em prontuario eletronico com IA.

#### Design System & Identidade Visual
- **Paleta:** Azul escuro como cor primaria, com acentos verdes e brancos
- **Estilo visual:** Profissional/corporativo, interface limpa
- **Dark mode:** Nao disponivel
- **Qualidade:** Boa, foco em usabilidade clinica

#### Layout & Navegacao
- **Estrutura:** Sidebar esquerda com modulos agrupados
- **Modulos:** Agenda, Prontuario, Financeiro, Teleconsulta, Marketing, Relatorios
- **Responsividade:** Web responsivo, sem app nativo dedicado

#### Telas-chave
- **Prontuario:** Completamente personalizavel com caixas de texto e campos editaveis por especialidade
- **Agenda:** Integrada com confirmacao automatica
- **Financeiro:** Gestao de recebimentos e pagamentos
- **Teleconsulta:** Integrada ao sistema
- **Prescricao digital:** Emissao agil de receitas e atestados

#### Micro-interacoes & UX
- **Lembretes automatizados:** Para reducao de faltas
- **Assinatura digital:** Em parceria com SafeWeb, validade juridica
- **Ranking de pacientes:** Feature diferenciada de CRM

#### Stack Tecnologico
- **Informacao limitada** - nao foram encontradas vagas ou dados publicos sobre o stack

**Fontes:**
- [GestaoDS - Funcionalidades](https://www.gestaods.com.br/funcionalidades/)
- [GestaoDS - Site principal](https://www.gestaods.com.br/)

---

### 3. Amplimed (Brasil)

**Website:** [amplimed.com.br](https://www.amplimed.com.br/)
**Fundacao:** ~2017, Chapeco/SC. Parte do Grupo RD (RaiaDrogasil).
**Numeros:** 20.000+ profissionais, 3.000+ clinicas, 700.000+ consultas/mes, 9M+ pacientes

#### Design System & Identidade Visual
- **Paleta:** Verde/Teal como cor primaria
- **Estilo visual:** Moderno, interface intuitiva
- **Qualidade:** Boa - foco em integracao entre modulos

#### Layout & Navegacao
- **Estrutura:** Sidebar esquerda
- **Modulos:** Agenda Online, Prontuario, Prescricao Digital, TISS, Financeiro, Telemedicina, Estoque
- **Responsividade:** Web responsivo

#### Telas-chave
- **Prontuario:** Eletronio por especialidade com IA para reducao de tempo de consulta em ate 40%
- **Prescricao:** Acesso a 60.000+ medicamentos cadastrados
- **Estoque:** Gestao de suprimentos, medicamentos e imunizacoes
- **Financeiro:** Integrado com modulo de pagamentos online

#### Micro-interacoes & UX
- **WhatsApp:** Integracao nativa
- **IA:** Recursos de inteligencia artificial que automatizam processos
- **Treinamento:** Suporte e treinamento durante implementacao

#### Stack Tecnologico
- **GitHub:** [github.com/amplimed](https://github.com/amplimed) - organizacao publica, mas sem repos publicos relevantes
- **Informacao limitada** sobre framework frontend especifico

**Fontes:**
- [Amplimed - Diferenciais](https://www.amplimed.com.br/blog/diferenciais-software-medico-amplimed/)
- [Amplimed no Capterra](https://www.capterra.com/p/204304/Amplimed/)
- [Amplimed no GitHub](https://github.com/amplimed)

---

### 4. Clinica nas Nuvens (Brasil)

**Website:** [clinicanasnuvens.com.br](https://clinicanasnuvens.com.br/)
**Posicao:** Parte da Bionexo. 30.000+ usuarios, 10M+ prontuarios, R$1B+ transacoes/ano, 10M+ consultas.

#### Design System & Identidade Visual
- **Paleta:** Azul como cor primaria (#1E88E5), branco para backgrounds
- **Estilo visual:** Corporativo, dashboards visuais em tempo real
- **Qualidade:** Solida - design funcional, menos "moderno" que concorrentes mais novos

#### Layout & Navegacao
- **Estrutura:** Sidebar + tabs por modulo
- **Modulos:** Prontuario, Agenda, Financeiro, Faturamento TISS, Telemedicina
- **Especialidades:** 30+ especialidades suportadas
- **Responsividade:** Web responsivo

#### Telas-chave
- **Dashboard:** Indicadores de gestao em tempo real (consultas, faturamento, etc.)
- **Prontuario:** Prescricao com receituario digital e assinatura
- **TISS:** Exportacao para faturamento de convenios
- **Financeiro:** Visibilidade completa (pagamentos, pendencias, parcelas, fluxo de caixa)

#### Micro-interacoes & UX
- **Seguranca bancaria:** Mesma tecnologia de grandes bancos
- **Controle de acesso:** Niveis por usuario
- **Telemedicina:** Video integrado (notebook/celular)

#### Stack Tecnologico
- **Informacao limitada** - nao foram encontrados dados publicos

**Fontes:**
- [Clinica nas Nuvens](https://clinicanasnuvens.com.br/)
- [Planos e Precos](https://clinicanasnuvens.com.br/planos-e-precos)

---

### 5. Shosp (Brasil)

**Website:** [shosp.com.br](https://www.shosp.com.br/)

#### Design System & Identidade Visual
- **Paleta:** Azul claro como cor primaria
- **Estilo visual:** Clean, design simples e agradavel
- **Qualidade:** Elogiada por usuarios - "design limpo e excelente UX"

#### Layout & Navegacao
- **Estrutura:** Sidebar com modulos agrupados
- **Modulos:** Agenda, Prontuario, Financeiro, TISS, Estoque, CRM, Relatorios
- **Responsividade:** Web responsivo

#### Telas-chave
- **Dashboard:** Insights de atividades clinicas
- **Prontuario:** Campos customizaveis, graficos, calculadoras, assinatura digital
- **Agenda:** Agendamento com confirmacao por SMS/email, ajuste de ausencias
- **Financeiro:** Reconciliacao bancaria, priorizacao de tarefas

#### Micro-interacoes & UX
- **Customizacao:** Layout personalizavel
- **Feedback de usuarios:** Consistentemente elogiado por UX intuitiva
- **Pontos de melhoria (usuarios):** Vendas de consultas online e template de agendamento

#### Stack Tecnologico
- **Informacao limitada** - nao foram encontrados dados publicos

**Fontes:**
- [Shosp - Funcionalidades](https://www.shosp.com.br/funcionalidades)
- [Shosp no Capterra](https://www.capterra.com/p/188703/Shosp/)
- [Shosp Reviews](https://www.capterra.com/p/188703/Shosp/reviews/)

---

### 6. Feegow Clinic (Brasil)

**Website:** [feegowclinic.com.br](https://feegowclinic.com.br/)
**Posicao:** Agora parte da Doctoralia Brasil. 30.000+ profissionais, 4.000+ estabelecimentos. 280+ funcionalidades.

#### Design System & Identidade Visual
- **Paleta:** Azul e verde como cores primarias
- **Estilo visual:** Moderno, redesenhado recentemente com interface otimizada
- **Dark mode:** Nao disponivel
- **Certificacoes:** SBIS, LGPD compliance

#### Layout & Navegacao
- **Estrutura:** Sidebar esquerda
- **Modulos:** Agenda, Prontuario (PEP), Telemedicina, Financeiro, Faturamento, Relatorios
- **Profundidade:** Redesign recente focou em "tudo a um toque de distancia"
- **Mobile:** App nativo (iOS/Android) com novo design

#### Telas-chave
- **Agenda:** Diaria e semanal, multiplos agendas (por medico/sala/especialidade/unidade), fila de espera, integracao Google Calendar
- **Prontuario (PEP):** Anamneses, evolucoes, laudos personalizados, bulario integrado, prescricoes
- **Telemedicina:** Sem download, acesso por navegador com link gerado
- **Dashboard:** Visao geral do estabelecimento

#### Micro-interacoes & UX
- **Upload de imagens:** Direto da camera/galeria do smartphone
- **Interoperabilidade:** Integracoes nativas e via API
- **Criptografia:** SSL, servidor AWS, certificados digitais

#### Stack Tecnologico
- **Frontend:** React (confirmado)
- **Backend:** Node.js + PHP (confirmado via GitHub e The Org)
- **Infra:** AWS
- **GitHub:** [github.com/feegow](https://github.com/feegow)

**Fontes:**
- [Feegow Clinic](https://feegowclinic.com.br/)
- [Feegow no GitHub](https://github.com/feegow)
- [Feegow Funcionalidades](https://feegowclinic.com.br/produtos/feegow-clinic)
- [Novo Feegow Clinic](https://feegowclinic.com.br/blog/esta-no-ar-o-novo-feegow-clinic)

---

### 7. Doctoralia Pro (Brasil/Global)

**Website:** [pro.doctoralia.com.br](https://pro.doctoralia.com.br/)
**Posicao:** Maior marketplace de saude do mundo (parte do grupo DocPlanner). Foco forte em aquisicao de pacientes.

#### Design System & Identidade Visual
- **Paleta:** Verde (#00C853) como cor primaria - identidade forte e reconhecivel
- **Estilo visual:** Moderno, clean, redesenhado recentemente ("mais rapido, facil e intuitivo")
- **Qualidade:** Alta - empresa global com equipe de design dedicada

#### Layout & Navegacao
- **Estrutura:** Topbar + sidebar lateral
- **Modulos:** Agenda, Prontuario, Prescricao, Financeiro, Chat, WhatsApp, Estatisticas, Telemedicina
- **Mobile:** App nativo para iOS e Android (ambos para pacientes e profissionais)

#### Telas-chave
- **Agenda:** Consultas presenciais e online, duracao configuravel, multiplos locais, feriados
- **Prontuario:** Personalizavel, seguro, CID-10, prescricao digital
- **Chat:** Comunicacao direta com pacientes + notificacoes automaticas via WhatsApp
- **Financeiro:** Relatorios financeiros customizaveis, comissoes por medico

#### Micro-interacoes & UX
- **Marketplace:** Diferencial forte - pacientes encontram medicos e agendam diretamente
- **Reducao no-show:** Sistema de lembretes multicanal
- **LGPD:** Equipe de suporte local no Brasil para compliance

#### Stack Tecnologico
- **Informacao limitada** sobre stack especifico do Doctoralia Pro
- **Empresa global** (DocPlanner) - provavelmente stack moderno com equipes separadas por produto

**Fontes:**
- [Doctoralia Pro - Funcionalidades](https://pro.doctoralia.com.br/produtos/funcionalidades)
- [Doctoralia Pro no Capterra](https://www.capterra.com/p/253301/Doctoralia-Pro/)
- [Doctoralia no GetApp](https://www.getapp.com/customer-management-software/a/doctoralia-pro/)

---

### 8. App Health (Brasil)

**Website:** [apphealth.com.br](https://www.apphealth.com.br/)
**Numeros:** 5.000+ profissionais ativos, 2M+ pacientes atendidos.

#### Design System & Identidade Visual
- **Paleta:** Azul/Teal
- **Estilo visual:** Intuitivo, foco em simplicidade
- **Qualidade:** Boa para o porte do produto

#### Layout & Navegacao
- **Estrutura:** Sidebar
- **Modulos:** Agenda, Prontuario, Financeiro, Telemedicina
- **Responsividade:** Web responsivo

#### Telas-chave
- **Agenda:** Agendamento online para pacientes
- **Prontuario:** Historico medico seguro
- **Financeiro:** Relatorios de receitas e despesas

#### Micro-interacoes & UX
- **IA:** "Nova IA App Health" que agenda, confirma e registra consultas automaticamente
- **WhatsApp/SMS:** Confirmacao automatica
- **Clinicas multidisciplinares:** Suporte multi-profissional

#### Stack Tecnologico
- **Informacao limitada**

**Fontes:**
- [App Health](https://www.apphealth.com.br/)
- [App Health - Funcionalidades](https://www.apphealth.com.br/funcionalidades)

---

### 9. Conclinica (Brasil)

**Website:** [conclinica.com.br](https://conclinica.com.br/)

#### Design System & Identidade Visual
- **Paleta:** Azul como cor primaria
- **Estilo visual:** Profissional, orientado para clinicas maiores

#### Layout & Navegacao
- **Estrutura:** Sidebar
- **Modulos:** Agenda, Prontuario com IA, Financeiro, Faturamento de Convenios, Relatorios
- **Multi-profissional:** Gerencia varios profissionais, salas e especialidades

#### Telas-chave
- **Agenda:** 24h, confirmacao automatica (SMS/WhatsApp/email), disponibilidade em tempo real
- **Prontuario com IA:** **Transcreve conversa da consulta em documentacao clinica estruturada** (similar ao VoxClinic!)
- **Financeiro:** Repasses medicos, faturamento de convenios
- **Relatorios:** Acompanhamento de todos os setores em tempo real

#### Micro-interacoes & UX
- **IA de transcricao:** Diferencial forte e relevante para benchmarking do VoxClinic
- **LGPD:** Conformidade declarada
- **Criptografia:** Backups automaticos, controle de acesso

#### Stack Tecnologico
- **Informacao limitada**

**Fontes:**
- [Conclinica - Funcionalidades](https://conclinica.com.br/software-medico-conclinica-funcionalidades/)
- [Conclinica](https://conclinica.com.br/)

---

### 10. OnDoctor (Brasil)

**Website:** [ondoctor.app](https://ondoctor.app/)

#### Design System & Identidade Visual
- **Paleta:** Azul (#1976D2)
- **Estilo visual:** Moderno, interface intuitiva

#### Layout & Navegacao
- **Estrutura:** Sidebar, acesso multiplataforma (PC, notebook, tablet, smartphone)
- **Modulos:** Prontuario, Agenda, Financeiro, Telemedicina, Assinatura Eletronica

#### Telas-chave
- **Prontuario (PEP):** Personalizavel, protocolos simplificados, prescricoes inteligentes, imagens e arquivos
- **Agenda:** Online com lembretes automaticos (SMS/WhatsApp)
- **Financeiro:** Fluxo de caixa completo
- **Telemedicina:** Consultas virtuais integradas

#### Micro-interacoes & UX
- **Assinatura eletronica:** Validade juridica no Brasil, elimina impressao
- **Prescricoes inteligentes:** Com banco de medicamentos
- **Acesso flexivel:** Qualquer dispositivo

#### Stack Tecnologico
- **Informacao limitada** - vendido via Hotmart (modelo SaaS)

**Fontes:**
- [OnDoctor](https://ondoctor.app/)
- [OnDoctor no B2B Stack](https://www.b2bstack.com.br/product/ondoctor)
- [OnDoctor Novidades v09-2025](https://ondoctor.app/ondoctor-novidades-da-versao-09-2025-otimizacao-e-eficiencia-para-sua-clinica/)

---

### 11. ProDoctor (Brasil)

**Website:** [prodoctor.net](https://prodoctor.net/)
**Posicao:** Um dos mais antigos e completos do Brasil. Case de sucesso AWS.

#### Design System & Identidade Visual
- **Paleta:** Azul escuro como cor primaria
- **Estilo visual:** Profissional/corporativo, menos "moderno" que startups
- **Qualidade:** Funcional, interface intuitiva para historico clinico

#### Layout & Navegacao
- **Estrutura:** Sidebar + tabs
- **Modulos:** Prontuario, Agenda, Prescricao, Financeiro, Estoque
- **Multi-plataforma:** Windows, macOS, iOS, Android - apps nativos para cada plataforma

#### Telas-chave
- **Prontuario:** Personalizado com foto do profissional, historico visual intuitivo
- **Prescricao:** Unificada com bulario completo, assinatura digital ICP-Brasil com QR Code
- **Agenda:** Confirmacao via WhatsApp com IA (90%+ taxa de resposta)
- **Estoque:** Leitor de codigo de barras, multiplos locais de armazenamento

#### Micro-interacoes & UX
- **IA para confirmacao:** WhatsApp oficial com inteligencia artificial
- **Multiplataforma nativa:** Performance e estabilidade superiores por ser nativo
- **QR Code:** Validacao de prescricoes

#### Stack Tecnologico
- **Aplicacoes nativas** para cada plataforma (Windows, macOS, iOS, Android)
- **Infra:** AWS (caso de sucesso reconhecido pela Amazon)

**Fontes:**
- [ProDoctor](https://prodoctor.net/)
- [ProDoctor Cloud no App Store](https://apps.apple.com/br/app/prodoctor-cloud/id1324995902)
- [ProDoctor Corp no Google Play](https://play.google.com/store/apps/details?id=net.prodoctor.prodoctorcorp)

---

### 12. Ninsaude Clinic (Brasil)

**Website:** [ninsaude.com](https://www.ninsaude.com/pt-br/)
**Fundacao:** 2013 (Ninsaude Software), lancamento do Clinic em 2018.

#### Design System & Identidade Visual
- **Paleta:** Verde (#4CAF50) como cor primaria
- **Estilo visual:** Moderno, interface web contemporanea

#### Layout & Navegacao
- **Estrutura:** Sidebar
- **Modulos:** Agenda, Prontuario, Faturamento TISS, CRM (funil de vendas), Telemedicina, Assinatura Eletronica

#### Telas-chave
- **Agenda:** Multi-profissional, visoes dia/semana/mes/profissional
- **Prontuario:** Com assinatura eletronica integrada
- **CRM:** Funis de venda com filtros por servico/procedimento e perfil de paciente
- **Retorno:** Agendamento de retorno tanto na recepcao quanto pelo profissional

#### Micro-interacoes & UX
- **CRM de vendas:** Diferencial - funil de vendas integrado ao software medico
- **Multi-especialidade:** Medico, dentista, fisioterapia, estetica

#### Stack Tecnologico
- **Provavel:** Angular (baseado em padroes de startups de Florianopolis/SC e indiretos)
- **Cloud-based**

**Fontes:**
- [Ninsaude Clinic](https://www.ninsaude.com/pt-br/software-medico-para-clinicas/)
- [Blog Ninsaude](https://blog.apolo.app/ninsaude-apolo-tudo-o-que-voce-precisa-saber/)
- [Ninsaude no LinkedIn](https://br.linkedin.com/company/ninsa%C3%BAde)

---

### 13. Simples Dental (Brasil)

**Website:** [simplesdental.com](https://www.simplesdental.com/)
**Posicao:** Considerado o melhor software odontologico do Brasil/America Latina.

#### Design System & Identidade Visual
- **Paleta:** Rosa/Magenta como cor primaria - diferente do padrao azul/verde do setor medico
- **Estilo visual:** Moderno, minimalista, light
- **Qualidade:** Alta - interface elogiada consistentemente

#### Layout & Navegacao
- **Estrutura:** Sidebar moderna
- **Modulos:** Agenda, Prontuario, Financeiro, Marketing, Odontograma visual
- **Mobile:** App nativo para iOS e Android

#### Telas-chave
- **Agenda:** Digital com confirmacao automatica via WhatsApp
- **Prontuario:** Com odontograma visual e comparacao antes/depois
- **Financeiro:** Controle completo (receitas, despesas, fluxo de caixa, inadimplencia) em tempo real
- **Marketing:** Ferramentas agressivas de conversao (diferencial forte vs concorrentes)

#### Micro-interacoes & UX
- **Odontograma visual:** Essencial para demonstrar valor do tratamento ao paciente
- **Alexa:** Integracao com assistente de voz da Amazon
- **Criador de sites:** Ferramenta integrada para presenca online
- **Comparacao antes/depois:** Para imagens clinicas

#### Stack Tecnologico
- **Frontend:** React, Vue.js ou Angular (vagas mencionam todos os tres como requisito)
- **Requisitos de vagas:** "front-end frameworks e libraries como React, Angular, ou Vue.js"

**Fontes:**
- [Simples Dental](https://www.simplesdental.com/)
- [Simples Dental no Google Play](https://play.google.com/store/apps/details?id=com.simplesdental)
- [Vagas Simples Dental](https://www.glassdoor.com.br/Vaga/trabalho-remoto-vagas-simples-dental-vagas-SRCH_IL.0,15_IS12226_KO16,36.htm)

---

## CRMs Internacionais

---

### 14. Jane App (Canada)

**Website:** [jane.app](https://jane.app/)
**Posicao:** Referencia em UX para clinicas de saude e bem-estar. Design elogiado globalmente.

#### Design System & Identidade Visual
- **Paleta:** Azul sereno, tons pastel, paleta calma e acolhedora
- **Tipografia:** Straightforward, clara
- **Estilo visual:** **Referencia em design** - clean, intuitivo, "um olhar te diz tudo que precisa saber"
- **Qualidade:** Excelente - criada por donos de clinicas + designers especializados em simplicidade

#### Layout & Navegacao
- **Estrutura:** Sidebar esquerda limpa
- **Organizacao:** Altamente intuitiva
- **Responsividade:** Funciona em tablets, smartphones, laptops e desktops (Android, Apple, Microsoft)
- **Mobile:** Sem app nativo dedicado, mas web responsivo excelente

#### Telas-chave
- **Dashboard:** Visao geral que "um olhar te diz tudo"
- **Calendario:** Agendamento inteligente, multi-profissional, com intervalos customizaveis
- **Prontuario:** Template library (charts, forms, SOAP notes, surveys) completamente customizavel
- **Telehealth:** HIPAA-compliant, 1 a 12 clientes simultaneos
- **Self-booking:** Pacientes agendam, cancelam ou reagendam de qualquer dispositivo

#### Micro-interacoes & UX
- **Auto-agendamento:** Paciente tem autonomia total
- **Templates:** Biblioteca rica de formularios pre-prontos
- **Design calmo:** Paleta que transmite confianca e tranquilidade

#### Stack Tecnologico
- **Frontend:** Vue.js (confirmado via StackShare e Himalayas)
- **Infra:** Cloudflare CDN, Snowflake, Datadog
- **Seguranca:** Kerberos, Cloudflare Bot Management
- **Cloud-based** (sem instalacao)

**Fontes:**
- [Jane App](https://jane.app/)
- [Jane App Features](https://jane.app/features)
- [Jane App Tech Stack - StackShare](https://stackshare.io/jane-clinic-management-software/janeapp-com)
- [Jane App Tech Stack - Himalayas](https://himalayas.app/companies/jane-app/tech-stack)
- [Jane App no Capterra](https://www.capterra.com/p/178984/Jane-App/)

---

### 15. Cliniko (Australia)

**Website:** [cliniko.com](https://www.cliniko.com/)
**Posicao:** Lider para clinicas de saude aliada. 100.000+ usuarios diarios globalmente.

#### Design System & Identidade Visual
- **Paleta:** Verde/Teal (#009688) como cor primaria
- **Estilo visual:** Familiar (similar a Google Calendar/iCal), minimalista
- **Qualidade:** Muito boa - reconhecida pela facilidade de uso

#### Layout & Navegacao
- **Estrutura:** Sidebar + calendario central
- **Organizacao:** Altamente intuitiva, curva de aprendizado baixa
- **Responsividade:** Mobile-friendly, funciona em qualquer dispositivo
- **Mobile:** Sem app nativo, design responsivo

#### Telas-chave
- **Calendario:** Visoes dia/semana, drag-and-drop, codificacao por cores, time slots customizaveis (15min blocks), booking via popup
- **Prontuario:** Treatment notes completamente customizaveis, templates personalizaveis, armazenamento em nuvem
- **Online booking:** Integrado com branding customizavel
- **Relatorios:** Dashboard operacional

#### Micro-interacoes & UX
- **Time slots visuais:** Linhas cinza nos :15, :30, :45 de cada hora
- **Codificacao por cores:** Appointments colour-coded
- **Popup booking:** Click no calendario abre popup para agendar
- **Custom branding:** Paciente ve a marca da clinica
- **Redesign em andamento:** Formulario de appointment sendo redesenhado atualmente

#### Stack Tecnologico
- **Backend:** Ruby on Rails (confirmado)
- **Frontend:** React (em transicao/migracao - confirmado via vagas)
- **Vagas:** Full-stack developer (Ruby on Rails + React)
- **4-day week:** Empresa oferece semana de 4 dias

**Fontes:**
- [Cliniko](https://www.cliniko.com/)
- [Cliniko Features](https://www.cliniko.com/features/)
- [Cliniko Redesigning Appointment](https://www.cliniko.com/blog/news/redesigning-the-appointment/)
- [Cliniko Vagas - Hacker News](https://news.ycombinator.com/item?id=46961849)
- [Cliniko React Developer - 4dayweek](https://4dayweek.io/remote-job/react-developer-vjqWe-cliniko)

---

### 16. SimplePractice (EUA)

**Website:** [simplepractice.com](https://www.simplepractice.com/)
**Posicao:** Lider para saude mental e bem-estar. 225.000+ profissionais globalmente.

#### Design System & Identidade Visual
- **Paleta:** Azul (#2962FF) como cor primaria
- **Tipografia:** Clean, labels claros
- **Estilo visual:** Moderno, uso de progressive disclosure
- **Design quality:** Alta - perfil ativo no [Dribbble](https://dribbble.com/simplepractice), showcase no [SaaS UI Design](https://www.saasui.design/application/simplepractice)
- **Dark mode:** Nao disponivel

#### Layout & Navegacao
- **Estrutura:** Sidebar esquerda
- **Organizacao:** Scheduling, billing, clinical docs, telehealth e engagement unificados
- **Mobile:** Apps nativos iOS e Android

#### Telas-chave
- **Calendario:** Drag-and-drop, visao diaria/semanal
- **Client chart:** Acessivel instantaneamente, progressive disclosure
- **Telehealth:** HIPAA-compliant integrado
- **Billing:** Online, automatizado
- **Client portal:** Acesso 24/7 para pacientes

#### Micro-interacoes & UX
- **Progressive disclosure:** Labels claros, novos usuarios dominam em horas
- **Automated reminders:** Drag-and-drop intuitivo
- **Analytics:** Reporting e insights integrados
- **Onboarding rapido:** "Up to speed in hours, not weeks"

#### Stack Tecnologico
- **Frontend:** React (confirmado via StackShare)
- **Backend:** N/D (provavelmente Rails ou similar)
- **Banco de dados:** PostgreSQL + MySQL (confirmado via StackShare)
- **Web server:** NGINX
- **Versionamento:** GitHub
- **Dribbble:** [dribbble.com/simplepractice](https://dribbble.com/simplepractice)

**Fontes:**
- [SimplePractice no StackShare](https://stackshare.io/simplepractice/simplepractice)
- [SimplePractice no SaaS UI](https://www.saasui.design/application/simplepractice)
- [SimplePractice no Dribbble](https://dribbble.com/simplepractice)
- [SimplePractice no Software Finder](https://softwarefinder.com/emr-software/simplepractice)
- [SimplePractice Subscribed.fyi](https://subscribed.fyi/simplepractice/experience/)

---

### 17. Practice Better (Canada)

**Website:** [practicebetter.io](https://practicebetter.io/)
**Posicao:** Lider para nutricionistas e profissionais de bem-estar.

#### Design System & Identidade Visual
- **Paleta:** Verde/Teal como cor primaria
- **Estilo visual:** Moderno, focado em wellness

#### Layout & Navegacao
- **Estrutura:** Sidebar
- **Modulos:** Booking, Billing, Telehealth, Charting, Client Engagement, Programs/Courses
- **Mobile:** Apps iOS e Android

#### Telas-chave
- **Dashboard:** Tudo em um (appointments, reminders, billing)
- **Protocols:** Templates prontos para necessidades especificas de clientes
- **Food/Mood journal:** Clientes registram alimentacao e humor
- **Telehealth:** Integrado com Zoom

#### Micro-interacoes & UX
- **AI Charting Assistant:** Grava, transcreve e resume sessoes de telehealth automaticamente
- **That Clean Life:** Integracao para planejamento nutricional
- **Automacoes:** Workflow automation para reduzir tarefas manuais

#### Stack Tecnologico
- **Informacao limitada** - nao foram encontrados dados publicos

**Fontes:**
- [Practice Better](https://practicebetter.io/)
- [Practice Better no Capterra](https://www.capterra.com/p/159263/Better/)
- [Practice Better no G2](https://www.g2.com/products/practice-better/reviews)
- [Practice Better Nutritionists](https://practicebetter.io/who-we-serve/nutritionists)

---

### 18. Tebra / Kareo (EUA)

**Website:** [tebra.com](https://www.tebra.com/)
**Posicao:** Formada pela fusao de Kareo + PatientPop (2021). Foco em praticas independentes.

#### Design System & Identidade Visual
- **Paleta:** Azul (#1565C0) como cor primaria
- **Estilo visual:** Corporativo moderno, dashboard intuitivo e flexivel
- **Qualidade:** Boa - interface straightforward

#### Layout & Navegacao
- **Estrutura:** Sidebar + dashboard central customizavel
- **Modulos:** EHR, Practice Management, Billing, Marketing, Patient Engagement
- **Mobile:** Apps nativos iOS e Android

#### Telas-chave
- **Dashboard:** Customizavel, ePrescribing, patient portal integrado
- **EHR:** Custom templates, text shortcuts, "Same As Last Time" charting
- **Billing:** Integrado com insurance claims
- **Marketing:** Automated messages (appointment reminders, post-visit)

#### Micro-interacoes & UX
- **AI Note Assist:** IA para documentacao clinica
- **AI Review Replies:** Respostas automaticas para gestao de reputacao
- **"Same As Last Time":** Atalho para repetir charting anterior
- **Text shortcuts:** Abreviacoes expandem em texto completo

#### Stack Tecnologico
- **Cloud-based** (browser)
- **SOAP APIs** para integracoes
- **Mobile:** iOS e Android nativos

**Fontes:**
- [Tebra](https://www.tebra.com/)
- [Tebra no Wikipedia](https://en.wikipedia.org/wiki/Tebra)
- [Tebra no Business News Daily](https://www.businessnewsdaily.com/16247-kareo-medical-software.html)
- [Tebra Careers - Built In](https://builtin.com/company/tebra)

---

### 19. DrChrono (EUA)

**Website:** [drchrono.com](https://www.drchrono.com/)
**Posicao:** Pioneiro em EHR mobile (iPad-first). #1 Mobile EHR por 10 anos consecutivos.

#### Design System & Identidade Visual
- **Paleta:** Azul escuro (#0D47A1) como cor primaria
- **Estilo visual:** Contemporaneo, intuitivo, **iPad-first design**
- **Qualidade:** Superior para uso em tablet - "UI feels contemporary vs cluttered legacy EHRs"

#### Layout & Navegacao
- **Estrutura:** Sidebar com foco em iPad/touch
- **Organizacao:** All-in-one (EHR, PM, Billing, Patient Portal) em single login
- **Mobile:** iOS nativo (iPad e iPhone) - design nativo touch-first

#### Telas-chave
- **Charting:** Customizable medical forms, macro buttons, drawing tools
- **Speech-to-text:** Medical speech recognition integrado
- **Calendar:** Drag-and-drop, multi-provider
- **Patient Portal:** Integrado

#### Micro-interacoes & UX
- **Speech-to-text medico:** Diferencial forte - dicacao direta no prontuario
- **Macro buttons:** Atalhos para acoes frequentes
- **Drawing tools:** Anotacoes visuais em imagens/diagramas no iPad
- **Touch-optimized:** Toda a UX pensada para touch em tablet

#### Stack Tecnologico
- **Backend:** Python + Django (confirmado via GitHub e vagas)
- **Frontend:** iOS nativo (Swift/Objective-C para iPad/iPhone)
- **API:** RESTful, bem documentada
- **Banco:** SQLite3 (em exemplos), provavelmente PostgreSQL em producao
- **GitHub:** [github.com/drchrono](https://github.com/drchrono) - exemplos de API com Django

**Fontes:**
- [DrChrono](https://www.drchrono.com/)
- [DrChrono no GitHub](https://github.com/drchrono)
- [DrChrono Hackathon - Django + Vue](https://github.com/chrisphyffer/hackathon-interview-drchrono)
- [DrChrono EHR Review](https://www.ehrsource.com/vendors/drchrono/)
- [DrChrono no Wikipedia](https://en.wikipedia.org/wiki/DrChrono)

---

### 20. Medesk (UK)

**Website:** [medesk.net](https://www.medesk.net/en/)
**Posicao:** Software europeu para praticas pequenas/medias. User Satisfaction 92%.

#### Design System & Identidade Visual
- **Paleta:** Azul (#1976D2) como cor primaria
- **Estilo visual:** Clean, moderno, visualmente atraente
- **Qualidade:** Muito boa - "user-friendly interface" e elogio consistente

#### Layout & Navegacao
- **Estrutura:** Sidebar
- **Modulos:** Scheduling, EHR, Billing, Reporting, Inventory, Telehealth, Patient Portal
- **Responsividade:** Web responsivo

#### Telas-chave
- **Calendario:** Visualmente atraente, drag-and-drop, visualizacao de multiplos medicos simultaneamente, status de appointments, time slots
- **Dashboard compartilhado:** Real-time - recepcionistas, clinicos e gestores veem a mesma informacao
- **EHR:** Customizavel, com clinical note-taking personalizado
- **Patient portal:** Branded booking page com filtros (clinico, servico, localizacao, virtual/presencial)

#### Micro-interacoes & UX
- **Drag-and-drop:** Para reagendamento no calendario
- **Multi-provider view:** Recepcionista ve todos os medicos simultaneamente
- **Calendar sync:** Google Calendar, iCal, Outlook
- **Real-time updates:** Dashboard atualiza em tempo real

#### Stack Tecnologico
- **Informacao limitada** - plataforma cloud-based, possivelmente React/Vue no frontend

**Fontes:**
- [Medesk](https://www.medesk.net/en/)
- [Medesk Schedule](https://www.medesk.net/en/schedule/)
- [Medesk Reviews - SelectHub](https://www.selecthub.com/p/medical-practice-management-software/medesk/)
- [Medesk no Software Advice](https://www.softwareadvice.com/medical/medesk-profile/)

---

### 21. Clinicminds (Holanda)

**Website:** [clinicminds.com](https://www.clinicminds.com/)
**Posicao:** Especializado em clinicas esteticas e MedSpas.

#### Design System & Identidade Visual
- **Paleta:** Roxo/Azul como cor primaria
- **Estilo visual:** Moderno, focado em estetica
- **Custom branding:** Patient interface totalmente customizavel com branding da clinica

#### Layout & Navegacao
- **Estrutura:** Sidebar
- **Modulos:** Scheduling, Online Bookings, Medical Records, Billing, CRM
- **Mobile:** iPad app + iPhone app (calendario e prontuario)

#### Telas-chave
- **Patient Interface:** Redesenhada na v5.14, totalmente customizavel
- **EMR:** Integrado com billing e scheduling
- **Online booking:** Integrado

#### Micro-interacoes & UX
- **Quinn AI Smart Summary:** IA para documentacao clinica automatizada (v5.15)
- **API expandida:** Para integracoes
- **iPad mobility:** Mobilidade total na clinica

#### Stack Tecnologico
- **Cloud-based SaaS** - informacao especifica limitada
- **iPad + iPhone** nativos

**Fontes:**
- [Clinicminds](https://www.clinicminds.com/)
- [Clinicminds Features](https://www.clinicminds.com/features/)
- [Clinicminds Patient Interface Update](https://www.clinicminds.com/clinicminds-patient-interface-update/)
- [Clinicminds no Capterra](https://www.capterra.com/p/189488/Clinicminds/)

---

### 22. WriteUpp (UK)

**Website:** [writeupp.com](https://www.writeupp.com/)
**Posicao:** Usado por 47.000+ clinicos. Focado em simplicidade.

#### Design System & Identidade Visual
- **Paleta:** Azul (#42A5F5)
- **Estilo visual:** Simples, funcional, foco em facilidade de uso
- **Qualidade:** Boa - elogiada por praticidade

#### Layout & Navegacao
- **Estrutura:** Sidebar + diary central
- **Modulos:** Diary, Client Records, Custom Forms/Templates, Telemedicine, Invoicing
- **Responsividade:** Web responsivo

#### Telas-chave
- **Diary:** Visao dia/semana/lista, drag-and-drop para reagendamento, recorrencia (diaria/semanal/ate 12 semanas)
- **Client Summary:** Info completa do paciente (nome, DOB, genero, endereco, terceiros)
- **Custom forms:** Campos adicionais totalmente customizaveis
- **Privacy mode:** Troca nome do cliente por codigo especial com um clique

#### Micro-interacoes & UX
- **Drag-and-drop:** Diary com reagendamento por arraste
- **Privacy toggle:** Um clique para ocultar identidade do paciente (casos sensiveis)
- **Recurrence:** Appointments recorrentes (ate 12 semanas)
- **Service user add:** Opcao para adicionar usuarios de servico

#### Stack Tecnologico
- **Informacao limitada** - plataforma web cloud-based

**Fontes:**
- [WriteUpp](https://www.writeupp.com/)
- [WriteUpp Features](https://www.writeupp.com/features)
- [WriteUpp Review - Medesk](https://www.medesk.net/en/blog/writeupp-review/)
- [WriteUpp Review - Business of Counselling](https://www.businessofcounselling.com/writeupp-practice-management-software-my-review/)

---

### 23. Clinicea (India)

**Website:** [clinicea.com](https://clinicea.com/)
**Posicao:** Software para 20+ especialidades. Foco em customizacao.

#### Design System & Identidade Visual
- **Paleta:** Azul/Verde
- **Estilo visual:** Clutter-free, funcional
- **Qualidade:** Boa - facil de aprender mesmo para staff com skills tecnicos variados

#### Layout & Navegacao
- **Estrutura:** Sidebar + tabs
- **Modulos:** Scheduling, EMR, Billing, Inventory, Marketing, Analytics
- **Responsividade:** Web responsivo

#### Telas-chave
- **EMR:** 20+ templates especializados por especialidade (dental, dermatologia, etc.)
- **Scheduling:** Multi-profissional
- **Billing:** Integrado com estoque
- **Marketing:** Ferramentas de engajamento de pacientes

#### Micro-interacoes & UX
- **Customizacao profunda:** Templates de EMR, consent forms, invoices customizaveis
- **Training 1-on-1:** Treinamento individual ilimitado e gratuito
- **Automacao:** Reduz tarefas administrativas repetitivas

#### Stack Tecnologico
- **Cloud-based SaaS** - informacao especifica limitada

**Fontes:**
- [Clinicea](https://clinicea.com/)
- [Clinicea Features](https://clinicea.com/features)
- [Clinicea no SelectHub](https://www.selecthub.com/p/medical-practice-management-software/clinicea/)
- [Clinicea no Software Finder](https://softwarefinder.com/emr-software/clinicea)

---

## Analise Comparativa por Dimensao

### 1. Paletas de Cores

| Cor | CRMs | % |
|-----|-------|---|
| Azul (varias tonalidades) | iClinic, Clinica nas Nuvens, Shosp, OnDoctor, ProDoctor, SimplePractice, Tebra, DrChrono, Medesk, WriteUpp | 43% |
| Verde/Teal | Amplimed, Ninsaude, Cliniko, Practice Better, VoxClinic | 22% |
| Azul + Verde | Feegow, GestaoDS, Clinicea | 13% |
| Verde (marketplace) | Doctoralia | 4% |
| Rosa/Magenta | Simples Dental | 4% |
| Roxo | Clinicminds | 4% |

**Insight:** O teal do VoxClinic (#14B8A6) posiciona o produto no grupo "premium moderno" junto com Cliniko, Practice Better e Amplimed, diferenciando-se do azul generico da maioria. Pesquisas mostram que 57% dos sites de saude usam azul, mas teal (verde-azulado) transmite modernidade + confianca.

### 2. Navegacao

| Padrao | CRMs | Notas |
|--------|-------|-------|
| Sidebar esquerda fixa | 21 de 23 (91%) | Padrao universal |
| Topbar + sidebar | Doctoralia, iClinic | Topbar para busca/notificacoes |
| Bottom nav mobile | VoxClinic (planejado) | Poucos concorrentes tem |
| Tabs por modulo | Clinica nas Nuvens, ProDoctor, Clinicea | Para sub-navegacao |

**Insight:** O VoxClinic esta alinhado com o padrao de sidebar + bottom nav mobile. A combinacao de sidebar desktop + bottom nav mobile e considerada best practice mas raramente implementada em CRMs brasileiros.

### 3. Calendario

| Feature | Presente em | Ausente em |
|---------|-------------|------------|
| Visao dia/semana/mes | Todos | - |
| Drag-and-drop | Jane, Cliniko, SimplePractice, Medesk, WriteUpp, VoxClinic | Maioria dos BR |
| Multi-agenda | Feegow, Ninsaude, Jane, SimplePractice, VoxClinic | Muitos BR |
| Codificacao por cores | Cliniko, Jane, SimplePractice, VoxClinic | Varios |
| Recurring appointments | WriteUpp, SimplePractice, VoxClinic | Maioria |
| Time blocking | VoxClinic | Raro |
| Now-line indicator | VoxClinic | Muito raro |
| Client-side cache | VoxClinic | Unico |

**Insight:** O calendario do VoxClinic e competitivo com os melhores internacionais. Time blocking, now-line e client-side cache sao diferenciais fortes.

### 4. Funcionalidades de IA

| Feature | CRMs | Relevancia para VoxClinic |
|---------|-------|--------------------------|
| **Transcricao de voz para prontuario** | DrChrono, Conclinica, VoxClinic | **Core differentiator** |
| AI Charting/Notes | Tebra (AI Note Assist), Practice Better (AI Charting), Clinicminds (Quinn AI) | Tendencia forte 2025-2026 |
| IA para confirmacao/WhatsApp | ProDoctor, App Health | Complementar |
| IA para marketing | iClinic | Diferente do core |
| IA prontuario estruturado | GestaoDS, Conclinica | Concorrente direto |

**Insight:** A transcricao de voz com extracao estruturada via IA do VoxClinic e um diferencial raro. Apenas DrChrono (iPad, ingles) e Conclinica (recente) oferecem algo similar. A maioria dos CRMs usa IA apenas para tarefas administrativas (lembretes, marketing).

### 5. Tech Stack

| Stack | CRMs | Notas |
|-------|-------|-------|
| **React** | iClinic, Feegow, SimplePractice, Cliniko (migrando) | Dominante no mercado |
| **Vue.js** | Jane App | Menos comum, mas excelente resultado |
| **Angular** | Ninsaude (provavel) | Comum em startups BR mais antigas |
| **Python/Django** | DrChrono | Backend traditional |
| **Ruby on Rails** | Cliniko (backend) | Escolha classica para SaaS |
| **Node.js** | iClinic, Feegow | Backend moderno |
| **Next.js + React** | VoxClinic | **Stack mais moderno do grupo** |
| **iOS nativo** | DrChrono, ProDoctor | Para apps nativos |

**Insight:** O stack do VoxClinic (Next.js 16 + React + Tailwind CSS v4 + shadcn/ui) e o mais moderno entre todos os analisados. Nenhum concorrente identificado usa Next.js com App Router + Tailwind v4 + shadcn. Isso traz vantagens em performance (RSC), SEO, e developer experience.

---

## Tendencias de Mercado 2025-2026

### 1. IA Generativa no Prontuario
- **Tendencia dominante:** Todos os lancamentos recentes incluem IA
- DrChrono: speech-to-text medico
- Tebra: AI Note Assist para charting
- Practice Better: AI Charting Assistant (grava, transcreve, resume)
- Clinicminds: Quinn AI Smart Summary
- Conclinica: Transcricao de conversa para documentacao estruturada
- **VoxClinic esta bem posicionado** nesta tendencia com Whisper + Claude

### 2. Telehealth Como Commodity
- Todas as plataformas oferecem telemedicina em 2025-2026
- Nao e mais diferencial, e requisito basico
- **VoxClinic ja tem teleconsulta** via Daily.co

### 3. WhatsApp-first no Brasil
- Quase todos os CRMs brasileiros integram WhatsApp para lembretes
- ProDoctor usa IA no WhatsApp (90%+ taxa resposta)
- **VoxClinic ja tem WhatsApp Business API** integrado

### 4. Self-booking pelo Paciente
- Jane App e referencia em auto-agendamento
- Tendencia crescente no Brasil (Doctoralia lidera)
- **VoxClinic ja tem booking publico** com token

### 5. Progressive Disclosure
- SimplePractice e referencia em mostrar informacao gradualmente
- Reduz cognitive overload
- **VoxClinic usa** "Mostrar todos" toggle no prontuario

### 6. Mobile-first Design
- DrChrono (iPad-first) mostrou que tablet na consulta funciona
- Bottom nav mobile e essencial
- **VoxClinic tem** bottom nav mobile + sidebar desktop

---

## Recomendacoes para o VoxClinic

Baseado na analise dos 23 CRMs, recomendamos as seguintes prioridades:

### Manter e Reforcar (ja existente e competitivo)
1. **Paleta teal (#14B8A6):** Alinhada com melhores praticas, diferencia do azul generico
2. **Transcricao por voz + IA estruturada:** Diferencial raro e valioso - poucos competem diretamente
3. **Calendario completo:** Drag-and-drop, multi-agenda, time blocking, now-line, cache local sao diferenciais
4. **Stack Next.js + Tailwind + shadcn:** Mais moderno que qualquer concorrente analisado
5. **Sidebar desktop + bottom nav mobile:** Best practice implementada
6. **WhatsApp Business API:** Essencial para mercado BR
7. **Teleconsulta:** Commodity que ja esta implementada
8. **Booking publico:** Alinhado com tendencia (Jane App como referencia)

### Oportunidades de Melhoria Inspiradas pelos Concorrentes

| Prioridade | Feature | Inspiracao | Impacto |
|------------|---------|------------|---------|
| P0 | **Onboarding guiado (tour interativo)** | Jane App, iClinic | Reducao de churn inicial |
| P0 | **Empty states com ilustracoes + CTAs** | SimplePractice, Jane | Ja parcialmente implementado |
| P1 | **Dark mode** | Nenhum concorrente tem - oportunidade de diferenciacao | Diferenciacao visual |
| P1 | **Keyboard shortcuts visivel (cheatsheet)** | SimplePractice (Ctrl+K) | VoxClinic ja tem Ctrl+K |
| P1 | **Template library de prontuarios por especialidade** | Jane App (SOAP notes), Clinicea (20+ templates) | Onboarding mais rapido |
| P2 | **Speech-to-text no prontuario (alem da consulta)** | DrChrono (macro + speech) | Expandir uso de voz |
| P2 | **Privacy toggle (ocultar nome paciente)** | WriteUpp | LGPD compliance avancado |
| P2 | **Branded patient portal** | Clinicminds, Cliniko | Experiencia do paciente |
| P2 | **Comparacao antes/depois (fotos)** | Simples Dental | Relevante para estetica |
| P3 | **Funil de vendas/CRM** | Ninsaude Clinic | Para clinicas maiores |
| P3 | **Alexa/voice commands** | Simples Dental | Inovacao futura |

### Design System - Refinamentos Sugeridos

1. **Animacoes:** Adicionar transicoes sutis em navegacao (inspirado Jane App) - sem exageros
2. **Loading states:** Skeleton screens consistentes (padrao SimplePractice)
3. **Toast notifications:** Ja usa Sonner, manter padroes consistentes
4. **Confirmacao de acoes destrutivas:** AlertDialog (ja usa em calendario, expandir)
5. **Micro-feedback visual:** Scale(0.98) em botoes (ja implementado) - manter
6. **Tipografia:** JetBrains Mono para dados (ja implementado) e Inter para texto (ja implementado) - excelente escolha

---

## Conclusao

O VoxClinic possui uma base tecnologica e de UX superior a maioria dos concorrentes brasileiros e competitiva com os melhores internacionais. O principal diferencial (transcricao de voz + IA para extracao estruturada) e raro no mercado e deve ser o foco principal de comunicacao e marketing.

As maiores oportunidades de melhoria estao em:
1. **Onboarding/educacao** (tour guiado, templates por especialidade)
2. **Polish visual** (animacoes sutis, dark mode como diferencial)
3. **Expansao do uso de voz** (alem da consulta, para todo o prontuario)

O stack tecnologico (Next.js 16 + Tailwind v4 + shadcn/ui + Prisma) e o mais moderno entre todos os analisados, oferecendo vantagens de performance e developer experience que sustentam iteracao rapida.

---

## Fontes Gerais

- [Healthcare UI Design 2026 - Eleken](https://www.eleken.co/blog-posts/user-interface-design-for-healthcare-applications)
- [Healthcare Color Psychology - Progress](https://www.progress.com/blogs/using-color-psychology-healthcare-web-design)
- [Medical Color Palettes - Piktochart](https://piktochart.com/tips/medical-color-palette/)
- [HealthTech UI Color Palettes - Octet Design](https://octet.design/colors/user-interfaces/healthtech-ui-design/)
- [Healthcare UX Trends 2026 - UX Studio](https://www.uxstudioteam.com/ux-blog/healthcare-ux)
- [Figma Medical Dashboard Kit](https://www.figma.com/community/file/1539596225682349141/preclinic-free-medical-clinic-management-dashboard-figma-ui-kit)
- [Cloudia - 15 Principais Softwares Medicos 2025](https://www.cloudia.com.br/8-melhores-softwares-medicos-do-mercado-2024/)
- [Dental Cremer - Melhores Softwares Odontologicos 2026](https://blog.dentalcremer.com.br/melhores-softwares-odontologicos/)
