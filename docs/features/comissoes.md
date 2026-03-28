# Comissao / Repasse de Profissionais (Professional Commissions)

> Feature doc for revenue split and commission tracking between clinic and professionals.

## Overview

In multi-professional clinics, revenue from appointments is split between the clinic and the attending professional. Common models:

- **Percentage-based**: Professional receives X% of the procedure price (e.g., doctor gets 50%)
- **Fixed amount**: Professional receives a flat fee per procedure (e.g., R$ 80 per consulta)
- **Mixed**: Different rules per procedure type or per professional
- **Tiered**: Different percentages based on volume (future enhancement)

Currently VoxClinic tracks appointment prices and has team members (WorkspaceMember) but has no way to calculate or report what each professional is owed. This feature adds commission rules, automatic calculation, and a reporting interface.

### Key terms
- **Comissao**: The professional's share of the appointment revenue
- **Repasse**: The act of paying out the commission to the professional
- **Retencao clinica**: The clinic's share (100% - commission%)

## Data Model

### New Prisma Models

```prisma
model CommissionRule {
  id            String    @id @default(cuid())
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  memberId      String?   // null = default rule for all members
  member        WorkspaceMember? @relation(fields: [memberId], references: [id], onDelete: Cascade)
  procedureName String?   // null = applies to all procedures; matches Procedure.name
  type          String    @default("percentage") // "percentage" | "fixed"
  percentage    Float?    // e.g. 50.0 for 50%
  fixedAmount   Int?      // in centavos (R$ 80,00 = 8000)
  priority      Int       @default(0) // higher = more specific (used in rule resolution)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([workspaceId])
  @@index([workspaceId, memberId])
  @@index([workspaceId, procedureName])
}

model CommissionEntry {
  id            String    @id @default(cuid())
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  memberId      String
  member        WorkspaceMember @relation(fields: [memberId], references: [id], onDelete: Cascade)
  appointmentId String
  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  ruleId        String?   // which rule was applied (snapshot for audit)
  procedureName String    // snapshot of procedure at calculation time
  baseAmount    Int       // appointment price portion in centavos
  percentage    Float?    // applied percentage (snapshot)
  fixedAmount   Int?      // applied fixed amount (snapshot)
  amount        Int       // calculated commission in centavos
  status        String    @default("pending") // "pending" | "approved" | "paid" | "cancelled"
  paidAt        DateTime?
  notes         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([appointmentId, memberId, procedureName])
  @@index([workspaceId, memberId])
  @@index([workspaceId, status])
  @@index([workspaceId, createdAt])
  @@index([appointmentId])
}
```

### Model Relationship Additions

**Workspace**: Add `commissionRules CommissionRule[]` and `commissionEntries CommissionEntry[]`
**WorkspaceMember**: Add `commissionRules CommissionRule[]` and `commissionEntries CommissionEntry[]`
**Appointment**: Add `commissionEntries CommissionEntry[]`

### Appointment: Identifying the attending professional

The current `Appointment` model has `agendaId` but no direct `memberId` / `professionalId`. Agendas serve as a proxy for professionals in most clinics (e.g., "Dr. Silva" agenda). Two options:

**Option A (Recommended)**: Add `professionalId String?` to `Appointment` referencing `WorkspaceMember.id`. Pre-fill from agenda mapping (Agenda already has a name like "Dr. Silva"). Allow override at scheduling time.

**Option B**: Infer professional from `agendaId` by mapping Agenda to WorkspaceMember. Less explicit but avoids schema change.

Recommendation: Option A — add `professionalId` to Appointment. Nullable for backward compat.

```prisma
// Addition to Appointment model:
  professionalId String?
  professional   WorkspaceMember? @relation(fields: [professionalId], references: [id], onDelete: SetNull)
```

## Commission Calculation Logic

### Rule Resolution Order (highest priority wins)

1. **Specific rule**: memberId + procedureName match
2. **Member default**: memberId match, procedureName is null
3. **Procedure default**: memberId is null, procedureName match
4. **Global default**: memberId is null, procedureName is null

```typescript
function resolveCommissionRule(
  rules: CommissionRule[],
  memberId: string,
  procedureName: string
): CommissionRule | null {
  // Sort by specificity: both fields > one field > global
  const candidates = rules.filter(r => r.isActive)

  const specific = candidates.find(r => r.memberId === memberId && r.procedureName === procedureName)
  if (specific) return specific

  const memberDefault = candidates.find(r => r.memberId === memberId && !r.procedureName)
  if (memberDefault) return memberDefault

  const procedureDefault = candidates.find(r => !r.memberId && r.procedureName === procedureName)
  if (procedureDefault) return procedureDefault

  const global = candidates.find(r => !r.memberId && !r.procedureName)
  return global ?? null
}
```

### Calculation per appointment

When an appointment is completed (or its price is set/updated):
1. Identify the professional (from `professionalId` or agenda mapping)
2. Get the appointment's procedure names from `procedures` JSON
3. Split price evenly across procedures (same logic as `getFinancialData` in `src/server/actions/financial.ts`)
4. For each procedure, resolve the commission rule and calculate the amount
5. Upsert `CommissionEntry` records

Calculation trigger: After `updateAppointmentStatus("completed")` or `updateAppointmentPrice()`.

## UI/UX Design

### Settings: Commission Rules

**Location:** New section in Settings page or a sub-tab within Team settings
**File:** `src/app/(dashboard)/settings/sections/comissoes-section.tsx`

- Table of rules: member name (or "Todos"), procedure (or "Todos"), type, percentage/value
- Add rule button → dialog with: member select (optional), procedure select (optional), type toggle, percentage or fixed amount input
- Edit/delete existing rules
- "Regra padrao" badge for global rules

### Financial: Commissions Tab

**File:** `src/app/(dashboard)/financial/commissions-tab.tsx`

Add "Comissoes" tab to the financial page alongside existing tabs.

Contents:
1. **Period selector** (same as existing month/year)
2. **Summary cards**: Total commissions pending, total paid, clinic retention
3. **Per-professional breakdown table**: Member name, total appointments, gross revenue, commission amount, status (pending/paid)
4. **Expandable rows**: Click a professional to see individual appointment entries
5. **Bulk actions**: "Marcar como pago" for selected entries, with date picker for paidAt
6. **Export**: Excel export of commission report

### Appointment Card Enhancement

In `src/app/(dashboard)/calendar/components/appointment-card.tsx`, show the assigned professional badge (if set). In the schedule form, add optional professional selector.

## Integration Points

### With Financial Module (Receivables)

Commission entries relate to the same appointments that generate `Charge` records. The commission report uses appointment prices (same source of truth). No duplication — commissions are a _view_ over existing revenue data with applied rules.

### With Team Module

Commission rules reference `WorkspaceMember.id`. When a member is removed, cascade delete their rules and entries. When a member is added, they inherit the global default rule.

### With Appointment Flow

- `scheduleAppointment` / `scheduleForm`: Add optional `professionalId` field
- `updateAppointmentStatus`: Trigger commission calculation on "completed"
- `updateAppointmentPrice`: Recalculate commission entries for that appointment

### With Reports

Extend `getReportsData` to include per-professional revenue attribution.

## RBAC Permissions

Add to `src/lib/permissions.ts`:
```typescript
"commissions.view": ["owner", "admin"],
"commissions.edit": ["owner", "admin"],
"commissions.view_own": ["owner", "admin", "doctor"], // professional sees their own
```

Doctors can see their own commission summary but not other professionals' data. Owner/admin sees all.

## Server Actions

**New file:** `src/server/actions/commission.ts`

| Action | Description |
|---|---|
| `getCommissionRules()` | All rules for workspace |
| `createCommissionRule(data)` | Create rule with uniqueness validation |
| `updateCommissionRule(id, data)` | Edit rule |
| `deleteCommissionRule(id)` | Delete rule |
| `calculateCommissions(appointmentId)` | Calculate and upsert entries for an appointment |
| `recalculateAllCommissions(period)` | Batch recalculate for a date range (after rule change) |
| `getCommissionReport(period, memberId?)` | Aggregated report data |
| `getCommissionEntries(filters)` | Paginated list with filters |
| `markCommissionsPaid(entryIds[], paidAt)` | Bulk update status to "paid" |

## Implementation Plan

### Phase 1: Data Layer
1. Add `CommissionRule` and `CommissionEntry` to `prisma/schema.prisma`
2. Add `professionalId` to `Appointment` model
3. Add relations to Workspace, WorkspaceMember, Appointment
4. Run `npx prisma db push`

### Phase 2: Server Actions
1. Create `src/server/actions/commission.ts`
2. Add commission calculation to `updateAppointmentStatus` in `src/server/actions/appointment.ts`
3. Add commission recalculation to `updateAppointmentPrice` in `src/server/actions/financial.ts`
4. Add permissions to `src/lib/permissions.ts`
5. Add error constants to `src/lib/error-messages.ts`

### Phase 3: UI — Settings
1. Create `src/app/(dashboard)/settings/sections/comissoes-section.tsx`
2. Add tab/section to settings page
3. Rule CRUD dialogs

### Phase 4: UI — Financial Tab
1. Create `src/app/(dashboard)/financial/commissions-tab.tsx`
2. Add "Comissoes" tab to `src/app/(dashboard)/financial/page.tsx`
3. Per-professional report with expand/collapse
4. Bulk "mark as paid" flow

### Phase 5: Integration
1. Add professional selector to `src/app/(dashboard)/calendar/components/schedule-form.tsx`
2. Map agendas to members (optional, in settings)
3. Add commission data to reports and Excel export

## Migration Strategy

- All new fields and models. No breaking changes.
- `professionalId` on Appointment is nullable. Existing appointments won't have commissions until price is updated or status is re-completed.
- Clinics must create at least one CommissionRule before the feature activates. Empty state shows setup prompt.
- Backfill: Provide a "recalculate period" button for owner/admin to generate entries for past appointments.

## Testing Considerations

- Rule resolution priority (specific > member > procedure > global)
- Appointment with no price (commission = 0)
- Appointment with multiple procedures and different rules per procedure
- Member removal cascading to entries
- Concurrent commission calculation (two appointments completing)
- Doctor viewing only their own commissions (RBAC enforcement)
- Rule change → recalculation of affected period
