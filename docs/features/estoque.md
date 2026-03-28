# Controle de Estoque (Inventory Control)

> Feature doc for inventory management of supplies, materials, and medications in VoxClinic.

## Overview

Healthcare clinics consume physical supplies (insumos), materials, and medications during procedures. Currently VoxClinic tracks revenue and expenses but has no visibility into physical stock levels. This feature adds inventory tracking with:

- Registration of items (name, category, unit of measure, cost, minimum stock)
- Stock movements (in = purchase/restock, out = usage/loss/adjustment)
- Low-stock alerts displayed in the dashboard and financial page
- Optional auto-deduction: link workspace procedures to inventory items so that completing an appointment automatically deducts stock
- Reporting: cost of goods consumed per period, top consumed items

### Target users
Dental clinics (resina, anestesico, luvas), aesthetics clinics (botox, acido hialuronico, fios), nutrition clinics (suplementos), medical clinics (medicamentos, insumos de curativo).

## Data Model

### New Prisma Models

```prisma
model InventoryCategory {
  id          String    @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  name        String    // "Medicamentos", "Materiais descartaveis", "Insumos odontologicos"
  icon        String?   // lucide icon name
  color       String?   // hex color
  createdAt   DateTime  @default(now())

  items InventoryItem[]

  @@unique([workspaceId, name])
  @@index([workspaceId])
}

model InventoryItem {
  id           String             @id @default(cuid())
  workspaceId  String
  workspace    Workspace          @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  categoryId   String?
  category     InventoryCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  name         String             // "Resina Composta A2", "Luva P", "Botox 50U"
  sku          String?            // optional internal code
  unit         String             @default("un") // "un", "ml", "g", "cx", "par", "fr"
  currentStock Float              @default(0)
  minStock     Float              @default(0) // alert threshold
  costPerUnit  Int?               // in centavos (R$ 12,50 = 1250)
  supplier     String?            // fornecedor name (free text)
  isActive     Boolean            @default(true)
  notes        String?
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt

  movements InventoryMovement[]

  @@unique([workspaceId, name])
  @@index([workspaceId])
  @@index([workspaceId, isActive])
  @@index([workspaceId, categoryId])
}

model InventoryMovement {
  id            String        @id @default(cuid())
  workspaceId   String
  itemId        String
  item          InventoryItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  type          String        // "in" | "out" | "adjustment"
  quantity      Float         // positive value; sign determined by type
  reason        String        // "compra", "uso_procedimento", "perda", "vencimento", "ajuste_manual", "devolucao"
  appointmentId String?       // link to appointment if auto-deducted
  createdBy     String        // clerkId
  notes         String?
  createdAt     DateTime      @default(now())

  @@index([itemId])
  @@index([workspaceId, createdAt])
  @@index([appointmentId])
}
```

### Workspace Model Changes

Add relations to `Workspace`:
```prisma
  inventoryCategories InventoryCategory[]
  inventoryItems      InventoryItem[]
```

### Procedure-Item Mapping (JSON in Workspace.procedures)

Extend the existing `Procedure` type in `src/types/index.ts`:
```typescript
export interface Procedure {
  id: string
  name: string
  category: string
  price?: number
  duration?: number
  inventoryItems?: { itemId: string; quantity: number }[] // NEW
}
```

This keeps the mapping in the existing JSON column (no new table), consistent with how procedures are stored today.

## UI/UX Design

### Option A (Recommended): New tab in Financial page

Add an "Estoque" tab alongside the existing tabs (`resumo | receivables | expenses | cashflow | nfse | tiss | pricing`). This keeps supply costs next to financial data.

**File:** `src/app/(dashboard)/financial/inventory-tab.tsx`

Tab contents:
1. **Summary cards**: Total items, items below minimum (red badge), total stock value
2. **Item table**: Searchable, filterable by category, sortable columns (name, current stock, min stock, cost, category)
3. **Actions**: Add item, record movement (entrada/saida), edit item, deactivate
4. **Low-stock alert banner**: Shown when any item is below minStock, links to filtered view

### Dialogs

- `create-inventory-item-dialog.tsx` — Form: name, category (combobox + create new), unit (select), currentStock, minStock, costPerUnit, supplier, notes
- `record-movement-dialog.tsx` — Form: item (combobox search), type (entrada/saida/ajuste), quantity, reason (select), notes
- `edit-inventory-item-dialog.tsx` — Pre-filled edit form
- `inventory-category-dialog.tsx` — CRUD for categories

### Dashboard Integration

In `src/app/(dashboard)/dashboard/page.tsx`, add a warning card when low-stock items exist (similar to how other alert cards work). Gated behind `financial.view` permission.

### Stock Alert Notification

Create `Notification` entries of type `"inventory_low_stock"` via a check that runs when movements are recorded. When `currentStock` drops below `minStock`, create a notification for owner/admin users.

## Integration Points

### Auto-deduction on appointment completion

When `updateAppointmentStatus` transitions to `"completed"`, check if the appointment's procedures have linked `inventoryItems`. If so, create `InventoryMovement` records with `type: "out"`, `reason: "uso_procedimento"`, and `appointmentId`.

**File to modify:** `src/server/actions/appointment.ts` — `updateAppointmentStatus`

This is optional per workspace (controlled by a boolean in workspace settings or simply by whether procedures have inventoryItems configured).

### Expense connection

When recording a stock "in" movement (purchase), optionally create an `Expense` record in the existing cash flow system. This connects procurement costs to the financial module without duplication.

### Reports

Extend `src/server/actions/reports.ts` — `getReportsData` to include:
- Top 10 consumed items per period
- Total inventory cost consumed per period (sum of `out` movements * costPerUnit)

## RBAC Permissions

Add to `src/lib/permissions.ts`:
```typescript
"inventory.view": ["owner", "admin", "doctor", "secretary"],
"inventory.edit": ["owner", "admin"],
```

## Server Actions

**New file:** `src/server/actions/inventory.ts`

| Action | Description |
|---|---|
| `getInventoryItems(search?, categoryId?)` | Paginated list with low-stock flag |
| `getInventoryItem(id)` | Single item with recent movements |
| `createInventoryItem(data)` | Create item, optional initial stock movement |
| `updateInventoryItem(id, data)` | Edit item metadata |
| `deactivateInventoryItem(id)` | Soft delete |
| `recordMovement(data)` | Create movement, update currentStock atomically in $transaction |
| `getMovements(itemId?, period?)` | Movement history with filters |
| `getInventoryCategories()` | List categories |
| `createInventoryCategory(data)` | Create category |
| `getInventorySummary()` | Dashboard summary: total items, low stock count, total value |
| `getLowStockItems()` | Items where currentStock < minStock |

### Critical: Atomic stock updates

All stock mutations must use `$transaction` with optimistic concurrency:
```typescript
await db.$transaction(async (tx) => {
  const item = await tx.inventoryItem.findUniqueOrThrow({ where: { id: itemId } })
  const newStock = type === "in" ? item.currentStock + quantity : item.currentStock - quantity
  if (newStock < 0) throw new ActionError("Estoque insuficiente")
  await tx.inventoryItem.update({ where: { id: itemId }, data: { currentStock: newStock } })
  await tx.inventoryMovement.create({ data: { ... } })
})
```

## Implementation Plan

### Phase 1: Data Layer
1. Add models to `prisma/schema.prisma` (InventoryCategory, InventoryItem, InventoryMovement)
2. Add relations to Workspace model
3. Run `npx prisma db push`
4. Extend `Procedure` type in `src/types/index.ts`

### Phase 2: Server Actions
1. Create `src/server/actions/inventory.ts` with all CRUD + movement actions
2. Add permissions to `src/lib/permissions.ts`
3. Add error constants to `src/lib/error-messages.ts`
4. Add audit logging for stock movements

### Phase 3: UI Components
1. Create `src/app/(dashboard)/financial/inventory-tab.tsx`
2. Create dialog components in same directory
3. Add "Estoque" tab to `src/app/(dashboard)/financial/page.tsx`
4. Add low-stock card to dashboard

### Phase 4: Integration
1. Modify `updateAppointmentStatus` in `src/server/actions/appointment.ts` for auto-deduction
2. Add procedure-item mapping UI in `src/app/(dashboard)/settings/page.tsx` (procedures section)
3. Add inventory summary to reports

## Migration Strategy

- No breaking changes. All new models and fields.
- `currentStock` starts at 0; clinics manually enter initial stock via "adjustment" movement.
- Procedure `inventoryItems` field is optional (undefined = no auto-deduction).
- Feature is visible only when workspace has at least one InventoryItem, or always visible in Financial tab (empty state with CTA to add first item).

## Testing Considerations

- Concurrent stock movements (two appointments completing simultaneously)
- Negative stock prevention
- Movement with deleted item (cascade)
- Auto-deduction when procedure has no mapped items (no-op)
- Large item lists (pagination, search performance)
- Permission gating for secretary vs doctor
