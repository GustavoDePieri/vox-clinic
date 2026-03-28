// ============================================================
// TISS Constants — ANS/TUSS/CBOS codes and enumerations
// ============================================================

/** Current TISS version supported */
export const TISS_VERSION = "4.01.00"

/** ANS XML namespace */
export const TISS_NAMESPACE = "http://www.ans.gov.br/padroes/tiss/schemas"

// ============================================================
// TUSS Consultation Codes (Terminologia Unificada da Saude Suplementar)
// ============================================================

export const TIPO_CONSULTA = {
  /** Consulta em consultorio (horario normal) */
  CONSULTA_CONSULTORIO: "10101012",
  /** Consulta em consultorio (horario especial — nocturno/fds/feriado) */
  CONSULTA_CONSULTORIO_ESPECIAL: "10101020",
  /** Consulta em domicilio */
  CONSULTA_DOMICILIO: "10102019",
  /** Consulta em pronto socorro */
  CONSULTA_PRONTO_SOCORRO: "20101015",
  /** Teleconsulta */
  TELECONSULTA: "10101039",
} as const

/** Lookup table for TUSS consultation codes with descriptions */
export const TUSS_CONSULTA_CODES: { code: string; description: string }[] = [
  { code: "10101012", description: "Consulta em consultorio (horario normal)" },
  { code: "10101020", description: "Consulta em consultorio (horario especial)" },
  { code: "10101039", description: "Consulta/sessao de acompanhamento de paciente em tratamento (retorno)" },
  { code: "10102019", description: "Consulta em domicilio" },
  { code: "20101015", description: "Consulta em pronto socorro" },
]

// ============================================================
// Tipo de Atendimento
// ============================================================

export const TIPO_ATENDIMENTO = {
  URGENCIA: "1",
  ELETIVO: "2",
  ACIDENTE_TRABALHO: "3",
  ACIDENTE_TRANSITO: "4",
  OUTROS_ACIDENTES: "5",
} as const

export const TIPO_ATENDIMENTO_LABELS: Record<string, string> = {
  "1": "Urgencia/Emergencia",
  "2": "Eletivo",
  "3": "Acidente de trabalho",
  "4": "Acidente de transito",
  "5": "Outros acidentes",
}

// ============================================================
// Conselho Profissional
// ============================================================

export const CONSELHO_PROFISSIONAL = {
  CRM: "CRM",     // Medicina
  CRO: "CRO",     // Odontologia
  CRN: "CRN",     // Nutricao
  CRP: "CRP",     // Psicologia
  COREN: "COREN", // Enfermagem
  CREFITO: "CREFITO", // Fisioterapia e Terapia Ocupacional
  CRF: "CRF",     // Farmacia
  CRBM: "CRBM",   // Biomedicina
  CRFa: "CRFa",   // Fonoaudiologia
  CRESS: "CRESS",  // Servico Social
  COFFITO: "COFFITO", // Fisioterapia (conselho federal)
  CBO: "CBO",     // Biologia
} as const

export const CONSELHO_PROFISSIONAL_OPTIONS: { value: string; label: string }[] = [
  { value: "CRM", label: "CRM — Conselho Regional de Medicina" },
  { value: "CRO", label: "CRO — Conselho Regional de Odontologia" },
  { value: "CRN", label: "CRN — Conselho Regional de Nutricao" },
  { value: "CRP", label: "CRP — Conselho Regional de Psicologia" },
  { value: "COREN", label: "COREN — Conselho Regional de Enfermagem" },
  { value: "CREFITO", label: "CREFITO — Conselho Regional de Fisioterapia" },
  { value: "CRF", label: "CRF — Conselho Regional de Farmacia" },
  { value: "CRBM", label: "CRBM — Conselho Regional de Biomedicina" },
  { value: "CRFa", label: "CRFa — Conselho Regional de Fonoaudiologia" },
  { value: "CRESS", label: "CRESS — Conselho Regional de Servico Social" },
]

// ============================================================
// UF Codes (Brazilian states)
// ============================================================

export const UF_CODES = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES",
  "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE",
  "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC",
  "SE", "SP", "TO",
] as const

export const UF_LABELS: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapa",
  BA: "Bahia", CE: "Ceara", DF: "Distrito Federal", ES: "Espirito Santo",
  GO: "Goias", MA: "Maranhao", MG: "Minas Gerais", MS: "Mato Grosso do Sul",
  MT: "Mato Grosso", PA: "Para", PB: "Paraiba", PE: "Pernambuco",
  PI: "Piaui", PR: "Parana", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RO: "Rondonia", RR: "Roraima", RS: "Rio Grande do Sul", SC: "Santa Catarina",
  SE: "Sergipe", SP: "Sao Paulo", TO: "Tocantins",
}

// ============================================================
// TISS Guide Status
// ============================================================

export const TISS_GUIDE_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  PAID: "paid",
  DENIED: "denied",
  CANCELLED: "cancelled",
} as const

export const TISS_GUIDE_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  submitted: "Enviada",
  paid: "Paga",
  denied: "Negada",
  cancelled: "Cancelada",
}

// ============================================================
// TISS Guide Types
// ============================================================

export const TISS_GUIDE_TYPES = {
  CONSULTA: "consulta",
  SP_SADT: "sp_sadt",
} as const

export const TISS_GUIDE_TYPE_LABELS: Record<string, string> = {
  consulta: "Guia de Consulta",
  sp_sadt: "Guia SP/SADT",
}

// ============================================================
// CBOS Codes (common healthcare occupations)
// ============================================================

export const CBOS_CODES: { code: string; description: string }[] = [
  { code: "225120", description: "Medico clinico geral" },
  { code: "225125", description: "Medico de familia" },
  { code: "225142", description: "Medico ginecologista e obstetra" },
  { code: "225133", description: "Medico dermatologista" },
  { code: "225135", description: "Medico endocrinologista" },
  { code: "225155", description: "Medico ortopedista" },
  { code: "225170", description: "Medico psiquiatra" },
  { code: "225150", description: "Medico oftalmologista" },
  { code: "225145", description: "Medico neurologista" },
  { code: "225124", description: "Medico cardiologista" },
  { code: "225148", description: "Medico nefrologista" },
  { code: "225160", description: "Medico otorrinolaringologista" },
  { code: "225185", description: "Medico urologista" },
  { code: "223208", description: "Cirurgiao-dentista clinico geral" },
  { code: "223212", description: "Cirurgiao-dentista endodontista" },
  { code: "223216", description: "Cirurgiao-dentista ortodontista" },
  { code: "223604", description: "Fisioterapeuta" },
  { code: "223505", description: "Nutricionista" },
  { code: "251510", description: "Psicologo clinico" },
  { code: "223810", description: "Fonoaudiologo" },
  { code: "223405", description: "Terapeuta ocupacional" },
]
