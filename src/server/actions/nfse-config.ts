"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NfseClient } from "@/lib/nfse/client"

async function getWorkspaceId() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true, memberships: { select: { workspaceId: true }, take: 1 } },
  })

  const workspaceId = user?.workspace?.id ?? user?.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error("Workspace not configured")

  return workspaceId
}

function validateCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "")
  if (digits.length !== 14) return false
  // Check all same digit
  if (/^(\d)\1{13}$/.test(digits)) return false

  // Check digit validation
  const calc = (slice: string, weights: number[]) => {
    let sum = 0
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(slice[i]) * weights[i]
    }
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const d1 = calc(digits, w1)
  if (parseInt(digits[12]) !== d1) return false

  const d2 = calc(digits, w2)
  if (parseInt(digits[13]) !== d2) return false

  return true
}

export async function getNfseConfig() {
  const workspaceId = await getWorkspaceId()

  const config = await db.nfseConfig.findUnique({
    where: { workspaceId },
  })

  if (!config) return null

  return {
    id: config.id,
    cnpj: config.cnpj,
    inscricaoMunicipal: config.inscricaoMunicipal,
    codigoServico: config.codigoServico,
    descricaoServico: config.descricaoServico,
    aliquotaISS: config.aliquotaISS,
    regimeTributario: config.regimeTributario,
    provider: config.provider,
    apiKey: config.apiKey ? `****${config.apiKey.slice(-4)}` : '',
    certificateId: config.certificateId,
    clinicCity: config.clinicCity,
    clinicState: config.clinicState,
    clinicCep: config.clinicCep,
    isActive: config.isActive,
  }
}

export async function saveNfseConfig(data: {
  cnpj: string
  inscricaoMunicipal: string
  codigoServico: string
  descricaoServico: string
  aliquotaISS: number
  regimeTributario: string
  provider: string
  apiKey: string
  clinicCity: string
  clinicState: string
  clinicCep: string
}) {
  const workspaceId = await getWorkspaceId()

  // Clean CNPJ
  const cnpjDigits = data.cnpj.replace(/\D/g, "")
  if (!validateCnpj(cnpjDigits)) {
    throw new Error("CNPJ invalido")
  }

  // Validate required fields
  if (!data.inscricaoMunicipal.trim()) throw new Error("Inscricao Municipal e obrigatoria")
  if (!data.codigoServico.trim()) throw new Error("Codigo de Servico e obrigatorio")
  if (!data.descricaoServico.trim()) throw new Error("Descricao do Servico e obrigatoria")
  if (data.aliquotaISS < 0 || data.aliquotaISS > 100) throw new Error("Aliquota ISS invalida")
  // If apiKey starts with ****, it's the masked value — don't require a new one
  const isMaskedApiKey = data.apiKey.startsWith('****')
  if (!isMaskedApiKey && !data.apiKey.trim()) throw new Error("API Key e obrigatoria")
  if (!data.clinicCity.trim()) throw new Error("Cidade e obrigatoria")
  if (!data.clinicState.trim()) throw new Error("Estado e obrigatorio")
  if (!data.clinicCep.replace(/\D/g, "").trim()) throw new Error("CEP e obrigatorio")

  // Only update apiKey if the user provided a new (non-masked) value
  const apiKeyToSave = isMaskedApiKey ? undefined : data.apiKey.trim()

  const config = await db.nfseConfig.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      cnpj: cnpjDigits,
      inscricaoMunicipal: data.inscricaoMunicipal.trim(),
      codigoServico: data.codigoServico.trim(),
      descricaoServico: data.descricaoServico.trim(),
      aliquotaISS: data.aliquotaISS,
      regimeTributario: data.regimeTributario,
      provider: data.provider,
      apiKey: apiKeyToSave ?? '',
      clinicCity: data.clinicCity.trim(),
      clinicState: data.clinicState.trim(),
      clinicCep: data.clinicCep.replace(/\D/g, ""),
    },
    update: {
      cnpj: cnpjDigits,
      inscricaoMunicipal: data.inscricaoMunicipal.trim(),
      codigoServico: data.codigoServico.trim(),
      descricaoServico: data.descricaoServico.trim(),
      aliquotaISS: data.aliquotaISS,
      regimeTributario: data.regimeTributario,
      provider: data.provider,
      ...(apiKeyToSave !== undefined ? { apiKey: apiKeyToSave } : {}),
      clinicCity: data.clinicCity.trim(),
      clinicState: data.clinicState.trim(),
      clinicCep: data.clinicCep.replace(/\D/g, ""),
    },
  })

  return { id: config.id }
}

export async function testNfseConnection() {
  const workspaceId = await getWorkspaceId()

  const config = await db.nfseConfig.findUnique({
    where: { workspaceId },
  })

  if (!config) throw new Error("Configuracao NFS-e nao encontrada. Salve a configuracao primeiro.")
  if (!config.apiKey) throw new Error("API Key nao configurada")

  const client = new NfseClient(config.apiKey)

  try {
    const ok = await client.testConnection()
    if (!ok) throw new Error("Falha na conexao")
    return { success: true, message: "Conexao com o provedor realizada com sucesso!" }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido"
    throw new Error(`Falha ao conectar com o provedor: ${message}`)
  }
}
