import { db } from "@/lib/db"

export async function logAudit(params: {
  workspaceId: string
  userId: string
  action: string
  entityType: string
  entityId: string
  details?: any
}) {
  await db.auditLog.create({ data: params })
}
