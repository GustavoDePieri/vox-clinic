# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VoxClinic is a voice-powered intelligent CRM for healthcare and service professionals (dentists, nutritionists, aestheticians, doctors, lawyers). Professionals speak during or after appointments, and the system automatically transcribes, extracts structured data via AI, and populates patient records. The key differentiator is an AI-driven onboarding that generates a fully customized workspace per profession.

## Commands

```bash
npm run dev          # Start dev server (Next.js 16 + Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma db push   # Push schema changes to database (dev)
npx prisma validate  # Validate schema without pushing
npx tsc --noEmit     # Type-check without emitting files
npx shadcn@latest add [component] -y  # Add shadcn/ui component
```

## Development Workflow

### Feature Implementation Process

Every new feature MUST follow this workflow:

1. **Feature Document First** — Before writing any code, create a feature doc at `docs/features/<feature-name>.md` covering:
   - Overview and motivation
   - Data model changes (Prisma schema)
   - UI/UX design (which pages/components are affected)
   - Integration points with existing systems
   - Implementation plan (phased tasks with file paths)
   - Migration strategy (backward compatibility)
   - Testing considerations

2. **Implementation** — Build the feature following the plan. Use parallel agents for independent phases (data layer, backend, frontend).

3. **QA Review** — After implementation, run a QA pass:
   - `npx prisma validate` — schema is valid
   - `npx tsc --noEmit` — zero TypeScript errors
   - Review for bugs: empty states, error handling, edge cases
   - Verify integration with existing features doesn't break
   - Fix all issues before moving to next feature

4. **Documentation Update** — In the same change:
   - Update `src/app/docs/page.tsx` — add FeatureCard(s), increment total
   - Update `src/app/(admin)/admin/roadmap/page.tsx` — set status to "done"
   - Update this `CLAUDE.md` if architecture changed significantly

5. **Never skip QA** — Every feature must have zero TypeScript errors before proceeding to the next one.

### Agent Coordination Rules

- **Planning agents** use `subagent_type: Plan` (read-only, produce docs)
- **Implementation agents** use `mode: auto` (can write code)
- **QA agents** use `subagent_type: Quality & Stability Lead` (read + analyze)
- Multiple implementation agents can run in parallel for independent phases
- If agents modify the same file, resolve conflicts after all complete
- Always run `npx tsc --noEmit` after agents finish to catch integration issues

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Backend/API:** Next.js Server Actions + API Routes
- **Database:** PostgreSQL via Supabase (sa-east-1, PgBouncer on 6543, direct on 5432)
- **ORM:** Prisma (uses `directUrl` for migrations/push, `DATABASE_URL` for runtime)
- **Auth:** Clerk (with pt-BR localization)
- **Speech-to-Text:** OpenAI Whisper API (with medical vocabulary hints, verbose_json)
- **AI/LLM:** Anthropic Claude Sonnet (tool_use for structured output, temperature:0 for extraction)
- **AI Validation:** Zod schemas for all AI responses (`src/lib/schemas.ts`)
- **Storage:** Supabase Storage (private `audio` and `videos` buckets, signed URLs 5min expiry)
- **Email:** Resend (optional, for appointment reminders)
- **Video:** Daily.co (teleconsulta rooms, recording webhook)
- **Prescription:** Memed Digital (optional, for electronic prescriptions with digital signature)
- **Fiscal:** NuvemFiscal (NFS-e emission, DPS Nacional format)
- **Env Validation:** Zod-based at `src/lib/env.ts` — fail-fast on missing variables

## Architecture

### Design System — Tailwind v4
This project uses **Tailwind CSS v4** with `@theme inline` in `src/app/globals.css`. There is NO `tailwind.config.ts`. Custom colors are CSS variables:
- `--color-vox-primary: #14B8A6` (teal/verde-agua) → `bg-vox-primary`, `text-vox-primary`
- `--color-vox-success: #10B981` (emerald), `--color-vox-warning: #F59E0B`, `--color-vox-error: #EF4444`
- Background has subtle teal tint (`oklch(0.988 0.004 175)`)
- Cards: `rounded-2xl`, `border-border/40`, subtle shadow
- Inputs: `h-10`, `rounded-xl`, teal focus ring
- Buttons: `rounded-xl`, `h-9` default, `scale-[0.98]` active press
- Full-width system layout (no max-width constraint), content uses `px-4 md:px-6 lg:px-8`

### Route Groups
- `src/app/(auth)/` — Sign-in/sign-up (Clerk components)
- `src/app/(dashboard)/` — Authenticated pages (sidebar + bottom nav + auth guard)
  - `/dashboard` — Stat cards, today's agenda, recent activity, quick actions
  - `/patients` — Paginated list with search
  - `/patients/[id]` — Detail with tabs (Resumo, Historico, Tratamentos, Prescricoes, Documentos, Imagens, Gravacoes, Formularios) + audio playback
  - `/patients/[id]/report` — Print-friendly patient report (Ctrl+P → PDF)
  - `/appointments/[id]/receipt` — Print-friendly receipt (Ctrl+P → PDF)
  - `/patients/new/voice` — Voice registration flow
  - `/patients/new/manual` — Manual registration form
  - `/calendar` — Modular calendar (decomposed into sub-components under `calendar/components/`). Week/day/month/list views with scheduling, conflict detection, drag & drop rescheduling (week view, via @dnd-kit/core), time blocking (BlockedSlot), recurring appointments (weekly/biweekly), multiple agendas with color-coded filter pills. Client-side cache (Map, 60s TTL) for prev/next navigation. Shared types in `calendar/types.ts`, helpers in `calendar/helpers.ts`
  - `/appointments/new` — Record consultation for existing patient
  - `/appointments/review` — Review AI summary before confirming
  - `/prescriptions/[id]` — Print-friendly prescription page (medications table, Ctrl+P → PDF)
  - `/certificates/[id]` — Print-friendly medical certificate page (atestado/declaracao/encaminhamento/laudo, Ctrl+P → PDF)
  - `/financial` — Financial dashboard (revenue, expenses, receivables, cash flow, NFS-e management, TISS billing, inventory/estoque, price table)
  - `/teleconsulta/[id]` — Teleconsulta video room (Daily.co iframe, creates room before joining, screen share, chat)
  - `/settings` — Workspace config (procedures with duration, custom fields, clinic name, agendas management with color picker, online booking toggle and config with embeddable widget code generator, formularios, Memed integration, payment gateway config)
  - `/settings/import` — CSV patient import with column mapping
  - `/settings/whatsapp` — WhatsApp Business API setup wizard (5-step: intro, connect, verify, templates, done)
  - `/settings/audit` — Audit log viewer with pagination
  - `/settings/tiss` — TISS billing settings + operadora (insurance company) management
  - `/settings/form-builder/[id]` — Visual form builder with field palette (drag & drop field types)
  - `/mensagens` — WhatsApp inbox (conversation list + chat, polling-based)
- `src/app/(admin)/` — Superadmin panel (own layout, no sidebar/nav)
  - `/admin` — Executive dashboard (KPIs: workspaces, users, patients, plan distribution)
  - `/admin/workspaces` — All workspaces table with search, plan/status badges
  - `/admin/workspaces/[id]` — Per-workspace drill-down (stats, recent activity, toggle status)
  - `/admin/usuarios` — All platform users table with role, plan, onboarding status
  - `/admin/roadmap` — Interactive roadmap with progress tracking, filters, category breakdown
- `src/app/onboarding/` — 4-step wizard (profession → questions → clinic → AI preview)
- `src/app/api/webhooks/clerk/` — User sync webhook
- `src/app/api/reminders/` — Cron-triggered appointment reminders (email + WhatsApp with interactive confirm/cancel buttons)
- `src/app/api/birthdays/` — Cron-triggered birthday messages (WhatsApp preferred, email fallback)
- `src/app/api/nps/` — NPS survey API (GET survey by token, POST submit score+comment, public/token-based)
- `src/app/api/nps/send/` — Cron-triggered NPS survey sending after completed appointments
- `src/app/api/booking/` — Public booking API (GET config by token, POST create booking)
- `src/app/api/booking/slots/` — Public available slots API (GET by date/agenda/duration)
- `src/app/api/export/patients/` — Excel export of all active patients
- `src/app/api/export/reports/` — Excel export of reports data (multi-sheet: Resumo, Mensal, Procedimentos)
- `src/app/api/webhooks/daily/` — Daily.co recording webhook (POST captures video recordings, downloads and uploads to Supabase Storage `videos` bucket, links to appointment)
- `src/app/api/webhooks/gateway/` — Payment gateway webhook (POST for Asaas events: PAYMENT_RECEIVED, PAYMENT_OVERDUE, PAYMENT_REFUNDED, PAYMENT_DELETED). Logs to GatewayWebhookLog, auto-records payment on confirmation
- `src/app/api/whatsapp/webhook/` — WhatsApp webhook (GET for Meta verification, POST for incoming messages/status updates/appointment confirmations)
- `src/app/api/cid/search/` — CID-10 search API (GET `/api/cid/search?q=diabetes&limit=20`, auth via Clerk)
- `src/app/api/dpo/` — DPO request submission (POST, saves to database, no auth required)
- `src/app/nps/[token]/` — Public NPS survey page (no auth, token-based access, 0-10 score + comment)
- `src/app/booking/[token]/` — Public online booking page (no auth, token-based, multi-step: procedure → date/time → patient info → confirm). Supports `?mode=compact` for iframe embedding (no header, transparent bg, postMessage bridge) and `?color=` for dynamic primary color override
- `public/widget.js` — Embeddable booking widget script (~3KB). Self-contained, reads data attributes from script tag. Creates floating button or inline iframe. postMessage communication with iframe (resize, booked, close). Mobile: full-screen overlay
- `src/app/sala/[token]/` — Public teleconsulta patient access page (no auth, token-based, LGPD consent, 24h access window before/after appointment, join button)
- `src/app/dpo/` — Public DPO contact page (no auth, LGPD Art. 41/18, rights info, request form saved to DpoRequest table, 15-day response SLA)
- `src/app/verificar/[token]/` — Public digital signature verification page (LGPD-safe, masked patient data)
- `src/app/privacidade/` — Public privacy policy page (no auth)
- `src/app/termos/` — Public terms of service page (no auth)

### Command Palette (Ctrl+K)
- `src/components/command-palette.tsx` — Global search accessible from any page
- Triggered via `Cmd+K` / `Ctrl+K` keyboard shortcut, or search button in header
- Three result groups: **Pacientes** (live search via `searchPatients()`), **Paginas**, **Acoes**
- Full keyboard navigation: Arrow keys, Enter to navigate, Escape to close
- 200ms debounce on patient search, max 5 results
- Uses shadcn Dialog component

### Navigation
- `src/components/nav-sidebar.tsx` — Desktop sidebar (hidden on mobile, md+), grouped sections (Menu/Acoes), filtered by RBAC role
- `src/components/nav-bottom.tsx` — Mobile bottom nav (fixed, md:hidden, grid-cols-5), filtered by RBAC role
- Links: Dashboard, Pacientes, Agenda, Nova Consulta, Config
- Active state via `usePathname()` with `bg-vox-primary/10 text-vox-primary shadow-sm`

### Server Actions (src/server/actions/)
All data mutations use Server Actions with `"use server"` directive:
- `workspace.ts` — generateWorkspace (accepts edited preview, NOT re-generated), getWorkspacePreview, getWorkspace, updateWorkspace
- `voice.ts` — processVoiceRegistration, confirmPatientRegistration (in $transaction), checkDuplicatePatient
- `consultation.ts` — processConsultation, getRecordingForReview (server-side data fetch), confirmConsultation (in $transaction with double-confirm guard)
- `patient.ts` — getPatients (paginated, filters isActive, supports tag/insurance filters), getPatient, updatePatient, createPatient, searchPatients (name/CPF/phone/email/insurance), getRecentPatients, getAudioPlaybackUrl, deactivatePatient (soft delete), mergePatients (atomic merge with $transaction), getAllPatientTags, getDistinctInsurances
- `appointment.ts` — getAppointmentsByDateRange, scheduleAppointment, scheduleRecurringAppointments (weekly/biweekly, 2-52 occurrences, atomic $transaction), checkAppointmentConflicts (returns { appointments, blockedSlots }), updateAppointmentStatus, rescheduleAppointment (accepts `forceSchedule` param), deleteAppointment. Advisory locks use `$executeRawUnsafe` (Prisma 6 compat)
- `receipt.ts` — generateReceiptData
- `prescription.ts` — createPrescription, getPrescription, getPatientPrescriptions, deletePrescription
- `certificate.ts` — createCertificate (auto-generates content for atestado/declaracao), getCertificate, getPatientCertificates, deleteCertificate
- `blocked-slot.ts` — getBlockedSlots (expands weekly recurring, optional agendaIds filter), createBlockedSlot (requires agendaId), updateBlockedSlot, deleteBlockedSlot
- `agenda.ts` — getAgendas, getDefaultAgendaId, getDefaultAgendaIdForWorkspace, createAgenda, updateAgenda, deleteAgenda
- `booking-config.ts` — getBookingConfig, toggleBooking, updateBookingConfig, regenerateBookingToken
- `reports.ts` — getReportsData (analytics: monthly revenue, patient trends, procedure ranking, hour heatmap, return rate, no-show rate, patient ranking by frequency/revenue, NPS score), getNpsSurveys (paginated individual NPS responses)
- `dashboard.ts` — getDashboardData (stats, today's agenda, recent activity, trends)
- `reminder.ts` — sendAppointmentReminder, sendBulkReminders
- `treatment.ts` — getTreatmentPlans, createTreatmentPlan, addSessionToTreatment, updateTreatmentPlanStatus, deleteTreatmentPlan
- `notification.ts` — getNotifications, getUnreadCount, markAsRead, markAllAsRead, generateUpcomingNotifications
- `document.ts` — getPatientDocuments, uploadPatientDocument, getDocumentSignedUrl, deletePatientDocument
- `clinical-image.ts` — getPatientImages (list with body region/category/date filters), uploadImage (safeAction: validate file max 10MB, compress, upload, create record), updateImage (edit metadata), deleteImage (storage + DB), pairImages (before/after link), unpairImage, getImageCount (badge), getClinicalImageSignedUrl
- `import.ts` — importPatients (bulk CSV import with validation)
- `team.ts` — getTeamMembers, inviteTeamMember, cancelInvite, updateMemberRole, removeMember, acceptInvite
- `messaging.ts` — getMessagingConfig, updateMessagingConfig, sendAppointmentMessage (email/WhatsApp/SMS)
- `whatsapp.ts` — getWhatsAppConfig, saveWhatsAppConfig, disconnectWhatsApp, fetchConversations, fetchMessages, sendTextMessage, sendTemplateMessage, markConversationAsRead, fetchTemplates, checkWhatsAppHealth
- `audit.ts` — getAuditLogs (paginated audit log query with user info)
- `billing.ts` — (includes) getWorkspaceUsage (plan usage metrics: patients, appointments, recordings vs limits)
- `nfse.ts` — emitNfse (NFS-e emission via NuvemFiscal DPS Nacional format), getNfseList (paginated), searchAppointmentsForNfse (auto-search debounce), getNfseByAppointment, cancelNfse, refreshNfseStatus
- `nfse-config.ts` — getNfseConfig, saveNfseConfig (fiscal settings: CNPJ, ISS, regime tributario), uploadNfseCertificate (digital certificate A1 .pfx upload), testNfseConnection
- `gateway.ts` — createGatewayCharge (creates charge in Asaas, saves gateway fields to Payment), checkGatewayStatus (checks/updates from gateway), cancelGatewayCharge, recordGatewayPayment (helper for webhook/polling)
- `gateway-config.ts` — getGatewayConfig (masked apiKey), saveGatewayConfig (encrypt apiKey, upsert), testGatewayConnection
- `teleconsulta.ts` — createTeleconsultaRoom (creates Daily.co room before navigating), recordTeleconsultaConsent, getPatientJoinInfo (24h access window), endTeleconsulta, getTeleconsultaInfo
- `financial.ts` — getFinancialData, updateAppointmentPrice, updateProcedurePrice, getWorkspaceProcedures
- `inventory.ts` — getInventoryItems (search/filter), getInventoryItem, createInventoryItem (with optional initial stock movement), updateInventoryItem, deactivateInventoryItem (soft delete), recordMovement (atomic $transaction, prevents negative stock), getMovements, getInventoryCategories, createInventoryCategory, getInventorySummary, getLowStockItems
- `admin.ts` — requireSuperAdmin guard, getAdminDashboard, getAdminWorkspaces, getAdminWorkspaceDetail, toggleWorkspaceStatus, getAdminUsers
- `tiss.ts` — createTissGuide, getTissGuides, updateTissGuideStatus, generateTissBatch, searchAppointmentsForTiss
- `tiss-guide.ts` — Additional TISS guide operations
- `tiss-config.ts` — Workspace TISS config (CNES, CBO, council)
- `operadora.ts` — CRUD for insurance companies (Operadora model)
- `forms.ts` — Form template and response operations
- `form-template.ts` — Template management (create, duplicate, import from library)
- `form-response.ts` — Response lifecycle (create, save draft, complete, delete)
- `memed.ts` — registerMemedPrescriber, getMemedToken, syncMemedPrescription, disconnectMemedPrescriber
- `tour.ts` — getTourState, updateTourStep, completeTour, resetTour
- `_helpers.ts` — Shared helper with `getWorkspaceId()` and `getAuthContext()` (not used by server actions due to Vercel bundler issue, kept for future use)
- `calendar.ts` — Unified `getCalendarData()` server action (not used currently due to same bundler issue, kept for future use)

All actions authenticate via `auth()` from `@clerk/nextjs/server` and scope queries to the user's workspace.

### Key Components
- `src/components/create-prescription-dialog.tsx` — Modal with dynamic medication rows (add/remove), submits and opens print page
- `src/components/create-certificate-dialog.tsx` — Modal with type selector (atestado/declaracao/encaminhamento/laudo), conditional fields, auto-generated content
- `src/components/record-button.tsx` — Audio recording with LGPD consent modal
- `src/components/command-palette.tsx` — Ctrl+K / Cmd+K global search
- `src/components/notification-bell.tsx` — In-app notification dropdown
- `src/components/form-renderer.tsx` — Dynamic form renderer for all 11 field types, conditional visibility, validation
- `src/components/memed-prescription-panel.tsx` — Sheet embedding Memed digital prescription module
- `src/components/cid-autocomplete.tsx` — Reusable CID-10 autocomplete with single/multi modes, 300ms debounce, keyboard nav
- `src/app/(dashboard)/patients/[id]/merge-dialog.tsx` — Patient merge search + confirm
- `src/app/(dashboard)/patients/[id]/more-actions-dropdown.tsx` — Dropdown for secondary patient actions (Export, Merge, Deactivate)
- `src/app/(dashboard)/financial/edit-expense-dialog.tsx` — Edit expense modal, pre-filled with current data, saves via updateExpense
- `src/app/(dashboard)/financial/tiss-tab.tsx` — Financial tab for TISS guide management, batch XML export
- `src/app/(dashboard)/patients/[id]/tabs/imagens-tab.tsx` — Clinical images gallery with grid/timeline views, upload with camera capture, client-side compression, lightbox, before/after comparison, body region/category filters, pair management

### Calendar Components (`src/app/(dashboard)/calendar/`)
Decomposed from a monolithic page into modular sub-components:
- `types.ts` — Shared types (AgendaItem, AppointmentItem, PatientOption, ViewMode)
- `helpers.ts` — Shared helpers (constants, formatTime, isSameDay, buildAppointmentIndex, buildDayIndex, getBlockedSlotsForHour, getBlockedSlotsForDate)
- `components/week-view.tsx` — Week view with DnD, memo'd, O(1) appointment lookup via Map index
- `components/day-view.tsx` — Day view with now-line indicator, memo'd
- `components/month-view.tsx` — Month view, memo'd, O(1) day lookup via Map index
- `components/list-view.tsx` — List view, memo'd
- `components/schedule-form.tsx` — Self-contained schedule form with patient search
- `components/block-time-form.tsx` — Block time form, memo'd
- `components/appointment-card.tsx` — Appointment card with status actions, memo'd
- `components/conflict-dialog.tsx` — AlertDialog for scheduling conflicts (replaces native confirm())
- `components/now-line.tsx` — Week view "now" indicator using useRef (no re-renders)
- `components/now-line-day.tsx` — Day view "now" indicator

### AI Pipeline
- `src/lib/openai.ts` — `transcribeAudio(buffer, filename, vocabularyHints?)` via Whisper API
  - 60s timeout, `language: 'pt'`, `response_format: 'verbose_json'`
  - Medical vocabulary prompt + workspace procedure names as hints
  - MIME type detected from file extension (webm, mp4, wav, etc.)
  - Returns `{ text, duration }`
- `src/lib/claude.ts` — All calls use **tool_use** for structured JSON output (no regex parsing)
  - `extractEntities` — tool `extract_patient_data`, temperature:0, validates with Zod
  - `generateWorkspaceSuggestions` — tool `generate_workspace_config`, default temperature
  - `generateConsultationSummary` — tool `generate_consultation_summary`, temperature:0
  - `extractToolResult` helper: extracts tool_use block, validates, falls back to text parsing
  - `parseAIResponse` fallback: strips markdown fences, greedy JSON regex, Zod validation
  - 30s timeout, workspace config in user message (not system — anti-prompt-injection)
  - Empty transcript guard: throws if < 10 chars
- `src/lib/schemas.ts` — Zod schemas: `ExtractedPatientDataSchema`, `WorkspaceConfigSchema`, `AppointmentSummarySchema`, `CidCodeSchema`
- `src/data/cid10.json` — 1022 CID-10 codes in PT-BR (subcategory level). Static dataset from DATASUS
- `src/data/cid10-index.ts` — `searchCid(query, limit?)` accent-insensitive search on code+description, `getCidByCode(code)` for lookup
- `src/data/form-templates-library.ts` — 5 pre-built form templates (Anamnese Geral, Odontologica, Nutricional, SOAP, Retorno)
- `src/lib/storage.ts` — `uploadAudio`, `getSignedAudioUrl` (5min), `getAudioBuffer`, `uploadVideo` (Supabase `videos` bucket), `getSignedVideoUrl` (5min), `uploadClinicalImage` (clinical-images folder), `getSignedImageUrl` (5min), `deleteClinicalImage`
- `src/lib/image-compress.ts` — `compressImage(file, maxWidth?, quality?)` client-side canvas resize + JPEG compression. Default: 2048px max, 85% quality
- `src/lib/export-xlsx.ts` — `generateXlsx(data, sheetName)` and `generateXlsxMultiSheet(sheets)` for Excel export via `xlsx` library
- `src/lib/error-messages.ts` — Centralized error constants (pt-BR), `ActionError` class, `safeAction` wrapper, and `friendlyError(error, fallback?)` helper. See "Server Action Error Handling" section below
- `src/lib/viacep.ts` — `formatCep(value)` (formats as XXXXX-XXX) and `fetchAddressByCep(cep)` for ViaCEP integration (auto-fills street, neighborhood, city, state from CEP)

### NFS-e (Nota Fiscal de Servico Eletronica)
- `src/lib/nfse/client.ts` — `NfseClient` class for NuvemFiscal API (DPS Nacional format). Methods: `createDps` (emit NFS-e), `getDps`, `cancelDps`, `downloadPdf`, `registerCompany` (auto-register in NuvemFiscal), `uploadCertificate` (A1 digital cert), `configureNfse` (fiscal config with dynamic CST based on regime tributario). Factory: `createNfseClient()` reads OAuth token from NuvemFiscal
- `src/lib/gateway/types.ts` — Gateway-agnostic interfaces: `GatewayProvider`, `CreateChargeInput`, `CreateChargeResult`, `ChargeStatusResult`
- `src/lib/gateway/asaas-client.ts` — `AsaasClient` implements `GatewayProvider` for Asaas. Methods: `createCharge`, `getChargeStatus`, `cancelCharge`, `testConnection`. Auto-creates customers by CPF. Sandbox/production URLs
- `src/lib/gateway/index.ts` — Factory `createGatewayClient(config)` dispatches to provider implementation. Currently supports Asaas

### TISS Billing (ANS)
- `src/lib/tiss/constants.ts` — TISS version, TUSS codes, council types, guide statuses
- `src/lib/tiss/types.ts` — TypeScript interfaces for guides, config, operadoras
- `src/lib/tiss/xml-builder.ts` — XML generation for Guia Consulta + SP/SADT (ANS 4.01.00), batch envelope, SHA-256 hash
- `src/server/actions/tiss.ts` — createTissGuide, getTissGuides, updateTissGuideStatus, generateTissBatch, searchAppointmentsForTiss
- `src/server/actions/operadora.ts` — CRUD for insurance companies (Operadora model)
- `src/server/actions/tiss-config.ts` — Workspace TISS config (CNES, CBO, council)
- `src/app/(dashboard)/settings/tiss/page.tsx` — TISS settings + operadora management
- `src/app/(dashboard)/financial/tiss-tab.tsx` — Financial tab for guide management, batch export
- Prisma models: Operadora, TissConfig, TissGuide

### Form Builder
- `src/types/forms.ts` — FormFieldType (11 types), FormField, FormSection, FormTemplateData, FormResponseData
- `src/server/actions/forms.ts` — Form template and response operations
- `src/server/actions/form-template.ts` — Template management (create, duplicate, import from library)
- `src/server/actions/form-response.ts` — Response lifecycle (create, save draft, complete, delete)
- `src/components/form-renderer.tsx` — Dynamic renderer for all 11 field types, conditional visibility, validation
- `src/data/form-templates-library.ts` — 5 pre-built templates (Anamnese Geral, Odontologica, Nutricional, SOAP, Retorno)
- `src/app/(dashboard)/settings/sections/formularios-section.tsx` — Template management in settings
- `src/app/(dashboard)/settings/form-builder/[id]/page.tsx` — Visual form builder with field palette
- `src/app/(dashboard)/patients/[id]/tabs/formularios-tab.tsx` — Patient forms tab (replaces legacy Anamnese tab, with backward-compatible legacy view)
- Prisma models: FormTemplate, FormResponse

### Memed Digital Prescription
- `src/lib/memed/client.ts` — MemedClient class (register prescriber, get token, sync prescription, PDF URL)
- `src/hooks/use-memed.ts` — React hook managing Memed script lifecycle, MdHub commands/events
- `src/server/actions/memed.ts` — registerMemedPrescriber, getMemedToken, syncMemedPrescription, disconnectMemedPrescriber
- `src/components/memed-prescription-panel.tsx` — Sheet embedding Memed module
- `src/app/(dashboard)/settings/sections/memed-section.tsx` — Memed config (board code, number, UF)
- Prisma model: MemedPrescriber (per-user Memed registration with encrypted token)
- Prescription model enhanced: source (manual/memed), memedPrescriptionId, signedPdfUrl, memedDigitalLink
- Integration is FREE for software partners

### Guided Onboarding Tour
- `src/components/tour/tour-provider.tsx` — TourProvider context (manages state, auto-start, server persistence)
- `src/components/tour/tour-steps.ts` — 10 desktop steps + mobile adaptation
- `src/server/actions/tour.ts` — getTourState, updateTourStep, completeTour, resetTour
- User model: tourCompleted, tourStep fields
- Data attributes: `data-tour="nav-pacientes"`, `data-tour="hero-card"`, etc. on key UI elements
- "Refazer tour" button in Settings

### Digital Signature (ICP-Brasil) — Schema Ready
- Prescription + MedicalCertificate models have signature fields: signedPdfUrl, signedAt, signatureProvider, certificateSerial, certificateSubject, signedByUserId, verificationToken
- SignatureConfig model: per-workspace signing configuration (supports A1 server, BirdID, VIDaaS, WebPKI methods)
- `src/app/verificar/[token]/page.tsx` — Public verification page (LGPD-safe, masked patient data)
- Actual signing logic (pdf-lib + BirdID) planned for future phase

### Excel Export API Routes
- `src/app/api/export/patients/route.ts` — GET, auth via Clerk, exports all active patients as .xlsx with columns: Nome, CPF, RG, Telefone, Email, Data Nascimento, Sexo, Convenio, Origem, Tags, Cadastrado em, Ultimo Atendimento
- `src/app/api/export/reports/route.ts` — GET, auth via Clerk, accepts `period` query param (3m/6m/12m), exports multi-sheet .xlsx (Resumo, Mensal, Procedimentos)

### Confirmation-before-save Pattern
AI-extracted data is NEVER saved automatically to the final record:
- **Voice registration:** `processVoiceRegistration` creates a Recording with extracted data. Patient + Appointment are only created in `confirmPatientRegistration` after professional review.
- **Consultation:** `processConsultation` creates a Recording and returns summary. Review page fetches data server-side via `getRecordingForReview(recordingId)`. Appointment is only created in `confirmConsultation` after professional review.

### Transaction Safety
All multi-step mutations are wrapped in `db.$transaction()`:
- `confirmPatientRegistration`: Patient.create → Appointment.create → Recording.update (atomic)
- `confirmConsultation`: Recording.findUnique (double-confirm guard) → Appointment.create → Recording.update
- `generateWorkspace`: User.upsert → Workspace.upsert → User.update (onboardingComplete)
- `mergePatients`: Move appointments/recordings/documents/treatmentPlans → Merge tags/alerts/medicalHistory → Fill missing fields → Soft-delete merged patient
- `scheduleRecurringAppointments`: Creates 2-52 appointments atomically (weekly/biweekly pattern)

### Audio Recording
`src/components/record-button.tsx` — Client component using MediaRecorder API. Props:
- `onRecordingComplete`, `maxDuration`, `size`, `floating`, `disabled`
- `requireConsent` (default: true) — Shows LGPD consent modal before first recording
- Audio blobs are kept in memory only (never cached locally per LGPD)
- Audio size validated server-side (max 25MB)
- Codec priority: webm/opus > webm > mp4 > browser default

### Email & Reminders
- `src/lib/email.ts` — Resend wrapper, graceful fallback if RESEND_API_KEY not set
- `src/lib/email-templates.ts` — `appointmentReminder()`, `appointmentConfirmation()` (HTML, pt-BR)
- `src/app/api/reminders/route.ts` — POST endpoint for cron (auth via CRON_SECRET header)

### WhatsApp Business API Integration
- `src/lib/whatsapp/types.ts` — TypeScript types for Meta Cloud API (webhook payloads, outgoing messages, templates, embedded signup)
- `src/lib/whatsapp/client.ts` — `WhatsAppClient` class using native `fetch` (no axios). Factory: `createWhatsAppClient(workspaceId)` reads credentials from `WhatsAppConfig` table via Prisma.
- `src/app/api/whatsapp/webhook/route.ts` — GET (Meta webhook verification via `WHATSAPP_WEBHOOK_VERIFY_TOKEN`), POST (async processing of incoming messages and status updates)
- `src/app/(dashboard)/settings/whatsapp/page.tsx` — 5-step setup wizard (intro, connect via Facebook Embedded Signup, verify/manual config, templates info, done)
- Prisma models: `WhatsAppConfig` (per-workspace credentials), `WhatsAppConversation` (contact threads), `WhatsAppMessage` (individual messages with status tracking)
- Config lookup in webhook: identifies workspace by `phoneNumberId` (not by auth, since webhooks are unauthenticated)
- Conversations are upserted on incoming messages (unique by `[workspaceId, contactPhone, configId]`)

### Multi-tenant via Prisma
Every query must be scoped to the user's workspace. Pattern:
```typescript
const { userId } = await auth()
const user = await db.user.findUnique({ where: { clerkId: userId }, include: { workspace: true } })
const workspaceId = user.workspace.id
// All queries filter by workspaceId
```

### RBAC & Permissions
- `src/lib/permissions.ts` — 5 roles (owner/admin/doctor/secretary/viewer), 20 permissions, `hasPermission(role, permission)`, `normalizeRole()` (handles legacy "member" → "doctor")
- `src/lib/auth-context.ts` — `resolveWorkspaceRole()` resolves clerkId to workspace role (owner via Workspace.userId, member via WorkspaceMember.role)
- Navigation filtered by role in `nav-sidebar.tsx` and `nav-bottom.tsx`
- Settings guarded by `settings.view` permission in `src/app/(dashboard)/settings/layout.tsx`
- Team invites support expanded roles: admin, doctor, secretary, viewer

### JSONB for Dynamic Fields
Workspace stores profession-specific config as JSON: `customFields`, `procedures` (each with id, name, category, price?, duration? in minutes), `anamnesisTemplate`, `categories`. Patient stores `customData`, `alerts`, and `medicalHistory` as JSON. This avoids schema changes per profession.

## Key Domain Entities (Prisma)

- **User**: clerkId, role (user/superadmin), profession, clinicName, onboardingComplete, tourCompleted, tourStep → has one Workspace
- **Workspace**: professionType, customFields, procedures, anamnesisTemplate, categories, plan (free/starter/professional/clinic), planStatus (trialing/active/past_due/canceled), stripeCustomerId, stripeSubId, trialEndsAt → has many Patients, Appointments, Recordings
- **Patient**: belongs to Workspace. name, document (CPF, unique per workspace), rg, gender, address (JSON: street/number/complement/neighborhood/city/state/zipCode), insurance (convenio), guardian (responsavel), source (origin: instagram/google/indicacao/convenio/site/facebook/outro), tags (String[]), medicalHistory (JSON: allergies/chronicDiseases/medications/bloodType/notes), customData, alerts, isActive (soft delete), whatsappConsent, whatsappConsentAt. Has many Appointments, Recordings, TreatmentPlans, FormResponses, TissGuides
- **Appointment**: links Patient + Workspace + Agenda. date, procedures, notes, aiSummary, audioUrl, transcript, status (scheduled/completed/cancelled/no_show). Conflict detection scoped per agenda
- **TreatmentPlan**: links Patient + Workspace. name, procedures, totalSessions, completedSessions, status (active/completed/cancelled/paused), notes, startDate, estimatedEndDate, completedAt
- **Notification**: workspaceId, userId, type (appointment_soon/appointment_missed/treatment_complete/system), title, body, entityType, entityId, read. Polling-based (60s)
- **PatientDocument**: links Patient + Workspace. name, url (Supabase Storage), type (image/pdf/other), mimeType, fileSize. 10MB limit, signed URLs
- **ClinicalImage**: links Patient + Workspace + Appointment?. url (Supabase Storage path), thumbnailUrl?, mimeType, fileSize, bodyRegion? (face/torso_front/torso_back/arm/leg/mouth/teeth/skin/other), category (before/after/progress/general/intraoral), pairedImageId? (self-relation for before/after), annotations (Json), tags (String[]), notes?, takenAt?, createdBy. Indexes: [workspaceId, patientId], [workspaceId, patientId, bodyRegion], [workspaceId, patientId, category], [appointmentId]
- **WorkspaceMember**: workspaceId, userId, role (admin/doctor/secretary/viewer). Links User to Workspace with specific role
- **WorkspaceInvite**: workspaceId, email, role, token (unique), invitedBy, status (pending/accepted/expired), expiresAt (7 days)
- **WhatsAppConfig**: workspaceId, phoneNumberId, wabaId, displayPhoneNumber, businessName, accessToken, webhookSecret, isActive. `@@unique([workspaceId, phoneNumberId])`
- **WhatsAppConversation**: workspaceId, configId, contactPhone, contactName, lastMessageAt, lastMessagePreview, status (open/closed/pending/bot), assignedTo, tags, unreadCount. `@@unique([workspaceId, contactPhone, configId])`
- **WhatsAppMessage**: conversationId, workspaceId, waMessageId (unique), direction (inbound/outbound), type, content, mediaUrl, status (pending/sent/delivered/read/failed)
- **Recording**: audioUrl, transcript, aiExtractedData, status (pending/processed), workspaceId, errorMessage, fileSize, duration
- **Prescription**: patientId, workspaceId, appointmentId?, medications (JSON), notes, source (manual/memed), memedPrescriptionId, signedPdfUrl, memedDigitalLink. ICP-Brasil fields: signedAt, signatureProvider, certificateSerial, certificateSubject, signedByUserId, verificationToken. Print-to-PDF via `/prescriptions/[id]`
- **MedicalCertificate**: patientId, workspaceId, type (atestado/declaracao_comparecimento/encaminhamento/laudo), content, days?, cid?, cidDescription?. ICP-Brasil fields: signedPdfUrl, signedAt, signatureProvider, certificateSerial, certificateSubject, signedByUserId, verificationToken. Print-to-PDF via `/certificates/[id]`
- **Agenda**: workspaceId, name, color (hex), isDefault, isActive. One default agenda per workspace ("Agenda Principal"). Appointments and BlockedSlots belong to an agenda. Multiple agendas per workspace for multi-professional clinics
- **BookingConfig**: workspaceId (unique), token (unique, public URL), isActive, allowedAgendaIds, allowedProcedureIds, maxDaysAhead (default 30), startHour (default 8), endHour (default 18), welcomeMessage. Controls public online booking page
- **BlockedSlot**: workspaceId, agendaId, title, startDate, endDate, allDay, recurring (null=one-time, "weekly"=repeats). Shown as gray bars in calendar
- **NpsSurvey**: workspaceId, patientId, appointmentId? (unique), score (0-10), comment, token (unique, public access), sentAt, answeredAt. Public survey page at `/nps/[token]`
- **AuditLog**: workspaceId, userId, action, entityType, entityId, details (Json)
- **ConsentRecord**: workspaceId, patientId?, recordingId?, consentType, givenBy, givenAt
- **UsageRecord**: workspaceId, period (YYYY-MM), metric (patients/appointments/recordings/storage_mb/whatsapp_messages), value. `@@unique([workspaceId, period, metric])`
- **Charge**: workspaceId, patientId, appointmentId?, treatmentPlanId?, description, totalAmount (centavos), discount, netAmount, status (pending/partial/paid/overdue/cancelled), createdBy. Has many Payments
- **Payment**: chargeId, workspaceId, installmentNumber, totalInstallments, amount (centavos), dueDate, paidAt, paidAmount, paymentMethod, status (pending/paid/overdue/cancelled/refunded). Gateway fields: gatewayProvider, gatewayChargeId, gatewayStatus, paymentLink, pixQrCode, pixCopiaECola, boletoUrl, boletoBarcode, webhookReceivedAt
- **GatewayConfig**: workspaceId (unique), provider ("asaas"/"stripe"), apiKey (encrypted), walletId?, webhookSecret?, isActive, sandboxMode. Per-workspace payment gateway configuration
- **GatewayWebhookLog**: workspaceId, provider, eventType, paymentId?, rawPayload (Json), processed. `@@index([workspaceId, createdAt])`, `@@index([paymentId])`
- **Expense**: workspaceId, categoryId?, description, amount (centavos), dueDate, paidAt, paymentMethod, status, recurrence (null/monthly/weekly/yearly), parentId (self-relation for recurring)
- **ExpenseCategory**: workspaceId, name, color, icon. Workspace-scoped expense categories
- **NfseConfig**: workspaceId (unique), fiscal config for NFS-e emission (CNPJ, ISS, regime tributario, certificate)
- **Nfse**: workspaceId, appointmentId?, NFS-e record (numero, status, XML, PDF URL)
- **Operadora**: workspaceId, registroAns (6-digit ANS number), nome, cnpj?. Insurance company for TISS. `@@unique([workspaceId, registroAns])`
- **TissConfig**: workspaceId (unique), provider identification (CNES, CBO), professional council (type/number/UF), versaoTiss, sequencialGuia
- **TissGuide**: workspaceId, operadoraId, patientId, appointmentId?, type (consulta/sp_sadt), numeroGuia, numeroCarteira, procedimentos (JSON), dataAtendimento, valorTotal (centavos), xmlContent, xmlHash, status (draft/submitted/paid/denied/cancelled), cidCode, cidDescription. Extensive indexes
- **FormTemplate**: workspaceId, name, description, category (anamnese/avaliacao/consentimento/retorno/custom), fields (JSON: FormField[]), sections (JSON), isActive, isDefault, allowMultiple, version
- **FormResponse**: workspaceId, templateId, patientId, appointmentId?, answers (JSON: Record<string, unknown>), templateVersion, status (draft/completed), completedAt, completedBy
- **MemedPrescriber**: workspaceId, userId, memedExternalId, memedToken (encrypted), boardCode, boardNumber, boardState, status (pending/active/inactive). `@@unique([workspaceId, userId])`
- **SignatureConfig**: workspaceId (unique), useNfseCertificate, cloudProvider (birdid/vidaas), cloudClientId, cloudClientSecret (encrypted), defaultMethod (none/a1_server/birdid/vidaas/webpki)
- **DpoRequest**: name, email, requestType (acesso/correcao/exclusao/portabilidade/revogacao/informacao/oposicao/outro), description, status (pending/in_progress/resolved/rejected), response, resolvedAt. Public submission via `/api/dpo`
- **MigrationSession**: Tracks data migration progress
- **InventoryCategory**: workspaceId, name, icon?, color?. `@@unique([workspaceId, name])`
- **InventoryItem**: workspaceId, categoryId? (relation to InventoryCategory), name, sku?, unit (un/ml/g/cx/par/fr), currentStock, minStock, costPerUnit (centavos), supplier?, isActive (soft delete), notes?. Has many InventoryMovement. `@@unique([workspaceId, name])`
- **InventoryMovement**: workspaceId, itemId, type (in/out/adjustment), quantity, reason (compra/uso/perda/vencimento/ajuste/devolucao), appointmentId?, createdBy (clerkId), notes?

### Key Constraints & Indexes
- `@@unique([workspaceId, document])` on Patient — CPF unique per workspace (nulls allowed)
- `@@index([workspaceId, name])` on Patient — composite for search
- `@@index([workspaceId, date])` on Appointment — for calendar queries
- `@@index([agendaId, status, date])` on Appointment — for calendar filtering by agenda
- `@@unique([workspaceId, registroAns])` on Operadora — ANS number unique per workspace
- `@@unique([workspaceId, userId])` on MemedPrescriber — one prescriber per user per workspace
- `@@index([workspaceId, status])` on TissGuide — for guide listing/filtering
- Recording.workspaceId — multi-tenant isolation on recordings

## Business Rules

### Data Integrity
1. **Confirmation-before-save**: AI-extracted data is NEVER saved automatically. Professional must review and confirm.
2. **Atomic transactions**: All multi-step DB operations use `db.$transaction()`.
3. **Double-confirm guard**: `confirmConsultation` checks `recording.appointmentId == null` inside transaction to prevent duplicate appointments from double-clicks.
4. **Duplicate patient detection & merge**: By CPF (normalized, both formatted/unformatted) and by name (case-insensitive contains). `@@unique([workspaceId, document])` enforces at DB level. `mergePatients()` allows merging two records: keeps target, transfers all related records (appointments, recordings, documents, treatment plans), merges tags/alerts/medicalHistory (union), fills missing fields from source, then soft-deletes source. UI via MergeDialog on patient detail page.
5. **Soft delete for patients**: `isActive` flag. `getPatients` filters `isActive: true`. Records retained for CFM 20-year requirement.
6. **Appointment conflict detection**: `checkAppointmentConflicts()` checks ±30min window. `scheduleAppointment()` rejects with `CONFLICT:` prefix error. UI shows confirm dialog, `forceSchedule: true` bypasses.
7. **Automated appointment reminders**: Cron sends reminders 24h before. WhatsApp (preferred, with interactive confirm/cancel buttons) → email fallback. Patient can confirm via button click or text reply ("sim"/"nao"). Webhook processes button_reply IDs (`confirm_<id>`, `cancel_<id>`) and text replies to update appointment status.
8. **Birthday messages**: Daily cron checks birthDate (month+day match). WhatsApp preferred → email fallback. Runs via `/api/birthdays` with CRON_SECRET auth.

### WhatsApp Consent (LGPD)
- Patient.whatsappConsent must be true before sending WhatsApp messages
- Explicit sends (sendAppointmentMessage) hard-block on missing consent
- Cron-based sends (reminders, birthdays, NPS) soft-degrade to email fallback
- Online booking auto-grants consent (patient provides phone voluntarily)
- Toggle in patient Resumo tab to grant/revoke

### Read Access Audit (CFM 1.821/2007)
- `getPatient()` logs "patient.viewed" to AuditLog (fire-and-forget)
- `getAudioPlaybackUrl()` logs "recording.accessed"
- `getRecordingForReview()` logs "recording.accessed"
- Credential access logged as "credential.accessed" (NFS-e API key, WhatsApp token)

### Security & Privacy (LGPD)
1. **LGPD consent**: Required before audio recording (enforced in RecordButton). ConsentRecord stored in database.
2. **No PHI in URLs**: Review page fetches data server-side via recordingId. Transcript and summary are NEVER passed as URL query parameters.
3. **Signed URLs**: Audio accessed only via 5-minute signed URLs from Supabase Storage.
4. **Audio never cached locally**: Blobs kept in memory only, discarded after upload.
5. **Multi-tenant isolation**: All queries scoped by workspaceId. Recording model has workspaceId for isolation.
6. **Environment validation**: All API keys validated at startup via Zod (`src/lib/env.ts`). App fails fast on missing variables.
7. **Audit logging**: All CRUD operations on Patient, Appointment, Recording log to AuditLog. Read access also logged (see above).
8. **Data residency**: All data in Brazilian infrastructure (sa-east-1).
9. **DPO contact page**: Public `/dpo` page for LGPD Art. 41/18 data subject requests. 15-day response SLA.
10. **Privacy policy & terms**: Public pages at `/privacidade` and `/termos`.

### AI Pipeline
1. **Timeouts**: OpenAI 60s, Anthropic 30s. Prevents indefinite hangs.
2. **Structured output**: Claude uses tool_use for guaranteed JSON. No fragile regex as primary path.
3. **Vocabulary hints**: Workspace procedure names passed to Whisper as prompt for better pt-BR medical transcription.
4. **Empty transcript guard**: Extraction functions reject transcripts < 10 chars to prevent hallucinated data.
5. **Prompt injection mitigation**: Workspace config (user-controlled data) goes in user message, not system message.
6. **CID-10 integration**: 1022 codes from DATASUS, accent-insensitive search, autocomplete component. Used in certificates and TISS guides.

### Audio
1. **File size limit**: 25MB max (enforced server-side). Prevents OOM in serverless.
2. **MIME detection**: Detected from filename extension, not hardcoded. Supports webm, mp4, wav, ogg, flac, mp3.
3. **Appointment status**: scheduled → completed / cancelled / no_show. Default is "completed" for voice-recorded consultations.

## UI/UX

- Mobile-first, minimal interface. RecordButton is the primary UI element.
- Palette: teal/verde-agua primary (#14B8A6), Inter font (latin-ext for pt-BR), JetBrains Mono for code/data, 10px base radius, Lucide icons.
- Subtle cool-tinted background, cards with border/shadow instead of hard rings.
- Fields with AI confidence < 0.8 highlighted in amber (border-vox-warning).
- All UI in Brazilian Portuguese (pt-BR). Dates DD/MM/AAAA, phone +55 DDD, CPF validation.
- Navigation: sidebar on desktop (w-56, 5 items), bottom nav on mobile (grid-cols-5). Both role-filtered via RBAC.
- Dashboard: stat cards (4), today's agenda, recent activity, quick actions in compact horizontal row. Agenda/activity full-width layout.
- Calendar: Modular architecture (12 sub-components). Month/week/day/list views, scheduling, quick status actions. Week view supports drag & drop rescheduling (@dnd-kit/core). Time blocking (gray bars for lunch/holidays/etc). Recurring appointments (weekly/biweekly). Red "now" indicator line in week/day views (useRef, no re-renders), auto-scrolls to current hour on mount. Multiple agendas with color-coded filter pills, agenda selector in schedule/block forms, colored left-border on appointments. Client-side cache (Map, 60s TTL) for fast prev/next navigation. O(1) appointment lookup via Map indexes. ConflictDialog (AlertDialog) replaces native confirm(). All sub-components React.memo'd.
- Patient detail: hero with tags/insurance, action buttons (Prescricao, Atestado, Memed). Secondary actions in "Mais" dropdown (Export, Merge, Deactivate). Empty fields hidden by default with "Mostrar todos" toggle. Tabs: Resumo, Historico, Tratamentos, Prescricoes, Documentos, Gravacoes, Formularios.
- Empty states with contextual CTAs (Tratamentos, Documentos, Gravacoes, Formularios).
- Prescriptions & certificates: print-friendly pages (Ctrl+P → PDF). Memed prescriptions have digital signature link.
- Reports: KPI cards (revenue, appointments, return rate, no-show, NPS), charts (revenue, new patients, status pie), rankings (top patients by frequency/revenue), procedure ranking, hour heatmap. Excel export.
- NPS survey: public token-based page at `/nps/[token]` with 0-10 score grid + comment.
- Audio playback: signed URL player in patient recordings tab.
- Guided onboarding tour: 10-step tour for new users, auto-starts after onboarding, "Refazer tour" in Settings.
- Error states shown to users (no silent catches). Toast/banner pattern.
- Error messages: all user-facing errors are in pt-BR via centralized constants in `src/lib/error-messages.ts`. No `alert()` — all errors via Sonner toasts or inline Alert components.

### Server Action Error Handling (CRITICAL)
**Next.js in production sanitizes `Error.message` from server actions** — the client receives a generic message with a numeric `digest` hash, NEVER the original error text. This is a security feature that cannot be disabled.

**Solution — `safeAction` wrapper pattern** (`src/lib/error-messages.ts`):
- `ActionError` — custom error class for expected/business-logic errors (validation, plan limits, conflicts)
- `safeAction(fn)` — wrapper that catches `ActionError` and returns `{ error: "message" }` instead of throwing
- `friendlyError(result)` — also handles `{ error: string }` objects from `safeAction`

**Server action pattern:**
```typescript
import { ActionError, safeAction } from "@/lib/error-messages"
export const createAgenda = safeAction(async (data: { name: string }) => {
  if (!data.name.trim()) throw new ActionError("Nome da agenda e obrigatorio")
  // ... success path
  return { id: agenda.id, name: agenda.name }
})
```

**Frontend pattern:**
```typescript
const result = await createAgenda({ name })
if ('error' in result) { toast.error(result.error); return }
toast.success("Agenda criada")
// result.id, result.name available here
```

**Rules:**
1. Use `throw new ActionError("msg")` for expected user-facing errors (validation, limits, business rules)
2. Use `throw new Error(ERR_UNAUTHORIZED)` (regular Error) for auth errors — caught by error boundaries
3. Always wrap exported mutation functions with `safeAction()`
4. Always check `'error' in result` on the frontend before using the result
5. The try/catch on the frontend still catches unexpected errors (network failures, etc.)

References: [Next.js Error Handling Docs](https://nextjs.org/docs/app/getting-started/error-handling), [joulev.dev Blog](https://joulev.dev/blogs/throwing-expected-errors-in-react-server-actions)

## GitHub Project & Issue Tracking

- **Repo:** [vox-clinic/vox-clinic](https://github.com/vox-clinic/vox-clinic) (public, org `vox-clinic`)
- **Project board:** [VoxClinic Roadmap](https://github.com/orgs/vox-clinic/projects/1) — Kanban with columns: Backlog → Ready → In progress → In review → Done
- **Project fields:** Status, Priority (P0/P1/P2), Size (XS/S/M/L/XL), Start date, Target date

### Milestones
- **MVP** — 7 essential issues: agendamento online, multiplas agendas, contas a receber, fluxo de caixa, NFS-e, billing/Stripe, teleconsulta

### Labels
- **Category labels:** `agendamento`, `comunicacao`, `financeiro`, `prontuario-ia`, `prescricoes-documentos`, `relatorios`, `seguranca-lgpd`, `admin`, `infraestrutura`, `telemedicina`, `marketing`, `integracoes`, `portal-paciente`, `estoque`
- **Priority labels:** `essential` (P0), `important` (P1), `differential` (P2)

### Issue Naming Convention
Issues follow the roadmap ID prefix: `[a07] Agendamento online (paciente)`, `[f04] Contas a receber`, etc. The ID maps to the roadmap in `src/app/(admin)/admin/roadmap/page.tsx`.

### Workflow
- When implementing a roadmap item, move its issue to "In progress" on the board and create a branch from it
- When opening a PR, reference the issue (`Closes #N`) so it auto-closes on merge
- Update the roadmap page status from `planned` → `in_progress` → `done` alongside the code change

## Environment Variables

Required (validated by `src/lib/env.ts`):
- `DATABASE_URL` — PostgreSQL via PgBouncer (port 6543)
- `DIRECT_URL` — PostgreSQL direct (port 5432, for migrations)
- `ANTHROPIC_API_KEY` — Claude API (starts with sk-ant-)
- `OPENAI_API_KEY` — Whisper API
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role (server-side only)

Optional:
- `CLERK_WEBHOOK_SECRET` — For webhook signature verification (not needed in local dev)
- `RESEND_API_KEY` — For email reminders (graceful fallback if missing)
- `CRON_SECRET` — For authenticating cron-triggered endpoints (reminders, birthdays, NPS)
- `NEXT_PUBLIC_APP_URL` — Base URL for public links (NPS survey URLs). Defaults to `https://app.voxclinic.com`
- `SUPERADMIN_EMAILS` — Comma-separated emails auto-assigned superadmin role on Clerk webhook
- `ENCRYPTION_KEY` — 64 hex chars (32 bytes) for encrypting sensitive tokens (Memed, WhatsApp)
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` — For Meta webhook verification handshake
- `NEXT_PUBLIC_META_APP_ID` — Meta App ID for Facebook Embedded Signup
- `NEXT_PUBLIC_META_CONFIG_ID` — Meta config ID for Embedded Signup flow
- `STRIPE_SECRET_KEY` — Stripe API key for billing
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signature verification
- `STRIPE_PRICE_PRO` — Stripe price ID for Professional plan
- `STRIPE_PRICE_ENTERPRISE` — Stripe price ID for Enterprise plan
- `DAILY_API_KEY` — Daily.co API key for teleconsulta room creation
- `DAILY_WEBHOOK_SECRET` — Daily.co webhook signature verification for recording events
- `MEMED_API_KEY` — Memed Digital API key for prescription integration
- `MEMED_SECRET_KEY` — Memed Digital secret key
- `MEMED_API_URL` — Memed API base URL (defaults to production)
- `MEMED_SCRIPT_URL` — Memed frontend script URL (defaults to production)

Implicit (Clerk SDK):
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`

See `.env.example` for full list with placeholder values.

## Webhook (Clerk)

`src/app/api/webhooks/clerk/route.ts` handles:
- `user.created` — upsert User in database
- `user.updated` — sync email/name changes
- `user.deleted` — cascade delete user and related data

Note: In local dev without webhook access, `generateWorkspace` does user upsert as fallback.

## Public Docs Page

`src/app/docs/page.tsx` — Public feature documentation page at `/docs` (no auth required).

**IMPORTANT FOR ALL AGENTS:** When implementing new features or modifying existing ones, you MUST update this page in the same commit:
1. Add/update the `<FeatureCard>` in the correct `<CategorySection>`
2. Increment `FEATURES_SUMMARY.total` counter
3. Update `lastUpdated` date constant
4. Add new categories if needed (follow the existing pattern)
