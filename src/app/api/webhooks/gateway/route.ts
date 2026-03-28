import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { recordGatewayPayment } from "@/server/actions/gateway"

/**
 * POST /api/webhooks/gateway
 *
 * Handles incoming webhooks from payment gateways (Asaas).
 * Always returns 200 to prevent retries (even on processing errors).
 *
 * Asaas webhook docs: https://docs.asaas.com/docs/webhooks
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const event = body.event as string | undefined
  const payment = body.payment as Record<string, unknown> | undefined

  if (!event || !payment) {
    return NextResponse.json({ error: "Missing event or payment" }, { status: 400 })
  }

  const gatewayChargeId = payment.id as string | undefined
  const externalReference = payment.externalReference as string | undefined

  // Find the VoxClinic Payment by gatewayChargeId or externalReference
  let localPayment = null

  if (gatewayChargeId) {
    localPayment = await db.payment.findFirst({
      where: { gatewayChargeId },
    })
  }

  if (!localPayment && externalReference) {
    localPayment = await db.payment.findUnique({
      where: { id: externalReference },
    })
  }

  // Determine workspaceId from the payment or from the webhook token
  const workspaceId = localPayment?.workspaceId

  // Log webhook (always, even if we can't find the payment)
  await db.gatewayWebhookLog.create({
    data: {
      workspaceId: workspaceId || "unknown",
      provider: "asaas",
      eventType: event,
      paymentId: localPayment?.id || null,
      rawPayload: body as Record<string, string | number | boolean | null>,
      processed: false,
    },
  })

  if (!localPayment) {
    // We logged it but can't process — return 200 to avoid retries
    return NextResponse.json({ received: true, processed: false })
  }

  // ─── Process events ─────────────────────────────────────────

  try {
    switch (event) {
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED": {
        const value = payment.value as number | undefined
        const confirmedDate = payment.confirmedDate as string | undefined
        const billingType = payment.billingType as string | undefined

        await recordGatewayPayment(
          localPayment.id,
          value ? Math.round(value * 100) : localPayment.amount,
          billingType?.toLowerCase(),
          confirmedDate ? new Date(confirmedDate) : new Date()
        )

        // Mark webhook as processed
        await db.gatewayWebhookLog.updateMany({
          where: {
            paymentId: localPayment.id,
            eventType: event,
            processed: false,
          },
          data: { processed: true },
        })
        break
      }

      case "PAYMENT_OVERDUE": {
        await db.payment.update({
          where: { id: localPayment.id },
          data: {
            gatewayStatus: "overdue",
            status:
              localPayment.status === "pending" ? "overdue" : localPayment.status,
          },
        })

        // Update charge if needed
        if (localPayment.status === "pending") {
          const charge = await db.charge.findUnique({
            where: { id: localPayment.chargeId },
          })
          if (charge && charge.status === "pending") {
            await db.charge.update({
              where: { id: charge.id },
              data: { status: "overdue" },
            })
          }
        }

        await db.gatewayWebhookLog.updateMany({
          where: {
            paymentId: localPayment.id,
            eventType: event,
            processed: false,
          },
          data: { processed: true },
        })
        break
      }

      case "PAYMENT_REFUNDED":
      case "PAYMENT_REFUND_IN_PROGRESS": {
        await db.payment.update({
          where: { id: localPayment.id },
          data: {
            gatewayStatus: "refunded",
            status: "refunded",
          },
        })

        await db.gatewayWebhookLog.updateMany({
          where: {
            paymentId: localPayment.id,
            eventType: event,
            processed: false,
          },
          data: { processed: true },
        })
        break
      }

      case "PAYMENT_DELETED": {
        await db.payment.update({
          where: { id: localPayment.id },
          data: {
            gatewayStatus: "cancelled",
            gatewayChargeId: null,
            paymentLink: null,
            pixQrCode: null,
            pixCopiaECola: null,
            boletoUrl: null,
            boletoBarcode: null,
          },
        })

        await db.gatewayWebhookLog.updateMany({
          where: {
            paymentId: localPayment.id,
            eventType: event,
            processed: false,
          },
          data: { processed: true },
        })
        break
      }

      default:
        // Unknown event — logged but not processed
        break
    }
  } catch (err) {
    // Log error but still return 200 to prevent webhook retries
    console.error("[gateway-webhook] Error processing event:", event, err)
  }

  return NextResponse.json({ received: true, processed: true })
}
