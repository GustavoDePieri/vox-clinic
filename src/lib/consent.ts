import { db } from "@/lib/db"

export async function recordConsent(params: {
  workspaceId: string
  patientId?: string
  recordingId?: string
  consentType: string
  givenBy: string
  details?: string
}) {
  return db.consentRecord.create({ data: params })
}
