# Lista de Espera (Waitlist)

> Feature doc for patient waitlist management when no appointment slots are available.

## Overview

When a clinic is fully booked, patients who want an appointment have no way to express interest in a future slot. This feature adds a waitlist system where:

- Patients are added to the waitlist with preferences (days, times, procedures, agenda)
- When a slot opens (appointment cancelled or no-show), the system identifies matching waitlisted patients
- Clinic staff are notified of matches and can contact patients
- Optionally, patients are notified directly via WhatsApp or email
- Priority ordering ensures urgent or long-waiting patients are contacted first

### Use cases
1. Clinic receptionist adds patient to waitlist when no slots available
2. Patient submits waitlist request via public booking page (when slots are full)
3. Appointment is cancelled → system finds matching waitlisted patients → notification to staff
4. Staff contacts patient → schedules appointment → removes from waitlist

## Data Model

### New Prisma Model

```prisma
model WaitlistEntry {
  id            String    @id @default(cuid())
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  patientId     String
  patient       Patient   @relation(fields: [patientId], references: [id], onDelete: Cascade)
  agendaId      String?   // preferred agenda (null = any)
  agenda        Agenda?   @relation(fields: [agendaId], references: [id], onDelete: SetNull)
  procedureName String?   // preferred procedure (matches Procedure.name)

  // Preferences
  preferredDays  String[] @default([]) // ["seg", "ter", "qua", "qui", "sex", "sab"] or empty = any
  preferredTimeStart String? // "08:00" — earliest acceptable time (null = any)
  preferredTimeEnd   String? // "12:00" — latest acceptable time (null = any)

  // Priority and lifecycle
  priority      Int       @default(0) // 0=normal, 1=high, 2=urgent
  status        String    @default("waiting") // "waiting" | "notified" | "scheduled" | "expired" | "cancelled"
  notes         String?

  // Notification tracking
  notifiedAt    DateTime? // when patient was last notified of available slot
  notifiedVia   String?   // "whatsapp" | "email" | "phone" (manual)
  scheduledAppointmentId String? // filled when patient is actually scheduled

  // Metadata
  createdBy     String    // clerkId of staff who added
  expiresAt     DateTime? // optional auto-expiry (e.g., 30 days from creation)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([workspaceId, status])
  @@index([workspaceId, agendaId, status])
  @@index([workspaceId, patientId])
  @@index([workspaceId, priority, createdAt])
}
```

### Model Relationship Additions

**Workspace**: Add `waitlistEntries WaitlistEntry[]`
**Patient**: Add `waitlistEntries WaitlistEntry[]`
**Agenda**: Add `waitlistEntries WaitlistEntry[]`

## Slot Matching Algorithm

When an appointment is cancelled (status → "cancelled") or marked no-show:

```typescript
async function findMatchingWaitlistEntries(
  workspaceId: string,
  cancelledDate: Date,
  agendaId: string,
): Promise<WaitlistEntry[]> {
  const dayOfWeek = getDayAbbr(cancelledDate) // "seg", "ter", etc.
  const timeStr = formatTime(cancelledDate)     // "14:30"

  const candidates = await db.waitlistEntry.findMany({
    where: {
      workspaceId,
      status: "waiting",
      OR: [
        { agendaId: null },  // any agenda
        { agendaId },         // matches specific agenda
      ],
    },
    include: { patient: { select: { id: true, name: true, phone: true, email: true } } },
    orderBy: [
      { priority: "desc" },
      { createdAt: "asc" },  // FIFO within same priority
    ],
  })

  return candidates.filter(entry => {
    // Day preference check
    if (entry.preferredDays.length > 0 && !entry.preferredDays.includes(dayOfWeek)) return false
    // Time preference check
    if (entry.preferredTimeStart && timeStr < entry.preferredTimeStart) return false
    if (entry.preferredTimeEnd && timeStr > entry.preferredTimeEnd) return false
    return true
  })
}
```

## UI/UX Design

### Calendar Page: Waitlist Sidebar Panel

**File:** `src/app/(dashboard)/calendar/components/waitlist-panel.tsx`

A collapsible side panel (or sheet) accessible from the calendar page header via a "Lista de Espera" button with a badge showing count of waiting entries.

Panel contents:
1. **Count badge** on button: number of active waiting entries
2. **Entry list**: Patient name, preferred days/times, procedure, priority (color-coded), waiting since date
3. **Quick actions**: Schedule (opens schedule form pre-filled), Notify, Remove
4. **Filters**: By agenda, by priority, by procedure
5. **Add to waitlist** button → opens dialog

### Add to Waitlist Dialog

**File:** `src/app/(dashboard)/calendar/components/add-waitlist-dialog.tsx`

Triggered from:
- Calendar waitlist panel ("+" button)
- Schedule form (when conflict is detected, offer "Adicionar a lista de espera?")
- Public booking page (when no slots available)

Fields:
- Patient search (combobox, same pattern as schedule form)
- Agenda preference (optional select)
- Procedure preference (optional select from workspace procedures)
- Preferred days (multi-select checkboxes: Seg, Ter, Qua, Qui, Sex, Sab)
- Preferred time range (two time inputs: start, end)
- Priority (select: Normal, Alta, Urgente)
- Notes (textarea)
- Expiry date (optional date picker)

### Cancellation Flow Enhancement

When a user cancels an appointment via `appointment-card.tsx` status action:
1. After cancellation succeeds, check for matching waitlist entries
2. If matches found, show a toast/dialog: "3 pacientes na lista de espera para este horario. Deseja notifica-los?"
3. If yes, open a quick list showing matched patients with "Notificar" / "Agendar" buttons

### Dashboard Integration

Add a card to dashboard showing waitlist count when entries exist, with a link to the calendar waitlist panel.

### Public Booking Integration

**File:** `src/app/booking/[token]/page.tsx`

When the booking page shows no available slots for the selected date range, offer a "Entrar na lista de espera" option. This creates a WaitlistEntry via a new public API endpoint (no auth, token-based like booking).

**New API:** `src/app/api/booking/waitlist/route.ts` — POST to add to waitlist from public booking page.

## Notification System

### Internal (Staff Notification)

When matching waitlist entries are found after a cancellation:
- Create `Notification` records (type: `"waitlist_match"`) for owner/admin/secretary users
- Notification body: "Horario disponivel: [date/time]. [N] pacientes na lista de espera."

### Patient Notification (Optional)

#### WhatsApp
If workspace has WhatsApp configured and patient has `whatsappConsent`:
- Send template message: "Ola [name], um horario ficou disponivel em [clinicName] no dia [date] as [time]. Deseja agendar? Responda SIM para confirmar."
- Use existing `sendTemplateMessage` from `src/server/actions/whatsapp.ts`
- Update `notifiedAt` and `notifiedVia` on the WaitlistEntry

#### Email
If patient has email:
- Send via existing `sendEmail` from `src/lib/email.ts`
- Template: available slot notification with one-click booking link

#### Automatic vs Manual
Provide a workspace setting: `waitlistAutoNotify: boolean` (default: false). When false, staff must manually trigger notifications. When true, the top-priority matching patient is automatically notified on cancellation.

## RBAC Permissions

Add to `src/lib/permissions.ts`:
```typescript
"waitlist.view": ["owner", "admin", "doctor", "secretary"],
"waitlist.edit": ["owner", "admin", "secretary"],
```

## Server Actions

**New file:** `src/server/actions/waitlist.ts`

| Action | Description |
|---|---|
| `getWaitlistEntries(filters?)` | List entries with status/agenda/priority filters |
| `getWaitlistCount()` | Count of status="waiting" entries (for badge) |
| `addToWaitlist(data)` | Create entry, validate patient exists |
| `updateWaitlistEntry(id, data)` | Edit preferences, priority, notes |
| `cancelWaitlistEntry(id)` | Set status to "cancelled" |
| `expireOldEntries()` | Cron job: expire entries past expiresAt |
| `findMatchesForSlot(date, agendaId)` | Find matching waiting entries |
| `notifyWaitlistPatient(entryId, channel)` | Send notification, update notifiedAt |
| `scheduleFromWaitlist(entryId, appointmentId)` | Link entry to appointment, set status "scheduled" |

### Cancellation Hook

Modify `updateAppointmentStatus` in `src/server/actions/appointment.ts`:

```typescript
// After status update to "cancelled"
if (status === "cancelled") {
  const matches = await findMatchesForSlot(existing.date.toISOString(), existing.agendaId)
  if (matches.length > 0) {
    // Create staff notification
    await createWaitlistMatchNotification(workspaceId, existing, matches.length)
    // If auto-notify enabled, notify top-priority patient
    // ... (check workspace setting)
  }
}
```

### Public API for Booking Waitlist

**New file:** `src/app/api/booking/waitlist/route.ts`

POST handler that:
1. Validates booking token
2. Finds or creates patient (same logic as existing booking POST)
3. Creates WaitlistEntry with preferences from the form
4. Returns confirmation

## Implementation Plan

### Phase 1: Data Layer
1. Add `WaitlistEntry` model to `prisma/schema.prisma`
2. Add relations to Workspace, Patient, Agenda
3. Run `npx prisma db push`

### Phase 2: Server Actions
1. Create `src/server/actions/waitlist.ts` with CRUD + matching logic
2. Add permissions to `src/lib/permissions.ts`
3. Add error constants to `src/lib/error-messages.ts`
4. Modify `updateAppointmentStatus` in `src/server/actions/appointment.ts` for cancellation hook

### Phase 3: UI — Calendar Integration
1. Create `src/app/(dashboard)/calendar/components/waitlist-panel.tsx`
2. Create `src/app/(dashboard)/calendar/components/add-waitlist-dialog.tsx`
3. Add waitlist button to calendar page header in `src/app/(dashboard)/calendar/page.tsx`
4. Enhance cancellation flow in `src/app/(dashboard)/calendar/components/appointment-card.tsx`

### Phase 4: Notifications
1. Add `"waitlist_match"` notification type handling in `src/server/actions/notification.ts`
2. Add WhatsApp notification via existing `sendTemplateMessage`
3. Add email notification template
4. Add workspace setting for auto-notify

### Phase 5: Public Booking Integration
1. Create `src/app/api/booking/waitlist/route.ts`
2. Add waitlist CTA to `src/app/booking/[token]/page.tsx` when no slots available

### Phase 6: Dashboard + Polish
1. Add waitlist card to `src/app/(dashboard)/dashboard/page.tsx`
2. Add expired entry cleanup cron in `src/app/api/waitlist/cleanup/route.ts`

## Migration Strategy

- All new models. No breaking changes to existing data.
- WaitlistEntry is independent — existing appointments and bookings continue to work unchanged.
- The cancellation hook in `updateAppointmentStatus` is additive (runs after existing logic).
- Public booking waitlist is opt-in (only shown when booking page is active and no slots available).

## Testing Considerations

- Matching algorithm: entries with "any day" should match all cancellations
- Time range edge cases: preferredTimeStart = "08:00", cancellation at "08:00" (inclusive)
- Multiple entries for same patient (should be allowed for different procedures/agendas)
- Expired entry cleanup (entries past expiresAt should not match)
- Race condition: two cancellations, same waitlisted patient notified twice
- Public booking waitlist without auth (token validation)
- WhatsApp notification when config is disconnected (graceful fallback)
- Patient with no phone and no email (manual-only notification)
