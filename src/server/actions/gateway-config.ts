"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { encrypt, decrypt } from "@/lib/crypto"
import { createGatewayClient } from "@/lib/gateway"
import {
  ERR_UNAUTHORIZED,
  ERR_WORKSPACE_NOT_CONFIGURED,
  ActionError,
  safeAction,
} from "@/lib/error-messages"

async function getWorkspaceContext() {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      workspace: true,
      memberships: { select: { workspaceId: true }, take: 1 },
    },
  })

  const workspaceId = user?.workspace?.id ?? user?.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error(ERR_WORKSPACE_NOT_CONFIGURED)

  return { workspaceId, clerkId: userId }
}

// ─── getGatewayConfig ─────────────────────────────────────────

export async function getGatewayConfig() {
  const { workspaceId } = await getWorkspaceContext()

  const config = await db.gatewayConfig.findUnique({
    where: { workspaceId },
  })

  if (!config) return null

  return {
    id: config.id,
    provider: config.provider,
    apiKey: maskApiKey(config.apiKey),
    walletId: config.walletId,
    isActive: config.isActive,
    sandboxMode: config.sandboxMode,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  }
}

// ─── saveGatewayConfig ────────────────────────────────────────

interface SaveGatewayConfigInput {
  provider: string
  apiKey?: string // only sent when changing the key
  walletId?: string
  webhookSecret?: string
  isActive: boolean
  sandboxMode: boolean
}

export const saveGatewayConfig = safeAction(
  async (input: SaveGatewayConfigInput) => {
    const { workspaceId } = await getWorkspaceContext()

    if (!input.provider) {
      throw new ActionError("Provedor e obrigatorio")
    }

    const existing = await db.gatewayConfig.findUnique({
      where: { workspaceId },
    })

    // If no apiKey provided and no existing config, require it
    if (!input.apiKey && !existing) {
      throw new ActionError("Chave da API e obrigatoria")
    }

    // Encrypt the API key if provided (new or changed)
    const encryptedApiKey = input.apiKey
      ? encrypt(input.apiKey)
      : existing!.apiKey

    const data = {
      provider: input.provider,
      apiKey: encryptedApiKey,
      walletId: input.walletId?.trim() || null,
      webhookSecret: input.webhookSecret?.trim() || existing?.webhookSecret || null,
      isActive: input.isActive,
      sandboxMode: input.sandboxMode,
    }

    const config = await db.gatewayConfig.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        ...data,
      },
      update: data,
    })

    return {
      id: config.id,
      provider: config.provider,
      isActive: config.isActive,
      sandboxMode: config.sandboxMode,
    }
  }
)

// ─── testGatewayConnection ────────────────────────────────────

export const testGatewayConnection = safeAction(async () => {
  const { workspaceId } = await getWorkspaceContext()

  const config = await db.gatewayConfig.findUnique({
    where: { workspaceId },
  })

  if (!config) {
    throw new ActionError(
      "Gateway nao configurado. Salve a configuracao primeiro."
    )
  }

  const client = createGatewayClient({
    provider: config.provider,
    apiKey: config.apiKey,
    sandboxMode: config.sandboxMode,
  })

  const result = await client.testConnection()

  return {
    valid: result.valid,
    message: result.message,
  }
})

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Mask API key for display — show first 8 and last 4 chars.
 * The key stored in DB is encrypted, so we decrypt then mask.
 */
function maskApiKey(encryptedKey: string): string {
  try {
    const plain = decrypt(encryptedKey)
    if (plain.length <= 12) return "****"
    return `${plain.slice(0, 8)}${"*".repeat(plain.length - 12)}${plain.slice(-4)}`
  } catch {
    return "****"
  }
}
