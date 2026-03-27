# [f04] Contas a Receber — Implementation Document

> **Issue:** [#13](https://github.com/vox-clinic/vox-clinic/issues/13)
> **Priority:** Essential | **Effort:** High | **Milestone:** MVP
> **Description:** Registro de pagamentos, parcelas, pendencias.

---

## 1. Problem Statement

Today VoxClinic tracks revenue only via `Appointment.price` (a flat Float). There is no way to:
- Track individual payments or partial payments
- Split charges into installments (parcelas)
- Record payment method (PIX, cash, card, etc.)
- See what is overdue or pending
- View a patient's financial balance

Clinics need bookkeeping to know **who owes what, when, and how they paid**.

---

## 2. How Modern Clinic Systems Solve This

Clinicorp, Simples Dental, iClinic, and ZenFisio all follow the same pattern:

```
Appointment (or TreatmentPlan)
  -> Charge (conta a receber: totalAmount, discount, status)
    -> Payment[] (parcela: dueDate, amount, status, paymentMethod, paidAt)
```

Key features across all platforms:
- **Multiple payment methods per charge** — each installment can use a different method
- **Status tracking** — pendente, pago, vencido, cancelado, estornado
- **Patient financial profile** — total spent, outstanding balance, payment history
- **Dashboard KPIs** — overdue amount, receivables by period, inadimplencia rate

---

## 3. Current System State

### What We Already Have
| Asset | Location | Notes |
|-------|----------|-------|
| `Appointment.price` | Prisma schema | Float, single price per appointment |
| `/financial` page | `src/app/(dashboard)/financial/page.tsx` | Revenue summary, procedure breakdown, monthly chart |
| `getFinancialData()` | `src/server/actions/financial.ts` | Sums `appointment.price` for revenue |
| `updateAppointmentPrice()` | `src/server/actions/financial.ts` | Updates price on appointment |
| Receipt printing | `src/server/actions/receipt.ts` | Ctrl+P to PDF |
| Procedure pricing | `Workspace.procedures` (JSONB) | `price?: number` per procedure |

### What's Missing
- No `Charge` / `Payment` models
- No installment splitting logic
- No payment status tracking
- No overdue detection
- No patient balance view

---

## 4. Proposed Data Model

### 4.1 Charge (Conta a Receber)

```prisma
model Charge {
  id               String        @id @default(cuid())
  workspaceId      String
  workspace        Workspace     @relation(fields: [workspaceId], references: [id])
  patientId        String
  patient          Patient       @relation(fields: [patientId], references: [id])
  appointmentId    String?
  appointment      Appointment?  @relation(fields: [appointmentId], references: [id])
  treatmentPlanId  String?
  treatmentPlan    TreatmentPlan? @relation(fields: [treatmentPlanId], references: [id])

  description      String        // auto-filled from procedures
  totalAmount      Int           // in centavos (R$ 150,00 = 15000)
  discount         Int           @default(0)
  netAmount        Int           // totalAmount - discount
  status           String        @default("pending") // pending | partial | paid | overdue | cancelled

  createdBy        String        // clerkId
  notes            String?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  payments         Payment[]

  @@index([workspaceId, status])
  @@index([workspaceId, patientId])
  @@index([workspaceId, createdAt])
}
```

### 4.2 Payment (Parcela / Pagamento)

```prisma
model Payment {
  id                 String   @id @default(cuid())
  chargeId           String
  charge             Charge   @relation(fields: [chargeId], references: [id], onDelete: Cascade)
  workspaceId        String
  workspace          Workspace @relation(fields: [workspaceId], references: [id])

  installmentNumber  Int      @default(1)
  totalInstallments  Int      @default(1)
  amount             Int      // in centavos
  dueDate            DateTime
  paidAt             DateTime?
  paidAmount         Int?     // actual amount paid (may differ from amount)
  paymentMethod      String?  // dinheiro | pix | credito | debito | boleto | convenio | transferencia | outro
  status             String   @default("pending") // pending | paid | overdue | cancelled | refunded

  notes              String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([chargeId])
  @@index([workspaceId, dueDate, status])
  @@index([workspaceId, status])
}
```

### 4.3 Why Centavos (Int) Instead of Float

Float arithmetic causes rounding errors (`0.1 + 0.2 !== 0.3`). Storing amounts as integers in centavos is the standard for financial systems. Display conversion: `(amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`.

---

## 5. Server Actions

**File:** `src/server/actions/receivable.ts`

| Action | Description |
|--------|-------------|
| `createCharge(data)` | Creates Charge + Payment[] in `$transaction`. Auto-calculates installment amounts and due dates (monthly). |
| `recordPayment(paymentId, paidAmount, method, paidAt)` | Marks installment as paid. Updates parent Charge status (partial/paid) inside `$transaction`. |
| `getCharges(filters)` | List charges with filters: status, patientId, dateRange. Includes payments. Paginated. |
| `getCharge(chargeId)` | Single charge with all payments. |
| `getPatientBalance(patientId)` | Sum of pending/overdue payments for a patient. |
| `getReceivablesSummary(period)` | KPIs: total pending, total overdue, received this month, inadimplencia rate. |
| `cancelCharge(chargeId)` | Cancels charge and all pending payments in `$transaction`. |
| `updateOverdueStatuses()` | Batch update: payments where `dueDate < now()` and `status = pending` -> `overdue`. Update parent charge accordingly. |

### Installment Splitting Logic

```typescript
function splitInstallments(netAmount: number, count: number, startDate: Date): { amount: number; dueDate: Date }[] {
  const base = Math.floor(netAmount / count)
  const remainder = netAmount - (base * count)
  return Array.from({ length: count }, (_, i) => ({
    amount: base + (i === 0 ? remainder : 0), // first installment absorbs remainder
    dueDate: addMonths(startDate, i),
  }))
}
```

---

## 6. UI Changes

### 6.1 Enhance `/financial` Page — Add Tabs

```
[Resumo] [Contas a Receber] [Tabela de Precos]
```

- **Resumo** — Current dashboard (revenue, charts, monthly breakdown)
- **Contas a Receber** — New receivables list (see 6.2)
- **Tabela de Precos** — Move existing pricing table to its own tab

### 6.2 Receivables List (New)

- **Filters:** Status (pendente/pago/vencido), Patient search, Date range
- **Table columns:** Patient, Description, Total, Paid, Remaining, Status, Due Date, Actions
- **Actions:** "Registrar Pagamento" button opens dialog
- **Status badges:** `pendente` (yellow), `pago` (green), `vencido` (red), `parcial` (blue)

### 6.3 Register Payment Dialog

- Select payment method (dropdown: Dinheiro, PIX, Cartao Credito, Cartao Debito, Boleto, Convenio, Transferencia)
- Amount (pre-filled with installment amount, editable for partial)
- Date (pre-filled with today)
- Notes (optional)

### 6.4 New Charge Dialog

- **Link to:** Patient (required) + Appointment (optional) + Treatment Plan (optional)
- **Total amount:** Pre-filled from appointment price or manual entry
- **Discount:** Optional, absolute value in R$
- **Installments:** 1-24x, auto-calculates parcela values
- **First due date:** Defaults to today
- **Auto-create on appointment completion:** When an appointment status changes to `completed`, prompt to create a charge (or auto-create if `appointment.price` is set)

### 6.5 Patient Detail — "Financeiro" Tab

Add a new tab on `/patients/[id]` showing:
- Outstanding balance (prominent)
- List of charges with payment status
- Payment history

### 6.6 Dashboard Integration

Add to `/dashboard` stats or `/financial` resumo:
- **A Receber (pendente):** Sum of pending payments
- **Vencido:** Sum of overdue payments
- **Recebido este mes:** Sum of paid payments this month

---

## 7. Integration Points

### 7.1 Appointment -> Charge Flow

When `updateAppointmentStatus(id, 'completed')` is called and the appointment has a price:
1. Check if a Charge already exists for this appointment
2. If not, show a prompt/toast: "Deseja registrar o pagamento de R$ X?"
3. Create Charge with 1 installment (simplest path), or open the full dialog

### 7.2 Treatment Plan -> Charge Flow

Treatment plans with associated costs can generate charges. This is optional for MVP.

### 7.3 Overdue Detection

Two approaches (choose one):
- **Cron job** (`/api/receivables/overdue`): Runs daily, updates statuses, optionally sends notifications
- **On-read update**: When fetching charges, update overdue status inline

**Recommendation for MVP:** On-read update (simpler, no new cron). Add cron later for notifications.

### 7.4 Reports Integration

Update `getFinancialData()` and `getReportsData()` to use actual payment data instead of just `appointment.price`:
- Revenue = sum of `Payment.paidAmount` where `status = paid`
- Receivables = sum of `Payment.amount` where `status = pending or overdue`

---

## 8. Future Enhancements (Post-MVP)

- **Asaas API integration** — Auto-generate PIX QR codes and boletos for patients
- **Payment links** — Send payment link via WhatsApp
- **Automated overdue reminders** — WhatsApp/email when payment is overdue
- **Contas a Pagar** — Expense tracking (rent, supplies, salaries) for full cash flow
- **Financial reports** — Aging report, DRE (income statement), cash flow projection

---

## 9. Implementation Order

1. Prisma schema: Add `Charge` and `Payment` models, run migration
2. Server actions: `createCharge`, `recordPayment`, `getCharges`, `getPatientBalance`
3. Receivables list page (tab on `/financial`)
4. New Charge dialog + Register Payment dialog
5. Patient detail "Financeiro" tab
6. Dashboard KPIs
7. Auto-prompt on appointment completion
8. Update existing reports to use payment data

---

## 10. Dependencies

- **None external** — Pure Prisma + Server Actions + existing UI components
- **shadcn components needed:** Tabs (may already exist), Badge, Dialog (existing)
- **No new npm packages** for MVP

---

## 11. References

- [Clinicorp - Gestao Financeira CliniPay](https://www.clinicorp.com/gestao-financeira-clinipay)
- [Simples Dental - Financeiro: Controle Total](https://www.simplesdental.com/blog/financeiro-do-simples-dental/)
- [ZenFisio - Controle Financeiro](https://www.zenfisio.com/recursos/controle-financeiro)
- [Asaas - API de Pagamentos](https://www.asaas.com/api-de-pagamentos) (future integration)
