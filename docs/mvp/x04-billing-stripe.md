# [x04] Billing e Planos (Stripe) — Implementation Document

> **Issue:** [#20](https://github.com/vox-clinic/vox-clinic/issues/20)
> **Priority:** Essential | **Effort:** High | **Milestone:** MVP
> **Description:** Stripe integration, upgrade/downgrade, MRR tracking.

---

## 1. Problem Statement

VoxClinic has a complete plan limits and enforcement system, but no way to actually charge users. Plans are assigned manually. There is no:
- Payment collection for subscriptions
- Self-service upgrade/downgrade
- Trial-to-paid conversion flow
- Revenue tracking (MRR)

Without billing, VoxClinic cannot monetize.

---

## 2. Current System State — Remarkably Ready

The codebase is **very well prepared** for Stripe. Most of the infrastructure exists:

### Already Built
| Asset | Location | Status |
|-------|----------|--------|
| `workspace.plan` | Prisma schema | `"free" \| "pro" \| "enterprise"` |
| `workspace.planStatus` | Prisma schema | `"active" \| "suspended" \| "cancelled"` |
| `workspace.stripeCustomerId` | Prisma schema | Ready (nullable String) |
| `workspace.stripeSubId` | Prisma schema | Ready (nullable String) |
| `workspace.trialEndsAt` | Prisma schema | Ready (nullable DateTime) |
| Plan limits definition | `src/lib/plan-limits.ts` | 3 tiers with feature/resource caps |
| Plan enforcement | `src/lib/plan-enforcement.ts` | Called from server actions (patients, appointments, agendas, etc.) |
| UsageRecord model | Prisma schema | Per-workspace monthly metrics |
| Admin dashboard | `src/server/actions/admin.ts` | Queries plan distribution |
| Landing page pricing | `src/components/landing/pricing-section.tsx` | Displays plan tiers |

### What's Missing
- Stripe SDK integration
- Checkout flow
- Webhook handler for subscription events
- Customer Portal for self-service
- Billing settings page
- MRR tracking for admin

---

## 3. Modern Stripe + Next.js Patterns (2025/2026)

### Architecture Decision: Server Actions + Route Handler

- **Server Actions** for creating Checkout Sessions and Customer Portal sessions (no `/api/checkout` routes needed)
- **Route Handler** only for the Stripe webhook (`POST /api/webhooks/stripe`) since Stripe needs a static URL

### Checkout: Stripe Checkout (Redirect Mode)

Simplest and most secure approach:
1. Server Action creates a `checkout.session`
2. User redirects to Stripe-hosted page
3. Handles PCI compliance, PIX, boleto, cards automatically
4. Returns to success/cancel URL

### Self-Service: Stripe Customer Portal

Pre-built by Stripe — handles upgrade/downgrade, payment method changes, invoice history, cancellation. One Server Action to create a portal session. Zero custom billing management UI needed.

### Webhook as Source of Truth

**Never trust client-side for plan changes.** Only update `workspace.plan` and `planStatus` from webhook events. The Stripe webhook is the single source of truth for subscription state.

### Brazilian Payment Methods

| Method | Use Case | Notes |
|--------|----------|-------|
| **Card** (Visa/MC) | Primary for subscriptions | Standard recurring billing |
| **PIX** | One-time or PIX Automatico (recurring) | 40%+ of BR online payments. PIX Automatico enables recurring debits (launched Sep 2025) |
| **Boleto** | Fallback for users without cards | 1 business day confirmation, cannot be refunded |

---

## 4. Stripe Product/Price Setup

Create in Stripe Dashboard (or via seed script):

| Plan | Price (BRL/month) | Stripe Product | Features |
|------|-------------------|----------------|----------|
| **Free** | R$ 0 | No Stripe product needed | 50 patients, 100 appointments, 1 agenda |
| **Pro** | R$ 149/mo | `prod_voxclinic_pro` | 500 patients, 1000 appointments, 5 agendas, all features |
| **Enterprise** | R$ 399/mo | `prod_voxclinic_enterprise` | Unlimited everything |

Each product has a `metadata.plan_key` field (`"pro"` / `"enterprise"`) that maps to the existing plan names in `plan-limits.ts`.

**Note:** CLAUDE.md mentions plan names `free/starter/professional/clinic` but actual code uses `free/pro/enterprise`. Reconcile before launch — the code is authoritative.

---

## 5. Implementation

### 5.1 Stripe Client

**File:** `src/lib/stripe.ts`

```typescript
import Stripe from 'stripe'
import { env } from './env'

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-18.acacia', // latest stable
  typescript: true,
})
```

**npm package:** `stripe` (server-side only)

### 5.2 Environment Variables

Add to `src/lib/env.ts` (optional group, like Resend):

```typescript
STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
```

### 5.3 Server Actions

**File:** `src/server/actions/billing.ts`

| Action | Description |
|--------|-------------|
| `createCheckoutSession(planKey)` | Creates Stripe Checkout Session for upgrading to `planKey`. Returns checkout URL. Sets `metadata.workspaceId` and `metadata.planKey` on the session. |
| `createPortalSession()` | Creates Stripe Customer Portal session. Returns portal URL. |
| `getBillingInfo()` | Returns current plan, status, trial end date, next invoice date. Uses Stripe API if `stripeSubId` exists. |
| `cancelSubscription()` | Cancels at period end via Stripe API. Actual cancellation handled by webhook. |

### 5.4 Webhook Handler

**File:** `src/app/api/webhooks/stripe/route.ts`

```typescript
export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!
  const event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET)

  switch (event.type) {
    case 'checkout.session.completed':
      // Extract workspaceId + planKey from metadata
      // Create Stripe Customer if first time
      // Update workspace: plan, stripeCustomerId, stripeSubId, planStatus='active'
      break

    case 'customer.subscription.updated':
      // Sync plan changes (upgrade/downgrade)
      // Update planStatus based on subscription.status
      break

    case 'customer.subscription.deleted':
      // Downgrade to free plan
      // Update planStatus='cancelled'
      break

    case 'invoice.payment_failed':
      // Set planStatus='past_due'
      // Optionally notify user via email/WhatsApp
      break

    case 'customer.subscription.trial_will_end':
      // Send upgrade reminder (3 days before trial ends)
      break
  }

  return new Response('ok', { status: 200 })
}
```

### 5.5 Stripe Customer Creation

On workspace creation (`generateWorkspace`), create Stripe Customer:

```typescript
const customer = await stripe.customers.create({
  email: user.email,
  name: user.clinicName,
  metadata: { workspaceId: workspace.id },
})
await db.workspace.update({
  where: { id: workspace.id },
  data: { stripeCustomerId: customer.id },
})
```

### 5.6 Idempotency

Option A (simple): Check `event.id` hasn't been processed before using a DB lookup.
Option B (simpler for MVP): Make webhook handler idempotent by design — always set the final state, don't toggle.

---

## 6. UI Changes

### 6.1 Billing Settings Page

**File:** `src/app/(dashboard)/settings/billing/page.tsx`

**Current Plan Card:**
- Plan name + badge (Free / Pro / Enterprise)
- Status badge (active / trial / past_due / cancelled)
- Trial countdown if applicable ("Seu trial termina em X dias")
- Current usage vs limits (patients, appointments, agendas)

**Actions:**
- "Fazer Upgrade" button → `createCheckoutSession(planKey)` → redirect to Stripe
- "Gerenciar Assinatura" button → `createPortalSession()` → redirect to Stripe Portal
  - Handles: change plan, update payment method, view invoices, cancel

**Plan Comparison Table:**
- Show all tiers with features and pricing
- Highlight current plan
- CTA buttons for upgrade

### 6.2 Upgrade Prompts

When plan enforcement blocks an action (e.g., patient limit reached), show:
- Banner: "Voce atingiu o limite de X do plano Free. Faca upgrade para continuar."
- Link to billing settings page

This already partially exists in plan enforcement — just needs the link to the billing page.

### 6.3 Admin Dashboard — MRR

Extend `getAdminDashboard()`:
- **MRR card:** Sum of active subscription amounts (query Stripe API or calculate from workspace plans)
- **Plan distribution chart:** Already exists, just ensure it's accurate
- **Churn rate:** Cancelled subscriptions / total subscriptions per month
- **Trial conversion rate:** Converted trials / expired trials

### 6.4 Trial Flow

1. On onboarding completion, workspace starts with `plan: 'pro'` and `trialEndsAt: now + 14 days`
2. Stripe subscription created with `trial_period_days: 14`
3. 3 days before trial ends: `customer.subscription.trial_will_end` webhook fires → send reminder
4. If trial expires without payment: Stripe fires `customer.subscription.updated` with `status: 'past_due'` or `'canceled'` → webhook downgrades to free

---

## 7. Plan Transition Logic

```
Free → Pro:     createCheckoutSession('pro')
Free → Enterprise: createCheckoutSession('enterprise')
Pro → Enterprise:  Customer Portal (upgrade) or createCheckoutSession('enterprise')
Enterprise → Pro:  Customer Portal (downgrade)
Any → Free:        Customer Portal (cancel) → webhook sets plan='free'
```

**On downgrade:** Plan enforcement naturally handles it. If a Pro workspace with 200 patients downgrades to Free (limit 50), existing data is preserved but new patients cannot be added until under the limit.

---

## 8. Implementation Order

1. `npm install stripe` + add env vars to `src/lib/env.ts`
2. Create `src/lib/stripe.ts` (client initialization)
3. Create Stripe Products + Prices in Stripe Dashboard
4. Create `src/server/actions/billing.ts` (checkout, portal, billing info)
5. Create `src/app/api/webhooks/stripe/route.ts` (webhook handler)
6. Modify `src/server/actions/workspace.ts` — create Stripe Customer on workspace creation
7. Create `src/app/(dashboard)/settings/billing/page.tsx` (billing UI)
8. Add upgrade prompt links in plan enforcement error messages
9. Configure Stripe Customer Portal in Stripe Dashboard
10. Set up trial flow (14-day trial on new workspaces)
11. Admin MRR tracking

---

## 9. Dependencies

- **New npm package:** `stripe` (~50KB)
- **Stripe account** with Brazilian entity (for BRL billing, PIX, boleto)
- **Stripe Dashboard config:** Products, Prices, Customer Portal settings, Webhook endpoint
- **No Prisma schema changes needed** — all fields already exist (`stripeCustomerId`, `stripeSubId`, `plan`, `planStatus`, `trialEndsAt`)

---

## 10. Testing Strategy

- **Stripe test mode:** Use `sk_test_*` keys for development
- **Stripe CLI:** `stripe listen --forward-to localhost:3000/api/webhooks/stripe` for local webhook testing
- **Test cards:** `4242424242424242` (success), `4000000000000341` (payment fails)
- **Test PIX:** Stripe provides test PIX flows in test mode

---

## 11. Security Considerations

- `STRIPE_SECRET_KEY` server-side only (never in `NEXT_PUBLIC_*`)
- Webhook signature verification via `stripe.webhooks.constructEvent()`
- No PCI data touches our server (Stripe Checkout handles it)
- Customer Portal handles sensitive payment method changes
- All billing mutations go through Stripe → webhook → DB (never direct)

---

## 12. Future Enhancements (Post-MVP)

- **Metered billing:** Report usage to Stripe Meters API for overage charges (e.g., extra recordings beyond plan limit)
- **Annual billing:** Discounted annual plans
- **Coupons/promotions:** Stripe Coupons for launch promotions
- **Invoice customization:** Custom invoice fields (CNPJ, etc.) for Brazilian compliance
- **Embedded Checkout:** Keep users on-site instead of redirecting to Stripe
- **Stripe Pricing Table:** No-code embed replacing the static pricing section

---

## 13. References

- [Stripe + Next.js Complete Guide 2025](https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/)
- [Stripe Subscription Lifecycle in Next.js 2026](https://dev.to/thekarlesi/stripe-subscription-lifecycle-in-nextjs-the-complete-developer-guide-2026-4l9d)
- [Stripe Embeddable Pricing Table](https://docs.stripe.com/payments/checkout/pricing-table)
- [Stripe Customer Portal](https://docs.stripe.com/no-code/customer-portal)
- [Stripe PIX Payments](https://docs.stripe.com/payments/pix)
- [Stripe Boleto Payments](https://docs.stripe.com/payments/boleto)
- [Stripe Webhook Signature Verification](https://docs.stripe.com/webhooks/signature)
