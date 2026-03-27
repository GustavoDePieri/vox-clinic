const DAILY_API_URL = 'https://api.daily.co/v1'

function getDailyApiKey(): string {
  const key = process.env.DAILY_API_KEY
  if (!key) throw new Error('DAILY_API_KEY not configured')
  return key
}

export async function createVideoRoom(appointmentId: string, expiresAt: Date) {
  const res = await fetch(`${DAILY_API_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getDailyApiKey()}`,
    },
    body: JSON.stringify({
      name: `vox-${appointmentId.slice(0, 12)}`,
      privacy: 'private',
      properties: {
        exp: Math.floor(expiresAt.getTime() / 1000),
        enable_knocking: true,
        enable_screenshare: true,
        enable_chat: true,
        enable_recording: 'cloud',
        start_audio_off: false,
        start_video_off: false,
        lang: 'pt',
      },
    }),
  })
  if (!res.ok) throw new Error(`Daily API error: ${res.status}`)
  return res.json() as Promise<{ name: string; url: string; id: string }>
}

export async function createMeetingToken(roomName: string, opts: {
  isOwner: boolean
  userName: string
  expiresAt: Date
}) {
  const res = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getDailyApiKey()}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: opts.isOwner,
        user_name: opts.userName,
        exp: Math.floor(opts.expiresAt.getTime() / 1000),
      },
    }),
  })
  if (!res.ok) throw new Error(`Daily API error: ${res.status}`)
  return res.json() as Promise<{ token: string }>
}

export async function deleteVideoRoom(roomName: string) {
  await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getDailyApiKey()}` },
  })
}
