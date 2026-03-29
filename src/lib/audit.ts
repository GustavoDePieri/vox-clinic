import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function logAudit(params: {
  workspaceId: string
  userId: string
  action: string
  entityType: string
  entityId: string
  details?: any
}) {
  try {
    await db.auditLog.create({ data: params })
  } catch (err) {
    logger.error("Audit log write failed", {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      workspaceId: params.workspaceId,
    }, err)
    // Report to Sentry so failed audit writes are visible in monitoring
    import("@sentry/nextjs").then(Sentry => Sentry.captureException(err, {
      tags: { component: "audit" },
      extra: { action: params.action, entityType: params.entityType, entityId: params.entityId },
    })).catch(() => {})
    // Don't re-throw — audit is non-critical
  }
}
