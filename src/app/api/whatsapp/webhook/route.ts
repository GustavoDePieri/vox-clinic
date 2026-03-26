import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import type {
  WebhookPayload,
  IncomingMessage,
  MessageStatus,
} from "@/lib/whatsapp/types"

// ============================================
// Validacao de assinatura HMAC-SHA256 (Meta)
// ============================================

export function validateWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature =
    "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex")
  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

// ============================================
// GET /api/whatsapp/webhook
// Verificacao do webhook pela Meta
// ============================================

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verificacao bem-sucedida")
    return new NextResponse(challenge, { status: 200 })
  }

  console.warn("[WhatsApp Webhook] Verificacao falhou - token invalido")
  return NextResponse.json({ error: "Token invalido" }, { status: 403 })
}

// ============================================
// POST /api/whatsapp/webhook
// Recebe mensagens e status updates
// ============================================

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("x-hub-signature-256")

    let payload: WebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.error("[WhatsApp Webhook] Erro ao parsear payload")
      return NextResponse.json({ status: "ok" }, { status: 200 })
    }

    // Valida assinatura HMAC-SHA256 da Meta
    const phoneNumberIds = extractPhoneNumberIds(payload)
    if (phoneNumberIds.length > 0) {
      const configs = await db.whatsAppConfig.findMany({
        where: { phoneNumberId: { in: phoneNumberIds }, isActive: true },
        select: { webhookSecret: true },
      })

      // Se alguma config tem webhookSecret, exigir assinatura valida
      const configsWithSecret = configs.filter((c) => c.webhookSecret)
      if (configsWithSecret.length > 0) {
        if (!signature) {
          console.warn("[WhatsApp Webhook] Assinatura ausente — rejeitando")
          return NextResponse.json(
            { error: "Assinatura ausente" },
            { status: 401 }
          )
        }

        const isValid = configsWithSecret.some((c) =>
          validateWebhookSignature(rawBody, signature, c.webhookSecret!)
        )
        if (!isValid) {
          console.warn("[WhatsApp Webhook] Assinatura invalida — rejeitando")
          return NextResponse.json(
            { error: "Assinatura invalida" },
            { status: 401 }
          )
        }
      }
      // Se nenhuma config tem webhookSecret, processar normalmente (backwards compat)
    }

    // Meta espera 200 rapido — processe async
    processWebhookAsync(payload).catch((err) =>
      console.error("[WhatsApp Webhook] Erro no processamento:", err)
    )

    return NextResponse.json({ status: "ok" }, { status: 200 })
  } catch (error) {
    console.error("[WhatsApp Webhook] Erro ao parsear payload:", error)
    return NextResponse.json({ status: "ok" }, { status: 200 }) // sempre 200 pra Meta
  }
}

// ============================================
// Helpers — Extracao de phoneNumberId
// ============================================

function extractPhoneNumberIds(payload: WebhookPayload): string[] {
  const ids: string[] = []
  if (payload.object !== "whatsapp_business_account") return ids
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field === "messages" && change.value?.metadata?.phone_number_id) {
        ids.push(change.value.metadata.phone_number_id)
      }
    }
  }
  return [...new Set(ids)]
}

// ============================================
// Processamento Assincrono
// ============================================

async function processWebhookAsync(payload: WebhookPayload) {
  if (payload.object !== "whatsapp_business_account") return

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages") continue

      const { value } = change
      const phoneNumberId = value.metadata.phone_number_id

      // Identifica o workspace pelo phoneNumberId
      const config = await db.whatsAppConfig.findFirst({
        where: { phoneNumberId, isActive: true },
      })
      if (!config) {
        console.warn(
          `[WhatsApp Webhook] Config nao encontrada para phone_number_id: ${phoneNumberId}`
        )
        continue
      }

      // Processa mensagens recebidas
      if (value.messages) {
        for (const message of value.messages) {
          const contactName =
            value.contacts?.find((c) => c.wa_id === message.from)?.profile
              .name || "Desconhecido"

          await handleIncomingMessage(config.workspaceId, config.id, message, contactName)
        }
      }

      // Processa atualizacoes de status
      if (value.statuses) {
        for (const status of value.statuses) {
          await handleStatusUpdate(status)
        }
      }

      // Processa erros
      if (value.errors) {
        for (const error of value.errors) {
          console.error(
            `[WhatsApp Webhook] Erro [${error.code}]: ${error.title} - ${error.message}`
          )
        }
      }
    }
  }
}

// ============================================
// Handlers
// ============================================

async function handleIncomingMessage(
  workspaceId: string,
  configId: string,
  message: IncomingMessage,
  contactName: string
) {
  console.log(
    `[WhatsApp] Mensagem recebida de ${message.from}: ${message.type}`
  )

  const content = extractContent(message)

  // Cria ou atualiza conversa
  const conversation = await db.whatsAppConversation.upsert({
    where: {
      workspaceId_contactPhone_configId: {
        workspaceId,
        contactPhone: message.from,
        configId,
      },
    },
    create: {
      workspaceId,
      configId,
      contactPhone: message.from,
      contactName,
      lastMessageAt: new Date(parseInt(message.timestamp) * 1000),
      lastMessagePreview: content.substring(0, 100),
      status: "open",
      unreadCount: 1,
    },
    update: {
      contactName,
      lastMessageAt: new Date(parseInt(message.timestamp) * 1000),
      lastMessagePreview: content.substring(0, 100),
      unreadCount: { increment: 1 },
      status: "open",
    },
  })

  // Salva a mensagem (upsert para idempotencia em retries do webhook)
  await db.whatsAppMessage.upsert({
    where: { waMessageId: message.id },
    create: {
      conversationId: conversation.id,
      workspaceId,
      waMessageId: message.id,
      direction: "inbound",
      type: message.type,
      content,
      mediaUrl: extractMediaId(message),
      status: "delivered",
    },
    update: {},
  })
}

async function handleStatusUpdate(status: MessageStatus) {
  console.log(
    `[WhatsApp] Status update: ${status.id} -> ${status.status}`
  )

  await db.whatsAppMessage.updateMany({
    where: { waMessageId: status.id },
    data: { status: status.status },
  })

  if (status.errors) {
    console.error(
      `[WhatsApp] Mensagem ${status.id} falhou:`,
      status.errors
    )
  }
}

// ============================================
// Helpers
// ============================================

function extractContent(message: IncomingMessage): string {
  switch (message.type) {
    case "text":
      return message.text?.body || ""
    case "image":
      return message.image?.caption || "[Imagem]"
    case "document":
      return message.document?.filename || "[Documento]"
    case "audio":
      return "[Audio]"
    case "video":
      return message.video?.caption || "[Video]"
    case "location":
      return `[Localizacao: ${message.location?.latitude}, ${message.location?.longitude}]`
    case "button":
      return message.button?.text || "[Botao]"
    case "interactive":
      return (
        message.interactive?.button_reply?.title ||
        message.interactive?.list_reply?.title ||
        "[Interativo]"
      )
    default:
      return `[${message.type}]`
  }
}

function extractMediaId(message: IncomingMessage): string | undefined {
  switch (message.type) {
    case "image":
      return message.image?.id
    case "document":
      return message.document?.id
    case "audio":
      return message.audio?.id
    case "video":
      return message.video?.id
    default:
      return undefined
  }
}
