# Architecture Reference

> Detailed architecture docs. CLAUDE.md points here. Read only when working on specific areas.

## Route Groups

- `src/app/(auth)/` — Sign-in/sign-up (Clerk)
- `src/app/(dashboard)/` — Authenticated pages (sidebar + bottom nav + auth guard)
  - `/dashboard` — Stat cards, today's agenda, recent activity, quick actions
  - `/patients` — Paginated list with search
  - `/patients/[id]` — Detail with tabs (Resumo, Historico, Tratamentos, Prescricoes, Documentos, Imagens, Gravacoes, Formularios)
  - `/patients/[id]/report` — Print-friendly report (Ctrl+P)
  - `/patients/new/voice` — Voice registration flow
  - `/patients/new/manual` — Manual registration form
  - `/calendar` — Modular calendar (week/day/month/list views, scheduling, DnD, conflict detection, recurring, time blocking, multiple agendas)
  - `/appointments/new` — Record consultation
  - `/appointments/review` — Review AI summary before confirming
  - `/appointments/[id]/receipt` — Print-friendly receipt
  - `/prescriptions/[id]` — Print-friendly prescription
  - `/certificates/[id]` — Print-friendly certificate (atestado/declaracao/encaminhamento/laudo)
  - `/financial` — Revenue, expenses, receivables, cash flow, NFS-e, TISS, inventory, price table
  - `/teleconsulta/[id]` — Video room (Daily.co)
  - `/settings` — Workspace config (procedures, agendas, booking, forms, Memed, gateway)
  - `/settings/tiss` — TISS billing + operadoras
  - `/settings/form-builder/[id]` — Visual form builder
  - `/settings/whatsapp` — WhatsApp Business setup wizard
  - `/mensagens` — WhatsApp inbox
- `src/app/(admin)/` — Superadmin panel (dashboard, workspaces, users, roadmap)
- `src/app/onboarding/` — 4-step wizard (profession > questions > clinic > AI preview)

### Public Pages (no auth)
- `/booking/[token]` — Online booking (supports iframe via `?mode=compact`)
- `/nps/[token]` — NPS survey
- `/sala/[token]` — Teleconsulta patient access (24h window)
- `/verificar/[token]` — Digital signature verification
- `/dpo` — LGPD data subject requests
- `/privacidade` — Privacy policy
- `/termos` — Terms of service
- `/docs` — Feature documentation

### API Routes
- `/api/webhooks/clerk` — User sync
- `/api/reminders` — Cron appointment reminders (WhatsApp > email)
- `/api/birthdays` — Cron birthday messages
- `/api/nps/*` — NPS survey API + cron sending
- `/api/booking/*` — Public booking + slots
- `/api/export/*` — Excel export (patients, reports)
- `/api/webhooks/daily` — Daily.co recording webhook
- `/api/webhooks/gateway` — Payment gateway webhook (Asaas)
- `/api/whatsapp/webhook` — WhatsApp incoming messages + status
- `/api/cid/search` — CID-10 search
- `/api/medications/search` — ANVISA medication search
- `/api/inngest` — Inngest function handler
- `/api/dpo` — DPO request submission

## Server Actions (`src/server/actions/`)

All mutations use `"use server"` directive. Auth via `auth()` from Clerk, workspace-scoped.

| File | Functions |
|------|-----------|
| `workspace.ts` | generateWorkspace, getWorkspacePreview, getWorkspace, updateWorkspace |
| `voice.ts` | processVoiceRegistration, confirmPatientRegistration, checkDuplicatePatient |
| `consultation.ts` | processConsultation, getRecordingForReview, confirmConsultation |
| `patient.ts` | getPatients, getPatient, updatePatient, createPatient, searchPatients, mergePatients, deactivatePatient |
| `appointment.ts` | getAppointmentsByDateRange, scheduleAppointment, scheduleRecurringAppointments, checkAppointmentConflicts, updateAppointmentStatus, rescheduleAppointment, deleteAppointment |
| `prescription.ts` | createPrescription, getPrescription, getPatientPrescriptions, deletePrescription |
| `certificate.ts` | createCertificate, getCertificate, getPatientCertificates, deleteCertificate |
| `agenda.ts` | getAgendas, createAgenda, updateAgenda, deleteAgenda |
| `blocked-slot.ts` | getBlockedSlots, createBlockedSlot, updateBlockedSlot, deleteBlockedSlot |
| `financial.ts` | getFinancialData, updateAppointmentPrice, updateProcedurePrice |
| `nfse.ts` | emitNfse, getNfseList, cancelNfse, refreshNfseStatus |
| `gateway.ts` | createGatewayCharge, checkGatewayStatus, cancelGatewayCharge |
| `tiss.ts` | createTissGuide, getTissGuides, updateTissGuideStatus, generateTissBatch |
| `inventory.ts` | getInventoryItems, createInventoryItem, recordMovement, getMovements |
| `team.ts` | getTeamMembers, inviteTeamMember, updateMemberRole, removeMember |
| `whatsapp.ts` | getWhatsAppConfig, saveWhatsAppConfig, fetchConversations, sendTextMessage |
| `memed.ts` | registerMemedPrescriber, getMemedToken, syncMemedPrescription |
| `medication.ts` | searchMedications, getMedicationFavorites, upsertMedicationFavorite |
| `forms.ts` | Form template and response operations |
| `admin.ts` | requireSuperAdmin, getAdminDashboard, getAdminWorkspaces |
| `reports.ts` | getReportsData, getNpsSurveys |
| `dashboard.ts` | getDashboardData |

## Key Components

| Component | Purpose |
|-----------|---------|
| `record-button.tsx` | Audio recording with LGPD consent |
| `command-palette.tsx` | Ctrl+K global search |
| `notification-bell.tsx` | In-app notifications |
| `create-prescription-dialog.tsx` | Prescription creation (Manual/Memed) |
| `create-certificate-dialog.tsx` | Medical certificate creation |
| `medication-autocomplete.tsx` | ANVISA medication search with favorites |
| `cid-autocomplete.tsx` | CID-10 code search |
| `form-renderer.tsx` | Dynamic form renderer (11 field types) |
| `memed-prescription-panel.tsx` | Memed digital prescription embed |
| `nav-sidebar.tsx` / `nav-bottom.tsx` | Navigation (desktop/mobile, RBAC filtered) |

## Calendar Components (`src/app/(dashboard)/calendar/`)

Decomposed modular architecture:
- `types.ts` / `helpers.ts` — Shared types and helpers
- `components/week-view.tsx` — DnD, memo'd, O(1) lookup via Map
- `components/day-view.tsx` / `month-view.tsx` / `list-view.tsx` — All memo'd
- `components/schedule-form.tsx` / `block-time-form.tsx` — Forms
- `components/appointment-card.tsx` — Status actions, memo'd
- `components/conflict-dialog.tsx` — AlertDialog for conflicts

## AI Pipeline

- `src/lib/openai.ts` — Whisper transcription (60s timeout, pt-BR, vocabulary hints)
- `src/lib/claude.ts` — Claude tool_use for structured extraction (30s timeout, temperature:0)
- `src/lib/schemas.ts` — Zod validation for AI responses
- `src/data/cid10-index.ts` — CID-10 search (1022 codes, accent-insensitive)
- `src/data/medications-index.ts` — ANVISA medications (248 curated, DB-backed in production)

## Integration Modules

| Module | Files | Purpose |
|--------|-------|---------|
| NFS-e | `src/lib/nfse/client.ts` | NuvemFiscal API (DPS Nacional) |
| Payment | `src/lib/gateway/` | Asaas gateway (charges, PIX, boleto) |
| TISS | `src/lib/tiss/` | ANS billing XML generation |
| WhatsApp | `src/lib/whatsapp/` | Meta Cloud API |
| Memed | `src/lib/memed/client.ts` | Digital prescription |
| Inngest | `src/inngest/` | Background job processing |
