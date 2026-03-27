import Stripe from 'stripe'

function getStripeKey(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured')
  return key
}

export const stripe = new Stripe(getStripeKey(), {
  typescript: true,
})

// Plan to Stripe Price ID mapping
// These should be set up in Stripe Dashboard and mapped here
export const PLAN_PRICE_IDS: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_PRO || '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
}

export function getPlanFromPriceId(priceId: string): string | null {
  for (const [plan, id] of Object.entries(PLAN_PRICE_IDS)) {
    if (id === priceId) return plan
  }
  return null
}
