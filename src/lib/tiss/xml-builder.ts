/**
 * TISS XML Builder — generates ANS 4.01.00 compliant XML
 *
 * Uses template literals (no heavy XML library).
 * All XML generation follows the schema at:
 * http://www.ans.gov.br/padroes/tiss/schemas
 */

import { createHash } from "crypto"

// ============================================================
// Types
// ============================================================

export interface TissConfigData {
  cnes?: string | null
  codigoPrestador?: string | null
  cbos?: string | null
  conselhoProfissional?: string | null
  numeroConselho?: string | null
  ufConselho?: string | null
  versaoTiss: string
  sequencialGuia: number
}

export interface OperadoraData {
  registroAns: string
  nome: string
  cnpj?: string | null
}

export interface ProfessionalData {
  conselhoProfissional: string
  numeroConselho: string
  ufConselho: string
  nome: string
  cbos: string
}

export interface PatientData {
  name: string
  document?: string | null // CPF
  birthDate?: Date | null
  insuranceData?: {
    cardNumber?: string
    planName?: string
    validUntil?: string
  } | null
}

export interface TissGuideData {
  id: string
  type: "consulta" | "sp_sadt"
  numeroGuia: string
  numeroCarteira: string
  validadeCarteira?: Date | null
  codigoConsulta?: string | null
  procedimentos: TissProcedure[]
  dataAtendimento: Date
  tipoAtendimento?: string | null
  indicacaoClinica?: string | null
  observacao?: string | null
  valorTotal: number // centavos
  cidCode?: string | null
  cidDescription?: string | null
}

export interface TissProcedure {
  tussCode: string
  description: string
  quantity: number
  unitPrice: number // centavos
  totalPrice: number // centavos
}

export interface LoteBatchData {
  numeroLote: string
  cnpjPrestador: string
}

// ============================================================
// Helpers
// ============================================================

/** Escape XML special characters */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/** Format date as YYYY-MM-DD */
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Format time as HH:MM:SS */
function formatTime(date: Date): string {
  return date.toISOString().slice(11, 19)
}

/** Format centavos as decimal string (e.g., 15000 -> "150.00") */
function formatCurrency(centavos: number): string {
  return (centavos / 100).toFixed(2)
}

/** Pad number with leading zeros */
function padNumber(n: number, length: number): string {
  return String(n).padStart(length, "0")
}

// ============================================================
// Cabecalho (Header)
// ============================================================

function buildCabecalho(params: {
  cnpjPrestador: string
  registroAns: string
  versaoTiss: string
  sequencialTransacao: number
}): string {
  const now = new Date()
  return `<ans:cabecalho>
    <ans:identificacaoTransacao>
      <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>
      <ans:sequencialTransacao>${params.sequencialTransacao}</ans:sequencialTransacao>
      <ans:dataRegistroTransacao>${formatDate(now)}</ans:dataRegistroTransacao>
      <ans:horaRegistroTransacao>${formatTime(now)}</ans:horaRegistroTransacao>
    </ans:identificacaoTransacao>
    <ans:origem>
      <ans:identificacaoPrestador>
        <ans:CNPJ>${escapeXml(params.cnpjPrestador)}</ans:CNPJ>
      </ans:identificacaoPrestador>
    </ans:origem>
    <ans:destino>
      <ans:registroANS>${escapeXml(params.registroAns)}</ans:registroANS>
    </ans:destino>
    <ans:versaoPadrao>${escapeXml(params.versaoTiss)}</ans:versaoPadrao>
  </ans:cabecalho>`
}

// ============================================================
// Epilogo (SHA-256 hash)
// ============================================================

function buildEpilogo(hash: string): string {
  return `<ans:epilogo>
    <ans:hash>${escapeXml(hash)}</ans:hash>
  </ans:epilogo>`
}

// ============================================================
// Profissional Executante
// ============================================================

function buildProfissionalExecutante(prof: ProfessionalData): string {
  return `<ans:profissionalExecutante>
            <ans:conselhoProfissional>${escapeXml(prof.conselhoProfissional)}</ans:conselhoProfissional>
            <ans:numeroConselhoProfissional>${escapeXml(prof.numeroConselho)}</ans:numeroConselhoProfissional>
            <ans:UF>${escapeXml(prof.ufConselho)}</ans:UF>
            <ans:CBOS>${escapeXml(prof.cbos)}</ans:CBOS>
            <ans:nomeProfissional>${escapeXml(prof.nome)}</ans:nomeProfissional>
          </ans:profissionalExecutante>`
}

// ============================================================
// Dados Beneficiario
// ============================================================

function buildDadosBeneficiario(guide: TissGuideData, patient: PatientData): string {
  const validadeTag = guide.validadeCarteira
    ? `\n            <ans:atendimentoRN>${formatDate(guide.validadeCarteira)}</ans:atendimentoRN>`
    : ""
  return `<ans:dadosBeneficiario>
            <ans:numeroCarteira>${escapeXml(guide.numeroCarteira)}</ans:numeroCarteira>${validadeTag}
            <ans:nomeBeneficiario>${escapeXml(patient.name)}</ans:nomeBeneficiario>
          </ans:dadosBeneficiario>`
}

// ============================================================
// Guia de Consulta
// ============================================================

function buildGuiaConsultaContent(
  guide: TissGuideData,
  config: TissConfigData,
  operadora: OperadoraData,
  patient: PatientData,
  professional: ProfessionalData
): string {
  const codigoConsulta = guide.codigoConsulta || "10101012" // Default: consulta em consultorio
  const indicacao = guide.indicacaoClinica
    ? `\n          <ans:indicacaoClinica>${escapeXml(guide.indicacaoClinica)}</ans:indicacaoClinica>`
    : ""
  const cid = guide.cidCode
    ? `\n          <ans:CID>${escapeXml(guide.cidCode)}</ans:CID>`
    : ""
  const observacao = guide.observacao
    ? `\n          <ans:observacao>${escapeXml(guide.observacao)}</ans:observacao>`
    : ""

  return `<ans:guiaConsulta>
        <ans:registroANS>${escapeXml(operadora.registroAns)}</ans:registroANS>
        <ans:numeroGuiaPrestador>${escapeXml(guide.numeroGuia)}</ans:numeroGuiaPrestador>
        ${buildDadosBeneficiario(guide, patient)}
        <ans:dadosSolicitante>
          ${buildProfissionalExecutante(professional)}
        </ans:dadosSolicitante>
        <ans:dadosAtendimento>
          <ans:dataAtendimento>${formatDate(guide.dataAtendimento)}</ans:dataAtendimento>
          <ans:tipoConsulta>${escapeXml(codigoConsulta)}</ans:tipoConsulta>${indicacao}${cid}
        </ans:dadosAtendimento>
        <ans:valorTotal>${formatCurrency(guide.valorTotal)}</ans:valorTotal>${observacao}
      </ans:guiaConsulta>`
}

/**
 * Build complete TISS XML for Guia de Consulta
 */
export function buildGuiaConsultaXml(
  guide: TissGuideData,
  config: TissConfigData,
  operadora: OperadoraData,
  patient: PatientData,
  professional: ProfessionalData,
  cnpjPrestador: string,
  sequencialTransacao: number
): string {
  const guiaContent = buildGuiaConsultaContent(guide, config, operadora, patient, professional)
  return wrapInMensagemTiss(guiaContent, {
    cnpjPrestador,
    registroAns: operadora.registroAns,
    versaoTiss: config.versaoTiss,
    sequencialTransacao,
    numeroLote: padNumber(sequencialTransacao, 12),
  })
}

// ============================================================
// Guia SP/SADT
// ============================================================

function buildProcedimentosExecutados(procedimentos: TissProcedure[]): string {
  return procedimentos.map((proc, index) => `<ans:procedimentoExecutado>
            <ans:sequencialItem>${index + 1}</ans:sequencialItem>
            <ans:dataExecucao>${formatDate(new Date())}</ans:dataExecucao>
            <ans:procedimento>
              <ans:codigoTabela>22</ans:codigoTabela>
              <ans:codigoProcedimento>${escapeXml(proc.tussCode)}</ans:codigoProcedimento>
              <ans:descricaoProcedimento>${escapeXml(proc.description)}</ans:descricaoProcedimento>
            </ans:procedimento>
            <ans:quantidadeExecutada>${proc.quantity}</ans:quantidadeExecutada>
            <ans:valorUnitario>${formatCurrency(proc.unitPrice)}</ans:valorUnitario>
            <ans:valorTotal>${formatCurrency(proc.totalPrice)}</ans:valorTotal>
          </ans:procedimentoExecutado>`).join("\n        ")
}

function buildGuiaSpSadtContent(
  guide: TissGuideData,
  config: TissConfigData,
  operadora: OperadoraData,
  patient: PatientData,
  professional: ProfessionalData
): string {
  const indicacao = guide.indicacaoClinica
    ? `\n          <ans:indicacaoClinica>${escapeXml(guide.indicacaoClinica)}</ans:indicacaoClinica>`
    : ""
  const cid = guide.cidCode
    ? `\n          <ans:CID>${escapeXml(guide.cidCode)}</ans:CID>`
    : ""
  const observacao = guide.observacao
    ? `\n          <ans:observacao>${escapeXml(guide.observacao)}</ans:observacao>`
    : ""

  return `<ans:guiaSP-SADT>
        <ans:registroANS>${escapeXml(operadora.registroAns)}</ans:registroANS>
        <ans:numeroGuiaPrestador>${escapeXml(guide.numeroGuia)}</ans:numeroGuiaPrestador>
        ${buildDadosBeneficiario(guide, patient)}
        <ans:dadosSolicitante>
          ${buildProfissionalExecutante(professional)}
        </ans:dadosSolicitante>
        <ans:dadosAtendimento>
          <ans:dataAtendimento>${formatDate(guide.dataAtendimento)}</ans:dataAtendimento>
          <ans:tipoAtendimento>${escapeXml(guide.tipoAtendimento || "05")}</ans:tipoAtendimento>${indicacao}${cid}
        </ans:dadosAtendimento>
        <ans:procedimentosExecutados>
          ${buildProcedimentosExecutados(guide.procedimentos)}
        </ans:procedimentosExecutados>
        <ans:valorTotal>
          <ans:valorProcedimentos>${formatCurrency(guide.valorTotal)}</ans:valorProcedimentos>
          <ans:valorTotal>${formatCurrency(guide.valorTotal)}</ans:valorTotal>
        </ans:valorTotal>${observacao}
      </ans:guiaSP-SADT>`
}

/**
 * Build complete TISS XML for Guia SP/SADT
 */
export function buildGuiaSpSadtXml(
  guide: TissGuideData,
  config: TissConfigData,
  operadora: OperadoraData,
  patient: PatientData,
  professional: ProfessionalData,
  cnpjPrestador: string,
  sequencialTransacao: number
): string {
  const guiaContent = buildGuiaSpSadtContent(guide, config, operadora, patient, professional)
  return wrapInMensagemTiss(guiaContent, {
    cnpjPrestador,
    registroAns: operadora.registroAns,
    versaoTiss: config.versaoTiss,
    sequencialTransacao,
    numeroLote: padNumber(sequencialTransacao, 12),
  })
}

// ============================================================
// Lote (Batch) Wrapper
// ============================================================

/**
 * Build batch XML wrapping multiple guide contents
 */
export function buildLoteGuiasXml(
  guideContents: string[],
  config: TissConfigData,
  cnpjPrestador: string,
  registroAns: string,
  sequencialTransacao: number,
  numeroLote: string
): string {
  const cabecalho = buildCabecalho({
    cnpjPrestador,
    registroAns,
    versaoTiss: config.versaoTiss,
    sequencialTransacao,
  })

  const guiasBlock = guideContents.join("\n      ")

  const body = `${cabecalho}
  <ans:prestadorParaOperadora>
    <ans:loteGuias>
      <ans:numeroLote>${escapeXml(numeroLote)}</ans:numeroLote>
      <ans:guiasTISS>
        ${guiasBlock}
      </ans:guiasTISS>
    </ans:loteGuias>
  </ans:prestadorParaOperadora>`

  const hash = computeTissHash(body)

  return `<?xml version="1.0" encoding="UTF-8"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                   xsi:schemaLocation="http://www.ans.gov.br/padroes/tiss/schemas tissV4_01_00.xsd">
  ${body}
  ${buildEpilogo(hash)}
</ans:mensagemTISS>`
}

// ============================================================
// Common wrapper
// ============================================================

function wrapInMensagemTiss(
  guiaContent: string,
  params: {
    cnpjPrestador: string
    registroAns: string
    versaoTiss: string
    sequencialTransacao: number
    numeroLote: string
  }
): string {
  const cabecalho = buildCabecalho({
    cnpjPrestador: params.cnpjPrestador,
    registroAns: params.registroAns,
    versaoTiss: params.versaoTiss,
    sequencialTransacao: params.sequencialTransacao,
  })

  const body = `${cabecalho}
  <ans:prestadorParaOperadora>
    <ans:loteGuias>
      <ans:numeroLote>${escapeXml(params.numeroLote)}</ans:numeroLote>
      <ans:guiasTISS>
        ${guiaContent}
      </ans:guiasTISS>
    </ans:loteGuias>
  </ans:prestadorParaOperadora>`

  const hash = computeTissHash(body)

  return `<?xml version="1.0" encoding="UTF-8"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                   xsi:schemaLocation="http://www.ans.gov.br/padroes/tiss/schemas tissV4_01_00.xsd">
  ${body}
  ${buildEpilogo(hash)}
</ans:mensagemTISS>`
}

// ============================================================
// Hash
// ============================================================

/**
 * Compute SHA-256 hash of TISS XML content (between cabecalho and epilogo).
 * Per ANS spec, the hash covers the content between (and including)
 * cabecalho and the end of prestadorParaOperadora.
 */
export function computeTissHash(xmlContent: string): string {
  return createHash("sha256").update(xmlContent, "utf8").digest("hex")
}

// ============================================================
// Utility: extract guide-only XML (without envelope)
// ============================================================

/**
 * Build just the guide XML content (without mensagemTISS envelope).
 * Used when generating batch XML from multiple guides.
 */
export function buildGuideContentXml(
  guide: TissGuideData,
  config: TissConfigData,
  operadora: OperadoraData,
  patient: PatientData,
  professional: ProfessionalData
): string {
  if (guide.type === "consulta") {
    return buildGuiaConsultaContent(guide, config, operadora, patient, professional)
  }
  return buildGuiaSpSadtContent(guide, config, operadora, patient, professional)
}
