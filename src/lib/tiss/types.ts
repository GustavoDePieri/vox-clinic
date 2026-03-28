// ============================================================
// TISS Types — TypeScript interfaces for TISS data structures
// ============================================================

/** Procedimento within a TISS guide (SP/SADT or consultation) */
export interface TissProcedimento {
  /** TUSS procedure code */
  codigoTuss: string
  /** Procedure description */
  descricao: string
  /** Quantity performed */
  quantidade: number
  /** Unit price in centavos */
  valorUnitario: number
  /** Total price in centavos (quantidade * valorUnitario) */
  valorTotal: number
}

/** Data for creating/updating a TISS guide */
export interface TissGuideData {
  /** Guide type */
  type: "consulta" | "sp_sadt"
  /** Operadora (insurance company) ID */
  operadoraId: string
  /** Patient ID */
  patientId: string
  /** Appointment ID (optional) */
  appointmentId?: string
  /** Charge ID (optional, links to financial) */
  chargeId?: string
  /** Beneficiary card number */
  numeroCarteira: string
  /** Card validity date */
  validadeCarteira?: Date
  /** TUSS consultation code (for type "consulta") */
  codigoConsulta?: string
  /** Procedures (for type "sp_sadt") */
  procedimentos?: TissProcedimento[]
  /** Service date */
  dataAtendimento: Date
  /** Type of care (urgencia, eletivo, etc.) */
  tipoAtendimento?: string
  /** Clinical indication */
  indicacaoClinica?: string
  /** Observations */
  observacao?: string
  /** Total value in centavos */
  valorTotal: number
  /** CID-10 code */
  cidCode?: string
  /** CID-10 description */
  cidDescription?: string
}

/** TISS configuration data for a workspace */
export interface TissConfigData {
  /** CNES number (7 digits) */
  cnes?: string
  /** Provider code */
  codigoPrestador?: string
  /** CBOS occupation code (6 digits) */
  cbos?: string
  /** Professional council (CRM, CRO, etc.) */
  conselhoProfissional?: string
  /** Council registration number */
  numeroConselho?: string
  /** State of council registration */
  ufConselho?: string
  /** TISS version */
  versaoTiss?: string
}

/** Operadora (insurance company) data */
export interface OperadoraData {
  /** ANS registration number (6 digits) */
  registroAns: string
  /** Company name */
  nome: string
  /** CNPJ (optional) */
  cnpj?: string
}

/** Patient insurance data stored in Patient.insuranceData JSON field */
export interface PatientInsuranceData {
  /** Reference to Operadora ID */
  operadoraId?: string
  /** Card/carteirinha number */
  cardNumber?: string
  /** Plan name */
  planName?: string
  /** Plan code */
  planCode?: string
  /** Card validity date (ISO string) */
  validUntil?: string
}

// ============================================================
// XML Structure Types
// ============================================================

/** TISS XML envelope (mensagemTISS) */
export interface TissXmlEnvelope {
  cabecalho: {
    identificacaoTransacao: {
      tipoTransacao: string
      sequencialTransacao: string
      dataRegistroTransacao: string
      horaRegistroTransacao: string
    }
    origem: {
      identificacaoPrestador: {
        cnpj?: string
        codigoPrestadorNaOperadora?: string
      }
    }
    destino: {
      registroAns: string
    }
    versaoPadrao: string
  }
  prestadorParaOperadora: {
    loteGuias: {
      numeroLote: string
      guias: (GuiaConsultaXml | GuiaSpSadtXml)[]
    }
  }
  epilogo: {
    hash: string
  }
}

/** Guia de Consulta XML structure */
export interface GuiaConsultaXml {
  tipo: "guia_consulta"
  /** Guide number assigned by provider */
  numeroGuiaPrestador: string
  /** Beneficiary card number */
  numeroCarteira: string
  /** Card validity */
  validadeCarteira?: string
  /** Beneficiary name */
  nomeBeneficiario: string
  /** Beneficiary CNES code (optional) */
  cnes?: string
  /** Provider CNPJ */
  cnpjContratado?: string
  /** Provider name */
  nomeContratado?: string
  /** Professional council */
  conselhoProfissional: string
  /** Council number */
  numeroConselho: string
  /** Council UF */
  ufConselho: string
  /** CBOS code */
  cbos: string
  /** CID-10 code */
  cid10?: string
  /** TUSS consultation code */
  codigoConsulta: string
  /** Service date (YYYY-MM-DD) */
  dataAtendimento: string
  /** Type of care */
  tipoAtendimento?: string
  /** Observations */
  observacao?: string
  /** Total value (decimal string, e.g., "150.00") */
  valorConsulta: string
}

/** Guia SP/SADT XML structure */
export interface GuiaSpSadtXml {
  tipo: "guia_sp_sadt"
  /** Guide number assigned by provider */
  numeroGuiaPrestador: string
  /** Beneficiary card number */
  numeroCarteira: string
  /** Card validity */
  validadeCarteira?: string
  /** Beneficiary name */
  nomeBeneficiario: string
  /** Provider CNES */
  cnes?: string
  /** Provider CNPJ */
  cnpjContratado?: string
  /** Provider name */
  nomeContratado?: string
  /** Professional council */
  conselhoProfissional: string
  /** Council number */
  numeroConselho: string
  /** Council UF */
  ufConselho: string
  /** CBOS code */
  cbos: string
  /** Clinical indication */
  indicacaoClinica?: string
  /** CID-10 code */
  cid10?: string
  /** Service date (YYYY-MM-DD) */
  dataAtendimento: string
  /** Type of care */
  tipoAtendimento?: string
  /** Procedures list */
  procedimentos: {
    codigoTuss: string
    descricao: string
    quantidade: string
    valorUnitario: string
    valorTotal: string
  }[]
  /** Total value (decimal string) */
  valorTotal: string
  /** Observations */
  observacao?: string
}
