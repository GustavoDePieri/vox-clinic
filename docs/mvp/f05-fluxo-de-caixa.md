# [f05] Fluxo de Caixa — Implementation Document

> **Issue:** [#14](https://github.com/vox-clinic/vox-clinic/issues/14)
> **Priority:** Essential | **Effort:** High | **Milestone:** MVP
> **Description:** Visao diaria/mensal de entradas e saidas.

---

## 1. Problem Statement

VoxClinic currently tracks revenue only via `Appointment.price`. There is:
- No expense tracking at all
- No concept of cash inflows vs outflows
- No daily/monthly cash flow view
- No projected vs realized comparison
- No recurring expense management

Clinics need to see "how much money came in, how much went out, and what's the balance" — daily and monthly.

---

## 2. How Modern Clinic Systems Solve This

Brazilian clinic software (Clinicorp, Simples Dental, NetDente, App Health) universally implement:

- **Fluxo de caixa realizado:** Daily/monthly view of actual payments received and expenses paid, with running balance
- **Fluxo de caixa projetado:** Forward-looking view based on scheduled appointments + recurring expenses + known future payments
- **DRE (Demonstrativo de Resultados):** Monthly income statement (Revenue - Expenses = Net Income)
- **Categories:** Hierarchical expense/income categories (custos fixos, custos variaveis, receitas)

---

## 3. Current System State

### What We Already Have
| Asset | Location | Notes |
|-------|----------|-------|
| `Appointment.price` | Prisma schema | Float, only income source |
| `/financial` page | `src/app/(dashboard)/financial/page.tsx` | Revenue stats, procedure breakdown, monthly chart |
| `getFinancialData()` | `src/server/actions/financial.ts` | Sums appointment prices |
| Reports page | `src/app/(dashboard)/reports/page.tsx` | Recharts charts (BarChart, LineChart, PieChart) |
| Recharts | `package.json` | `recharts@^3.8.1` already installed |
| xlsx export | `src/lib/export-xlsx.ts` | Already supports multi-sheet Excel export |

### What's Missing
- No expense model or tracking
- No expense categories
- No cash flow view (inflows vs outflows)
- No projections/forecasting
- No recurring expense management

---

## 4. Dependency on #13 (Contas a Receber)

This feature **depends heavily on #13 Contas a Receber**. The Charge/Payment models from f04 provide the **inflow** side of cash flow. This document covers the **outflow** (expenses) side and the **combined view**.

**Recommended build order:** f04 first (or simultaneously), then f05 adds the expense side + combined cash flow view.

---

## 5. Proposed Data Model

### 5.1 Expense (Despesa)

```prisma
model Expense {
  id            String    @id @default(cuid())
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id])
  categoryId    String?
  category      ExpenseCategory? @relation(fields: [categoryId], references: [id])

  description   String
  amount        Int       // in centavos (consistent with Charge/Payment from f04)
  dueDate       DateTime
  paidAt        DateTime?
  paidAmount    Int?
  paymentMethod String?   // dinheiro | pix | credito | debito | boleto | transferencia | outro
  status        String    @default("pending") // pending | paid | overdue | cancelled

  // Recurrence
  recurrence    String?   // null | monthly | weekly | yearly
  recurrenceEnd DateTime?
  parentId      String?   // links to original expense if generated from recurrence
  parent        Expense?  @relation("ExpenseRecurrence", fields: [parentId], references: [id])
  children      Expense[] @relation("ExpenseRecurrence")

  notes         String?
  createdBy     String    // clerkId
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([workspaceId, dueDate])
  @@index([workspaceId, status])
  @@index([workspaceId, categoryId])
}
```

### 5.2 ExpenseCategory

```prisma
model ExpenseCategory {
  id          String    @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  name        String    // "Aluguel", "Material", "Salarios", "Marketing", etc.
  icon        String?   // lucide icon name
  color       String?   // hex color for charts
  isDefault   Boolean   @default(false)
  createdAt   DateTime  @default(now())

  expenses    Expense[]

  @@unique([workspaceId, name])
  @@index([workspaceId])
}
```

### 5.3 Default Categories (seeded on workspace creation)

| Category | Icon | Color |
|----------|------|-------|
| Aluguel | `building` | `#6366F1` |
| Material e Insumos | `package` | `#F59E0B` |
| Salarios e Encargos | `users` | `#EF4444` |
| Equipamentos | `wrench` | `#8B5CF6` |
| Marketing | `megaphone` | `#EC4899` |
| Servicos (contabilidade, TI) | `briefcase` | `#06B6D4` |
| Impostos e Taxas | `landmark` | `#64748B` |
| Outros | `circle-dot` | `#94A3B8` |

---

## 6. Server Actions

**File:** `src/server/actions/expense.ts`

| Action | Description |
|--------|-------------|
| `createExpense(data)` | Creates expense. If `recurrence` is set, generates future instances (up to 12 months). |
| `updateExpense(id, data)` | Updates single expense. |
| `deleteExpense(id)` | Deletes expense (and optionally future recurrences). |
| `payExpense(id, paidAmount, method, paidAt)` | Marks as paid. |
| `getExpenses(filters)` | List with filters: status, categoryId, dateRange. Paginated. |
| `getExpenseCategories()` | List categories for workspace. |
| `createExpenseCategory(data)` | Custom category. |
| `seedDefaultCategories(workspaceId)` | Called on workspace creation. |

**File:** `src/server/actions/cashflow.ts`

| Action | Description |
|--------|-------------|
| `getCashFlowData(period, date)` | Combines inflows (from Payments in f04) + outflows (from Expenses), grouped by day/month. Returns: entries[], totals, running balance. |
| `getCashFlowProjection(months)` | Projects future: scheduled appointments with prices + recurring expenses. Returns projected balance per month. |
| `getCashFlowSummary()` | KPIs: current balance, income this month, expenses this month, net this month, projected next month. |

### Cash Flow Calculation Logic

```typescript
// For a given period (month):
const inflows = await getPayments({ status: 'paid', paidAt: within(period) })
const outflows = await getExpenses({ status: 'paid', paidAt: within(period) })

const totalIn = sum(inflows.map(p => p.paidAmount))
const totalOut = sum(outflows.map(e => e.paidAmount))
const net = totalIn - totalOut

// Running balance: cumulative net from workspace start
```

---

## 7. UI Changes

### 7.1 Extend `/financial` Page — Add Tabs

```
[Resumo] [Contas a Receber] [Despesas] [Fluxo de Caixa] [Tabela de Precos]
```

### 7.2 Cash Flow Page (New Tab)

**KPI Cards (top row):**
- Saldo Atual (green if positive, red if negative)
- Entradas do Mes (green)
- Saidas do Mes (red)
- Projecao Prox. 30 Dias (blue)

**Main Chart: Stacked Bar + Line**
Using Recharts (already installed):
- Green bars: inflows (payments received)
- Red bars: outflows (expenses paid)
- Line overlay: cumulative running balance
- Toggle: Daily (current month) / Monthly (current year)

**Secondary Chart: Projected vs Realized**
- Solid line: realized cash flow
- Dashed line: projected cash flow
- Useful for comparing expectations vs reality

**Transaction List Below:**
- Combined chronological list of inflows + outflows
- Color-coded: green for income, red for expense
- Filterable by type, category, date range

### 7.3 Expenses Tab (New)

- **Expense list:** Table with description, category, amount, due date, status, payment method
- **Quick add button:** Opens dialog for new expense
- **Recurring badge:** Shows recurrence pattern
- **Bulk actions:** Mark as paid, delete

### 7.4 Add Expense Dialog

- Description (text)
- Amount (R$ input)
- Category (dropdown with color dots)
- Due date
- Recurrence (none / monthly / weekly / yearly)
- Payment method (optional, for immediate payment)
- Notes

### 7.5 Dashboard Integration

Add to `/dashboard` or `/financial` resumo:
- **Fluxo de Caixa Mini-Chart:** Small sparkline showing last 7 days net cash flow

---

## 8. Automation

### 8.1 Recurring Expense Generation

When a recurring expense is created:
1. Generate instances for the next 12 months (or until `recurrenceEnd`)
2. Each instance links to `parentId` for grouped management
3. "Delete all future" option available

### 8.2 Overdue Detection

Same pattern as f04: on-read status update for MVP. When fetching expenses, mark as `overdue` if `dueDate < now()` and `status = pending`.

### 8.3 Auto-Income from Appointments

When a payment is recorded in f04 (Contas a Receber), it automatically appears as an inflow in the cash flow view. No duplication — the cash flow view queries both Payment and Expense tables.

---

## 9. Charts Implementation

All using Recharts (already in the project):

```tsx
// Stacked bar chart for cash flow
<BarChart data={monthlyData}>
  <Bar dataKey="inflows" fill="#10B981" stackId="a" name="Entradas" />
  <Bar dataKey="outflows" fill="#EF4444" stackId="b" name="Saidas" />
  <Line dataKey="balance" stroke="#14B8A6" name="Saldo" />
</BarChart>

// Category breakdown pie chart for expenses
<PieChart>
  <Pie data={categoryData} dataKey="amount" nameKey="name" />
</PieChart>
```

---

## 10. Excel Export

Extend existing export infrastructure (`src/lib/export-xlsx.ts`):
- **Fluxo de Caixa** sheet: Date, Type (Entrada/Saida), Description, Category, Amount, Balance
- **Resumo Mensal** sheet: Month, Total Entradas, Total Saidas, Saldo
- **Despesas por Categoria** sheet: Category, Total, % of total

---

## 11. Implementation Order

1. Prisma schema: Add `Expense` and `ExpenseCategory` models, run migration
2. Seed default categories in workspace creation flow
3. Server actions: `createExpense`, `payExpense`, `getExpenses`, `getExpenseCategories`
4. Expenses list tab on `/financial`
5. Add Expense dialog
6. Server actions: `getCashFlowData`, `getCashFlowSummary`
7. Cash Flow tab with charts (Recharts)
8. Cash flow projection logic
9. Recurring expense generation
10. Excel export for cash flow

---

## 12. Dependencies

- **#13 (f04) Contas a Receber** — Required for the inflow side of cash flow. Build first or simultaneously.
- **No new npm packages** — Recharts and xlsx already installed.
- **shadcn components:** Tabs, Badge, Dialog (all likely already available).

---

## 13. Future Enhancements (Post-MVP)

- **DRE (Income Statement):** Formal accounting report (Receitas - Custos = Lucro)
- **AI insights:** Claude analyzing cash flow trends and generating narrative summaries
- **Budget vs actual:** Set monthly budgets per category, compare against actual
- **Bank integration:** Auto-import transactions from bank (Open Finance / Belvo API)
- **Expense receipt upload:** Photo of receipts attached to expenses

---

## 14. References

- [Clinicorp - Controle de fluxo de caixa](https://www.clinicorp.com/post/controle-de-fluxo-de-caixa)
- [Simples Dental - Planilha de fluxo de caixa](https://conteudo.simplesdental.com/planilha-de-fluxo-de-caixa-odontologico)
- [Cash Flow Forecasting Guide - Shopify](https://www.shopify.com/ca/blog/cash-flow-forecasting)
- [Prontuario Verde - Fluxo de Caixa: 5 passos](https://prontuarioverde.com.br/blog/odontologia/fluxo-de-caixa/)
