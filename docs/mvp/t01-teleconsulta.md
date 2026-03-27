# [t01] Teleconsulta por Video — Implementation Document

> **Issue:** [#24](https://github.com/vox-clinic/vox-clinic/issues/24)
> **Priority:** Essential | **Effort:** High | **Milestone:** MVP
> **Description:** Videochamada integrada (WebRTC/Daily.co)

---

## 1. Problem Statement

VoxClinic currently supports only in-person appointments. There is no video consultation capability. With telemedicine being standard practice post-pandemic (and regulated by CFM Resolution 2.314/2022), professionals need integrated video calls to:
- Consult patients remotely
- Record video sessions for medical records
- Maintain the same AI-powered transcription pipeline for remote consultations
- Send join links via WhatsApp/email (existing notification infrastructure)

---

## 2. Video API Comparison

| Criteria | **Daily.co** | **LiveKit** | **Twilio Video** |
|----------|-------------|-------------|-----------------|
| Open source | No | Yes (self-host or cloud) | No |
| HIPAA/LGPD | SOC-2, HIPAA BAA, GDPR | SOC-2 Type II, HIPAA, GDPR | HIPAA, SOC-2 |
| Next.js integration | Excellent (Prebuilt iframe) | Excellent (React SDK) | Good (React SDK) |
| Waiting room | Built-in (knocking) | Via room metadata | Built-in |
| Screen sharing | Built-in | Built-in | Built-in |
| Cloud recording | Native | Egress service | Compositions API |
| E2E encryption | Yes | Yes | No |
| Free tier | 10,000 min/month | 60 min/month | 5,000 min/month |
| Pricing | $0.04/min (Scale) | $0.02/min video | ~$0.004/min |
| Embed complexity | Very low (iframe) | Medium | Medium |
| AI integration | Daily Bots (voice AI) | Agents framework | None |

### Cost Estimate (500 teleconsultas/month, ~20 min avg = 10,000 participant-min)
- **Daily.co:** Free tier covers it. Scale plan for overages at $0.04/min.
- **LiveKit Cloud:** ~$200/month
- **Twilio:** ~$40/month

### Recommendation: Daily.co

1. **Fastest to MVP:** Daily Prebuilt gives a complete video UI (camera/mic controls, screen share, waiting room, chat) embeddable via iframe. No custom video UI needed.
2. **HIPAA BAA available:** Critical for healthcare.
3. **Generous free tier:** 10,000 min/month covers early-stage usage.
4. **Already mentioned in the issue:** The issue text explicitly says "WebRTC/Daily.co".
5. **Cloud recording:** Native recording can feed into the existing Whisper transcription pipeline.
6. **Low maintenance:** Fully managed, no infrastructure.

---

## 3. Current System State

### What We Already Have
| Asset | Location | Notes |
|-------|----------|-------|
| Appointment model | Prisma schema | Has `audioUrl`, `transcript`, `aiSummary`, `status`, `date`, `agendaId` |
| Audio recording | `src/components/record-button.tsx` | MediaRecorder API + LGPD consent modal |
| Whisper transcription | `src/lib/openai.ts` | `transcribeAudio(buffer, filename, hints)` |
| AI summary | `src/lib/claude.ts` | `generateConsultationSummary()` |
| Appointment scheduling | `src/server/actions/appointment.ts` | Conflict detection, advisory locks, recurring |
| WhatsApp reminders | `src/server/actions/reminder.ts` | Sends appointment links via WhatsApp |
| Email reminders | `src/lib/email.ts` | Sends via Resend |
| BookingConfig | Prisma schema | Public online booking (token-based) |
| Consent system | `ConsentRecord` model | LGPD consent tracking |
| Supabase Storage | `src/lib/storage.ts` | Audio file storage with signed URLs |

### What's Missing
- No video-related fields on Appointment
- No Daily.co integration code
- No teleconsulta pages (professional or patient)
- No video recording → transcription pipeline

---

## 4. Schema Changes

Minimal additions to existing `Appointment` model:

```prisma
model Appointment {
  // ... existing fields ...
  type              String?   // "presencial" | "teleconsulta" (null = presencial for backward compat)
  videoRoomName     String?   // Daily room name
  videoRoomUrl      String?   // Daily room URL for joining
  videoRecordingUrl String?   // Cloud recording download URL (post-call)
}
```

No new models needed. The appointment is the central entity — a teleconsulta is just an appointment with `type = "teleconsulta"` and video room info.

---

## 5. Daily.co Client

**File:** `src/lib/daily.ts`

```typescript
const DAILY_API_URL = 'https://api.daily.co/v1'

// Create a private room for a teleconsulta
export async function createVideoRoom(appointmentId: string, expiresAt: Date) {
  const res = await fetch(`${DAILY_API_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: `vox-${appointmentId}`,
      privacy: 'private',
      properties: {
        exp: Math.floor(expiresAt.getTime() / 1000),
        enable_knocking: true,        // waiting room
        enable_screenshare: true,
        enable_chat: true,
        enable_recording: 'cloud',     // cloud recording
        start_audio_off: false,
        start_video_off: false,
        lang: 'pt',
      },
    }),
  })
  return res.json() // { name, url, ... }
}

// Generate a meeting token (controls permissions)
export async function createMeetingToken(roomName: string, opts: {
  isOwner: boolean      // professional = owner, patient = not
  userName: string
  expiresAt: Date
}) {
  const res = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: opts.isOwner,
        user_name: opts.userName,
        exp: Math.floor(opts.expiresAt.getTime() / 1000),
        enable_recording: opts.isOwner ? 'cloud' : undefined,
      },
    }),
  })
  return res.json() // { token }
}

// Delete room after call
export async function deleteVideoRoom(roomName: string) {
  await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${env.DAILY_API_KEY}` },
  })
}
```

**No npm package needed** — native `fetch` (same pattern as WhatsApp client).

---

## 6. Server Actions

**File:** `src/server/actions/teleconsulta.ts`

| Action | Description |
|--------|-------------|
| `createTeleconsultaRoom(appointmentId)` | Creates Daily room, generates professional token, updates appointment with `videoRoomName` + `videoRoomUrl`. |
| `getPatientJoinInfo(appointmentId, token)` | Validates patient access token, generates patient meeting token. Public (no auth). |
| `endTeleconsulta(appointmentId)` | Marks call as ended, triggers recording retrieval. |
| `processVideoRecording(appointmentId, recordingUrl)` | Downloads recording audio track, sends to Whisper, runs AI summary (reuses existing pipeline). |

### Modifications to Existing Actions

**`src/server/actions/appointment.ts`:**
- `scheduleAppointment()` — Accept `type` parameter. If `teleconsulta`, auto-create Daily room.
- Calendar display — Show video icon for teleconsulta appointments.

**`src/server/actions/reminder.ts`:**
- Include teleconsulta join link in WhatsApp/email reminders for teleconsulta appointments.

---

## 7. Pages

### 7.1 Professional Video Room

**File:** `src/app/(dashboard)/teleconsulta/[id]/page.tsx`

- Authenticated (Clerk)
- Loads Daily Prebuilt iframe with owner token
- Controls: admit waiting patients, start/stop recording, screen share, end call
- Post-call: auto-trigger recording processing

```tsx
// Daily Prebuilt iframe — the entire video UI in one line
<iframe
  src={`${roomUrl}?t=${ownerToken}`}
  allow="camera; microphone; fullscreen; display-capture"
  style={{ width: '100%', height: '100vh', border: 'none' }}
/>
```

**Sidebar panel (optional for MVP):**
- Patient info summary
- Quick notes field
- "Gerar Receita" / "Gerar Atestado" buttons (existing functionality)

### 7.2 Patient Join Page (Public)

**File:** `src/app/teleconsulta/[token]/page.tsx`

- **No auth required** (same pattern as `/booking/[token]` and `/nps/[token]`)
- Token-based access (appointment-specific, time-limited)
- Flow:
  1. Pre-call: Device check (camera/mic permissions), patient name confirmation
  2. LGPD consent modal (teleconsulta consent type)
  3. Join waiting room (Daily Prebuilt iframe with patient token)
  4. Professional admits
  5. Video call

### 7.3 Calendar Integration

On the calendar, teleconsulta appointments show:
- Video camera icon (Lucide `video` icon)
- Different color or badge for visual distinction
- **"Iniciar Teleconsulta"** button (appears 15 min before scheduled time)
- Button creates room (if not exists) and navigates to `/teleconsulta/[id]`

---

## 8. Patient Join Link Flow

```
Appointment scheduled (type: teleconsulta)
  → Room created (Daily API)
  → Reminder sent via WhatsApp/email with join link:
    "Sua teleconsulta com Dr. X e amanha as 14:00.
     Acesse: https://app.voxclinic.com/teleconsulta/abc123"
  → Patient clicks link → pre-call screen → waiting room
  → Professional clicks "Iniciar" → admits patient
  → Video call
  → Call ends → recording processed → transcript + AI summary
```

---

## 9. Post-Call Recording Pipeline

Reuses the existing audio processing infrastructure:

```
Daily cloud recording completes
  → Webhook or polling: get recording URL
  → Download audio track (mp4/webm)
  → Upload to Supabase Storage (same as existing audio)
  → transcribeAudio() via Whisper (existing)
  → generateConsultationSummary() via Claude (existing)
  → Update Appointment: audioUrl, transcript, aiSummary, videoRecordingUrl
```

**Webhook approach (preferred):**
- Daily sends `recording.ready-to-download` webhook
- `src/app/api/webhooks/daily/route.ts` processes it

**Polling approach (simpler for MVP):**
- After call ends, poll Daily API for recording status
- Process when available

---

## 10. Brazilian Regulatory Compliance (CFM + LGPD)

### CFM Resolution 2.314/2022 Requirements

| Requirement | VoxClinic Implementation |
|-------------|------------------------|
| Patient informed consent | Teleconsulta consent modal before joining (extends existing LGPD consent pattern) |
| Medical record documentation | Appointment record with transcript + AI summary + recording URL |
| Data protection (LGPD) | Signed URLs, server-side storage in sa-east-1, consent tracking in `ConsentRecord` |
| Recording retention (20 years) | Supabase Storage with `isActive` soft-delete pattern |
| Access control | Private Daily rooms + meeting tokens + professional as owner |
| First consultation allowed | Yes (CFM allows first teleconsulta, no prior in-person required) |

### New ConsentRecord Type

```typescript
// Add to consent types
consentType: "teleconsulta"  // alongside existing "audio_recording"
```

---

## 11. Environment Variables

```env
DAILY_API_KEY=           # Daily.co API key (starts with daily_)
DAILY_WEBHOOK_SECRET=    # Optional, for webhook signature verification
```

Add to `src/lib/env.ts` as optional (same pattern as Resend).

---

## 12. Implementation Order

1. Add `type`, `videoRoomName`, `videoRoomUrl`, `videoRecordingUrl` to Appointment (Prisma migration)
2. Create `src/lib/daily.ts` (room creation, token generation)
3. Create `src/server/actions/teleconsulta.ts`
4. Modify `scheduleAppointment()` — accept `type` parameter
5. Professional teleconsulta page with Daily Prebuilt iframe
6. Patient join page (public, token-based)
7. Calendar integration (video icon, "Iniciar" button)
8. WhatsApp/email reminder with join link
9. Teleconsulta consent modal
10. Post-call recording processing (polling for MVP)
11. Daily webhook handler (enhancement)

---

## 13. Dependencies

- **No new npm packages** — Daily Prebuilt is an iframe, API calls via native `fetch`
- **Daily.co account** — Free tier (10,000 min/month) sufficient for launch
- **Existing infrastructure reused:** Whisper transcription, Claude summary, Supabase Storage, WhatsApp reminders, consent system

---

## 14. Future Enhancements (Post-MVP)

- **t02 - Sala de espera virtual:** Custom waiting room with clinic branding, estimated wait time, pre-call device check
- **Custom video UI:** Replace Daily Prebuilt iframe with `@daily-co/daily-react` hooks for a branded experience
- **In-call features:** Prescription/certificate generation during call, document sharing
- **Multi-participant:** Patient + specialist + referring physician
- **AI real-time:** Live transcription during call (Daily + Deepgram integration)
- **ICP-Brasil digital signature:** For prescriptions issued during teleconsulta

---

## 15. References

- [Daily.co + Next.js Guide](https://www.daily.co/blog/build-a-real-time-video-chat-app-with-next-js-and-daily/)
- [Daily.co Room API](https://www.daily.co/blog/use-next-api-routes-to-create-daily-rooms-dynamically/)
- [Daily.co Pricing](https://www.daily.co/pricing/video-sdk/)
- [LiveKit vs Daily Comparison](https://www.videosdk.live/daily-vs-livekit)
- [CFM Telemedicine Resolution](https://www.mattosfilho.com.br/en/unico/telemedicine-services-brazil/)
- [LGPD and Telehealth in Brazil](https://www.dlapiperintelligence.com/telehealth/countries/brazil/02-regulation-of-telehealth.html)
- [CFM AI Resolution 2025](https://www.mayerbrown.com/en/insights/publications/2026/03/brazilian-cfm-issues-resolution-on-the-use-of-artificial-intelligence-in-medicine)
