# RBAC — Role-Based Access Control

> Feature doc for granular role-based permissions in VoxClinic.

## Overview

### Current Limitation

VoxClinic currently has only 2 roles:
- **user** — standard workspace member (full access to everything)
- **superadmin** — platform-level admin (access to `/admin` panel)

This means every team member invited to a workspace gets full access to all patients, financial data, settings, and clinical records. This is inadequate for real clinic workflows where:
- **Secretaries** need to manage appointments but should NOT see clinical notes or financial reports
- **Doctors/professionals** need full clinical access but may not manage billing or settings
- **Clinic owners** need complete control over the workspace
- **Viewers** (interns, auditors) need read-only access to specific areas

### Goal

Implement a 5-role permission system that enforces access control at the server action level, with corresponding UI changes to hide/disable unauthorized features.

## Role Definitions

### 5 Roles (ordered by permission level)

| Role | Description | Typical User |
|---|---|---|
| `owner` | Full control, cannot be removed, manages billing | Clinic owner, main professional |
| `admin` | Full control except billing/plan management | Office manager, partner |
| `doctor` | Full clinical access, limited admin | Doctor, dentist, nutritionist, psychologist |
| `secretary` | Scheduling, patient registration, no clinical | Receptionist, secretary |
| `viewer` | Read-only access to authorized areas | Intern, auditor, trainee |

### Role Assignment Rules

- The user who creates the workspace is automatically assigned `owner`
- Only `owner` can change another user's role to `owner` (transfers ownership)
- Only `owner` and `admin` can invite new members and manage roles
- A workspace must always have exactly one `owner`
- `owner` role cannot be removed or downgraded (must transfer first)

## Permission Matrix

### Patients

| Action | owner | admin | doctor | secretary | viewer |
|---|---|---|---|---|---|
| View patient list | yes | yes | yes | yes | yes |
| View patient detail | yes | yes | yes | yes | yes |
| Create patient | yes | yes | yes | yes | no |
| Edit patient info | yes | yes | yes | yes | no |
| Deactivate patient | yes | yes | yes | no | no |
| Merge patients | yes | yes | no | no | no |
| View medical history | yes | yes | yes | no | no |
| Edit medical history | yes | yes | yes | no | no |
| View custom data | yes | yes | yes | partial* | no |
| Import patients (CSV) | yes | yes | no | no | no |
| Export patients (Excel) | yes | yes | yes | no | no |

*Secretary sees non-clinical custom fields only

### Appointments

| Action | owner | admin | doctor | secretary | viewer |
|---|---|---|---|---|---|
| View calendar | yes | yes | yes | yes | yes |
| View appointment detail | yes | yes | yes | yes | yes |
| Schedule appointment | yes | yes | yes | yes | no |
| Reschedule appointment | yes | yes | yes | yes | no |
| Cancel appointment | yes | yes | yes | yes | no |
| Change status (complete/no-show) | yes | yes | yes | no | no |
| Delete appointment | yes | yes | no | no | no |
| Manage blocked slots | yes | yes | yes | yes | no |
| Recurring appointments | yes | yes | yes | yes | no |

### Clinical

| Action | owner | admin | doctor | secretary | viewer |
|---|---|---|---|---|---|
| Record audio (voice consultation) | yes | yes | yes | no | no |
| View transcripts | yes | yes | yes | no | no |
| View AI summaries | yes | yes | yes | no | no |
| Create prescriptions | yes | yes | yes | no | no |
| View prescriptions | yes | yes | yes | no | no |
| Create certificates | yes | yes | yes | no | no |
| View certificates | yes | yes | yes | no | no |
| Manage treatment plans | yes | yes | yes | no | no |
| View treatment plans | yes | yes | yes | no | no |
| Manage anamnesis | yes | yes | yes | no | no |
| View recordings/playback | yes | yes | yes | no | no |
| Upload patient documents | yes | yes | yes | yes | no |
| View patient documents | yes | yes | yes | yes | yes |

### Financial

| Action | owner | admin | doctor | secretary | viewer |
|---|---|---|---|---|---|
| View financial dashboard | yes | yes | no | no | no |
| View revenue/expenses | yes | yes | no | no | no |
| Edit appointment prices | yes | yes | no | no | no |
| Manage expenses | yes | yes | no | no | no |
| View receivables | yes | yes | no | no | no |
| Manage NFS-e | yes | yes | no | no | no |
| Manage TISS guides | yes | yes | no | no | no |
| View price table | yes | yes | yes | yes | no |
| Edit price table | yes | yes | no | no | no |
| Export financial reports | yes | yes | no | no | no |
| View reports/analytics | yes | yes | yes* | no | no |

*Doctor sees clinical reports only (appointment stats, procedure ranking), not revenue data

### Settings

| Action | owner | admin | doctor | secretary | viewer |
|---|---|---|---|---|---|
| View workspace settings | yes | yes | no | no | no |
| Edit workspace settings | yes | yes | no | no | no |
| Manage procedures | yes | yes | no | no | no |
| Manage agendas | yes | yes | no | no | no |
| Manage team members | yes | yes | no | no | no |
| Invite members | yes | yes | no | no | no |
| Remove members | yes | yes | no | no | no |
| Change member roles | yes | yes* | no | no | no |
| Manage billing/plan | yes | no | no | no | no |
| Manage booking config | yes | yes | no | no | no |
| Manage WhatsApp config | yes | yes | no | no | no |
| NFS-e config | yes | yes | no | no | no |
| TISS config | yes | yes | no | no | no |
| Audit log | yes | yes | no | no | no |

*Admin cannot promote to owner or demote owner

### Messaging

| Action | owner | admin | doctor | secretary | viewer |
|---|---|---|---|---|---|
| View WhatsApp inbox | yes | yes | yes | yes | no |
| Send messages | yes | yes | yes | yes | no |
| View conversations | yes | yes | yes | yes | yes |
| Manage messaging config | yes | yes | no | no | no |

### Teleconsulta

| Action | owner | admin | doctor | secretary | viewer |
|---|---|---|---|---|---|
| Start teleconsulta | yes | yes | yes | no | no |
| View teleconsulta recordings | yes | yes | yes | no | no |
| Schedule teleconsulta | yes | yes | yes | yes | no |

## Data Model

### Expand WorkspaceMember Role

Currently the User model has a simple `role` enum. For RBAC, we need workspace-scoped roles:

```prisma
// Update the existing role handling
// The User.role field stays for platform-level (user/superadmin)
// Workspace-level role is on the membership relation

model User {
  // ... existing fields ...
  role            String   @default("user") // Platform role: "user" | "superadmin"

  // Workspace membership (existing relation)
  workspaceId     String?
  workspace       Workspace? @relation(fields: [workspaceId], references: [id])
  workspaceRole   String   @default("doctor") // "owner" | "admin" | "doctor" | "secretary" | "viewer"
}
```

Alternatively, if the codebase moves to a separate `WorkspaceMember` join table in the future:

```prisma
model WorkspaceMember {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  role        String   // "owner" | "admin" | "doctor" | "secretary" | "viewer"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, workspaceId])
  @@index([workspaceId])
}
```

For V1, adding `workspaceRole` to the existing User model is simpler and avoids a migration to a join table.

### Agenda Ownership

Link agendas to specific members (doctors):

```prisma
model Agenda {
  // ... existing fields ...
  memberId    String?  // The doctor/professional who owns this agenda
  member      User?    @relation(fields: [memberId], references: [id])
}
```

This allows:
- Secretaries to see all agendas but only schedule for their assigned doctors
- Doctors to have their own default agenda
- Calendar filtering by professional

### WorkspaceInvite Update

```prisma
model WorkspaceInvite {
  // ... existing fields ...
  role        String   // Change from generic to specific: "admin" | "doctor" | "secretary" | "viewer"
}
```

## Enforcement Strategy

### Server-Action Level Enforcement

All permission checks happen at the server action level, NOT just in the UI. This prevents bypassing via direct API calls.

#### Permission Helper

Create `src/server/actions/_permissions.ts`:

```typescript
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ActionError } from "@/lib/error-messages"

export type Permission =
  // Patients
  | "patients:read" | "patients:write" | "patients:delete" | "patients:merge"
  | "patients:clinical" | "patients:import" | "patients:export"
  // Appointments
  | "appointments:read" | "appointments:write" | "appointments:delete"
  | "appointments:status" | "appointments:blocked_slots"
  // Clinical
  | "clinical:record" | "clinical:read" | "clinical:prescriptions"
  | "clinical:certificates" | "clinical:treatments" | "clinical:documents_write"
  | "clinical:documents_read"
  // Financial
  | "financial:read" | "financial:write" | "financial:nfse" | "financial:tiss"
  | "financial:reports" | "financial:export"
  // Settings
  | "settings:read" | "settings:write" | "settings:team" | "settings:billing"
  | "settings:integrations"
  // Messaging
  | "messaging:read" | "messaging:write" | "messaging:config"
  // Teleconsulta
  | "teleconsulta:start" | "teleconsulta:view"

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: ["*"], // All permissions
  admin: [
    "patients:read", "patients:write", "patients:delete", "patients:merge",
    "patients:clinical", "patients:import", "patients:export",
    "appointments:read", "appointments:write", "appointments:delete",
    "appointments:status", "appointments:blocked_slots",
    "clinical:record", "clinical:read", "clinical:prescriptions",
    "clinical:certificates", "clinical:treatments",
    "clinical:documents_write", "clinical:documents_read",
    "financial:read", "financial:write", "financial:nfse", "financial:tiss",
    "financial:reports", "financial:export",
    "settings:read", "settings:write", "settings:team", "settings:integrations",
    "messaging:read", "messaging:write", "messaging:config",
    "teleconsulta:start", "teleconsulta:view",
  ],
  doctor: [
    "patients:read", "patients:write", "patients:clinical", "patients:export",
    "appointments:read", "appointments:write", "appointments:status",
    "appointments:blocked_slots",
    "clinical:record", "clinical:read", "clinical:prescriptions",
    "clinical:certificates", "clinical:treatments",
    "clinical:documents_write", "clinical:documents_read",
    "financial:reports", // clinical reports only
    "messaging:read", "messaging:write",
    "teleconsulta:start", "teleconsulta:view",
  ],
  secretary: [
    "patients:read", "patients:write",
    "appointments:read", "appointments:write", "appointments:blocked_slots",
    "clinical:documents_write", "clinical:documents_read",
    "messaging:read", "messaging:write",
  ],
  viewer: [
    "patients:read",
    "appointments:read",
    "clinical:documents_read",
    "messaging:read",
  ],
}

export async function requirePermission(permission: Permission): Promise<{
  userId: string
  workspaceId: string
  role: string
}> {
  const { userId } = await auth()
  if (!userId) throw new Error("Nao autenticado")

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true },
  })
  if (!user?.workspace) throw new Error("Workspace nao encontrado")

  const role = user.workspaceRole || "doctor"
  const permissions = ROLE_PERMISSIONS[role] || []

  if (!permissions.includes("*" as Permission) && !permissions.includes(permission)) {
    throw new ActionError("Voce nao tem permissao para realizar esta acao")
  }

  return {
    userId: user.id,
    workspaceId: user.workspace.id,
    role,
  }
}

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes("*" as Permission) || permissions.includes(permission)
}
```

#### Usage in Server Actions

```typescript
// Before (current pattern)
export const deactivatePatient = safeAction(async (patientId: string) => {
  const { userId } = await auth()
  const user = await db.user.findUnique({ where: { clerkId: userId }, ... })
  // ... no permission check
})

// After (with RBAC)
export const deactivatePatient = safeAction(async (patientId: string) => {
  const { workspaceId } = await requirePermission("patients:delete")
  // ... proceed with workspace-scoped query
})
```

### Incremental Migration

Since all server actions already follow the `auth() → user → workspaceId` pattern, the migration is mechanical:

1. Replace the auth boilerplate with `requirePermission("appropriate:permission")`
2. The helper returns `workspaceId` so existing query logic stays the same
3. Actions that don't need specific permissions can use `requirePermission("patients:read")` as a baseline

## UI Changes

### Team Management (`/settings` — Team tab)

Update the existing team management UI:

- **Role selector:** Dropdown with 4 invitable roles (admin, doctor, secretary, viewer)
- **Role badges:** Color-coded (owner=purple, admin=blue, doctor=teal, secretary=amber, viewer=gray)
- **Transfer ownership:** Special action for owner only (with confirmation dialog)
- **Role descriptions:** Tooltip or helper text explaining each role's permissions
- **Current user indicator:** "Voce" badge next to current user's row

### Navigation Sidebar

Conditionally show/hide navigation items based on role:

```typescript
const navItems = [
  { href: "/dashboard", label: "Dashboard", permission: null }, // always visible
  { href: "/patients", label: "Pacientes", permission: "patients:read" },
  { href: "/calendar", label: "Agenda", permission: "appointments:read" },
  { href: "/appointments/new", label: "Nova Consulta", permission: "clinical:record" },
  { href: "/financial", label: "Financeiro", permission: "financial:read" },
  { href: "/mensagens", label: "Mensagens", permission: "messaging:read" },
  { href: "/settings", label: "Configuracoes", permission: "settings:read" },
]
```

For `secretary` and `viewer`: hide Financial, Settings, Nova Consulta links.

### Patient Detail Page

- **Clinical tabs** (Historico, Tratamentos, Anamnese, Gravacoes): hidden for `secretary` and `viewer`
- **Action buttons** (Prescricao, Atestado): hidden for non-clinical roles
- **Edit button:** hidden for `viewer`
- **Merge/Deactivate:** hidden for roles without permission
- **Documents tab:** visible to all (secretary can upload), but clinical documents filtered for secretary

### Financial Page

- Entire page hidden from `doctor`, `secretary`, `viewer` via middleware or layout guard
- `doctor` sees Reports page but with revenue data redacted (shows appointment counts, procedure stats only)

### Calendar Page

- All roles can view the calendar
- Schedule form: hidden for `viewer`
- Status change buttons: hidden for `secretary` and `viewer`
- Delete button: hidden for all except `owner` and `admin`

### Dashboard

- Financial stats (revenue, receivables): hidden for `secretary`, `viewer`, and optionally `doctor`
- Patient/appointment stats: visible to all
- Quick actions: filtered by permission

## Implementation Plan

### Phase 1: Data Model & Permission Engine (2 days)

- Add `workspaceRole` field to User model (default: "doctor")
- Create `src/server/actions/_permissions.ts` with `requirePermission` helper
- Create `src/lib/permissions.ts` with `hasPermission` client-side helper (for UI gating)
- Migration: set existing workspace creators as `owner`, all others as `doctor`
- Update `WorkspaceInvite` to use new role enum

### Phase 2: Server Action Enforcement (3 days)

- Update ALL server actions to use `requirePermission()` instead of raw `auth()` + user lookup
- Group by module: patients, appointments, clinical, financial, settings, messaging, teleconsulta
- Each action gets the appropriate permission check
- Test that unauthorized actions return proper error messages

### Phase 3: UI Gating (2 days)

- Create `usePermission()` hook that reads current user's role from context/session
- Create `<PermissionGate permission="...">` wrapper component
- Update nav sidebar and bottom nav
- Update patient detail page (hide clinical tabs, action buttons)
- Update calendar page (hide schedule form, status buttons)
- Update financial page (access guard)
- Update settings page (access guard)
- Update dashboard (hide financial stats)

### Phase 4: Team Management UI (2 days)

- Update invite dialog with role selector
- Update team list with role badges and change role dropdown
- Implement ownership transfer flow
- Add role descriptions and permission summary view
- Test complete invite → accept → role assignment flow

**Total estimated: 9 days**

## Migration

### Existing Users

When deploying RBAC:

1. **Workspace creator** (the user whose `onboardingComplete = true` and created the workspace) → `owner`
2. **All other workspace members** → `doctor` (safe default — they currently have full access, and `doctor` is the closest equivalent without granting admin powers)
3. Workspace owners receive a notification explaining the new role system and suggesting they review team roles

### Migration Script

```typescript
// In a migration or seed script
const workspaces = await db.workspace.findMany({
  include: { users: true }
})

for (const workspace of workspaces) {
  // Find the creator (first user, or the one who completed onboarding)
  const creator = workspace.users.find(u => u.onboardingComplete) || workspace.users[0]

  for (const user of workspace.users) {
    await db.user.update({
      where: { id: user.id },
      data: {
        workspaceRole: user.id === creator?.id ? "owner" : "doctor"
      }
    })
  }
}
```

## Testing

### Unit Tests

- `requirePermission` returns correct context for authorized users
- `requirePermission` throws ActionError for unauthorized users
- `hasPermission` returns correct boolean for all role/permission combinations
- Owner has all permissions
- Viewer has minimal permissions
- Permission matrix matches specification

### Integration Tests

- Secretary can schedule appointment but cannot record audio
- Doctor can create prescription but cannot access financial
- Viewer can view patient list but cannot edit
- Admin can manage team but cannot change billing
- Owner can do everything including transfer ownership

### Manual Testing

- Invite user with each role, verify access restrictions
- Transfer ownership, verify old owner becomes admin
- Verify nav items hidden for restricted roles
- Verify server actions reject unauthorized calls (not just UI hiding)
- Verify error messages are user-friendly ("Voce nao tem permissao...")
