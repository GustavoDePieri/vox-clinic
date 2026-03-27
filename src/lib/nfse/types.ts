export interface EmitNfseInput {
  ambiente: "producao" | "homologacao"
  prestador: {
    cpfCnpj: string
    inscricaoMunicipal: string
  }
  tomador: {
    cpfCnpj?: string
    razaoSocial?: string
    endereco?: {
      logradouro?: string
      numero?: string
      bairro?: string
      codigoMunicipio?: string
      uf?: string
      cep?: string
    }
  }
  servico: {
    descricao: string
    codigoServico: string
    valorServicos: number // in BRL (not centavos)
    aliquotaIss: number
  }
}

export interface EmitNfseResponse {
  id: string
  status: string
  numero?: string
  codigoVerificacao?: string
  linkPdf?: string
  linkXml?: string
}

export interface NfseStatusResponse {
  id: string
  status: string
  numero?: string
  codigoVerificacao?: string
  mensagens?: { codigo: string; descricao: string }[]
}
