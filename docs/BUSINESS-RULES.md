# Business Rules Reference

> Critical rules that affect how code should be written. Read when implementing features.

## Data Integrity

1. **Confirmation-before-save**: AI-extracted data is NEVER saved automatically. Professional must review and confirm.
2. **Atomic transactions**: All multi-step DB operations use `db.$transaction()`.
3. **Double-confirm guard**: `confirmConsultation` checks `recording.appointmentId == null` inside transaction.
4. **Duplicate patient detection**: By CPF (normalized) and name (case-insensitive). `@@unique([workspaceId, document])` at DB level. `mergePatients()` with consistent lock ordering.
5. **Soft delete for patients**: `isActive` flag. Records retained for CFM 20-year requirement.
6. **Appointment conflict detection**: ±30min window, scoped per agenda. `forceSchedule: true` bypasses.
7. **Automated reminders**: Cron 24h before. WhatsApp (interactive buttons) > email fallback.
8. **Birthday messages**: Daily cron, WhatsApp > email fallback.

## WhatsApp Consent (LGPD)

- `Patient.whatsappConsent` must be `true` before sending messages
- Explicit sends hard-block on missing consent
- Cron-based sends soft-degrade to email
- Online booking auto-grants consent
- Toggle in patient Resumo tab

## Audit Logging (CFM 1.821/2007)

- `getPatient()` logs "patient.viewed"
- `getAudioPlaybackUrl()` logs "recording.accessed"
- `getRecordingForReview()` logs "recording.accessed"
- Credential access logged as "credential.accessed"
- All CRUD operations logged

## Security & Privacy (LGPD)

1. LGPD consent required before audio recording (ConsentRecord in DB)
2. No PHI in URLs — review page fetches data server-side
3. Audio via 5-minute signed URLs only
4. Audio blobs in memory only, never cached locally
5. Multi-tenant isolation via workspaceId on all queries
6. Env validation at startup via Zod
7. Data residency in sa-east-1 (Brazil)
8. DPO contact page at `/dpo` (15-day SLA)

## Server Action Error Handling (CRITICAL)

Next.js in production sanitizes `Error.message` from server actions. Solution:

```typescript
// Server: use ActionError for expected errors, safeAction wrapper
import { ActionError, safeAction } from "@/lib/error-messages"
export const myAction = safeAction(async (data) => {
  if (!valid) throw new ActionError("Mensagem para o usuario")
  return { id: result.id }
})

// Client: always check for error before using result
const result = await myAction(data)
if ('error' in result) { toast.error(result.error); return }
```

Rules:
1. `throw new ActionError("msg")` for expected errors (validation, limits)
2. `throw new Error(ERR_*)` for auth errors (caught by error boundaries)
3. Always wrap mutations with `safeAction()`
4. Always check `'error' in result` on frontend

## RBAC

5 roles: owner > admin > doctor > secretary > viewer
- `src/lib/permissions.ts` — 20 permissions, `hasPermission(role, permission)`
- Navigation filtered by role
- Settings guarded by `settings.view` permission

## Multi-tenant Pattern

```typescript
const { userId } = await auth()
const workspaceId = await getWorkspaceIdCached(userId)
// All queries filter by workspaceId
```
