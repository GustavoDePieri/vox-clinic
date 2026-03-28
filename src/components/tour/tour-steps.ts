export interface TourStep {
  element: string // data-tour attribute selector
  title: string
  description: string
  page: string // route where this step is shown
}

/**
 * Desktop tour steps — targets sidebar nav links and dashboard elements.
 * 10 steps covering the main features of VoxClinic.
 */
export const desktopTourSteps: TourStep[] = [
  {
    element: '[data-tour="hero-card"]',
    title: "Bem-vindo ao VoxClinic!",
    description:
      "Este e seu painel principal. Aqui voce ve o resumo do dia, consultas e acoes rapidas.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="stats-grid"]',
    title: "Seus numeros",
    description:
      "Pacientes, consultas, agendamentos e gravacoes em tempo real.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="cta-nova-consulta"]',
    title: "Registrar consulta por voz",
    description:
      "O diferencial do VoxClinic: grave a consulta e a IA gera o resumo automaticamente.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="nav-pacientes"]',
    title: "Seus pacientes",
    description:
      "Cadastre, busque e gerencie todos os seus pacientes. Cadastro por voz tambem!",
    page: "/dashboard",
  },
  {
    element: '[data-tour="nav-agenda"]',
    title: "Agenda inteligente",
    description:
      "Visualize por dia, semana, mes ou lista. Arraste para reagendar.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="nav-financeiro"]',
    title: "Controle financeiro",
    description:
      "Cobrancas, pagamentos, despesas e emissao de NFS-e.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="nav-configuracoes"]',
    title: "Personalize seu workspace",
    description:
      "Procedimentos, campos customizados, equipe, agendas e integracoes.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="quick-actions"]',
    title: "Acoes rapidas",
    description:
      "Atalhos para as tarefas mais comuns: consulta, cadastro, agendamento.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="command-palette"]',
    title: "Busca rapida",
    description:
      "Use Ctrl+K para buscar pacientes, paginas ou acoes de qualquer lugar.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="nav-nova-consulta"]',
    title: "Tudo pronto!",
    description:
      "Voce esta pronto para comecar. Explore o VoxClinic e conte com o suporte em Configuracoes.",
    page: "/dashboard",
  },
]

/**
 * Mobile tour steps — targets bottom nav and dashboard elements.
 * Same content but with mobile-specific selectors.
 */
export const mobileTourSteps: TourStep[] = [
  {
    element: '[data-tour="hero-card"]',
    title: "Bem-vindo ao VoxClinic!",
    description:
      "Este e seu painel principal. Aqui voce ve o resumo do dia, consultas e acoes rapidas.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="stats-grid"]',
    title: "Seus numeros",
    description:
      "Pacientes, consultas, agendamentos e gravacoes em tempo real.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="cta-nova-consulta"]',
    title: "Registrar consulta por voz",
    description:
      "O diferencial do VoxClinic: grave a consulta e a IA gera o resumo automaticamente.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="nav-bottom-pacientes"]',
    title: "Seus pacientes",
    description:
      "Cadastre, busque e gerencie todos os seus pacientes.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="nav-bottom-agenda"]',
    title: "Agenda inteligente",
    description:
      "Visualize por dia, semana, mes ou lista. Toque para agendar.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="quick-actions"]',
    title: "Acoes rapidas",
    description:
      "Atalhos para as tarefas mais comuns: consulta, cadastro, agendamento.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="nav-bottom-nova-consulta"]',
    title: "Nova consulta",
    description:
      "Grave a consulta e deixe a IA cuidar do resumo.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="nav-bottom-config"]',
    title: "Configuracoes",
    description:
      "Personalize procedimentos, equipe, agendas e integracoes.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="command-palette-mobile"]',
    title: "Busca rapida",
    description:
      "Toque no icone de busca para encontrar pacientes ou acoes.",
    page: "/dashboard",
  },
  {
    element: '[data-tour="hero-card"]',
    title: "Tudo pronto!",
    description:
      "Voce esta pronto para comecar. Explore o VoxClinic e conte com o suporte em Configuracoes.",
    page: "/dashboard",
  },
]
