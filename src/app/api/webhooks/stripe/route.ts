import Stripe from "stripe"
import { stripe, getPlanFromPriceId } from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !webhookSecret) {
    return new Response("Webhook secret not configured", { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const workspaceId = session.metadata?.workspaceId
        const planKey = session.metadata?.planKey

        if (!workspaceId || !planKey) break

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id

        await db.workspace.update({
          where: { id: workspaceId },
          data: {
            plan: planKey,
            planStatus: "active",
            stripeSubId: subscriptionId ?? undefined,
            stripeCustomerId:
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id ?? undefined,
          },
        })
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const subId =
          typeof subscription.id === "string" ? subscription.id : null
        if (!subId) break

        const workspace = await db.workspace.findFirst({
          where: { stripeSubId: subId },
        })
        if (!workspace) break

        // Map Stripe status to our planStatus
        let planStatus: string
        switch (subscription.status) {
          case "active":
            planStatus = "active"
            break
          case "past_due":
            planStatus = "past_due"
            break
          case "trialing":
            planStatus = "active"
            break
          case "canceled":
          case "unpaid":
            planStatus = "cancelled"
            break
          default:
            planStatus = workspace.planStatus
        }

        // Check if plan changed (upgrade/downgrade)
        const priceId = subscription.items.data[0]?.price?.id
        const newPlan = priceId ? getPlanFromPriceId(priceId) : null

        await db.workspace.update({
          where: { id: workspace.id },
          data: {
            planStatus,
            ...(newPlan ? { plan: newPlan } : {}),
          },
        })
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const subId =
          typeof subscription.id === "string" ? subscription.id : null
        if (!subId) break

        const workspace = await db.workspace.findFirst({
          where: { stripeSubId: subId },
        })
        if (!workspace) break

        await db.workspace.update({
          where: { id: workspace.id },
          data: {
            plan: "free",
            planStatus: "cancelled",
            stripeSubId: null,
          },
        })
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id
        if (!customerId) break

        const workspace = await db.workspace.findFirst({
          where: { stripeCustomerId: customerId },
        })
        if (!workspace) break

        await db.workspace.update({
          where: { id: workspace.id },
          data: { planStatus: "past_due" },
        })
        break
      }
    }
  } catch (err) {
    console.error("Stripe webhook processing error:", err)
    return new Response("Webhook handler error", { status: 500 })
  }

  return new Response("ok", { status: 200 })
}
