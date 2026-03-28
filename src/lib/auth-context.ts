/**
 * Workspace role resolution helper.
 *
 * NOT a "use server" file — can be imported by server actions, layouts, etc.
 * Resolves the user's effective role within their workspace:
 *   - If user owns the workspace (Workspace.userId === user.id) → "owner"
 *   - Otherwise, reads WorkspaceMember.role and normalizes it
 */

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { normalizeRole, type WorkspaceRole } from "@/lib/permissions"
import { ERR_UNAUTHORIZED, ERR_WORKSPACE_NOT_CONFIGURED } from "@/lib/error-messages"

export interface WorkspaceAuthContext {
  userId: string
  clerkId: string
  workspaceId: string
  role: WorkspaceRole
}

/**
 * Resolve the current user's workspace role.
 * Returns null if the user is not authenticated or has no workspace.
 */
export async function resolveWorkspaceRole(): Promise<WorkspaceAuthContext | null> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const user = await db.user.findUnique({
    where: { clerkId },
    include: {
      workspace: { select: { id: true, userId: true } },
      memberships: { select: { workspaceId: true, role: true }, take: 1 },
    },
  })
  if (!user) return null

  // Case 1: User owns a workspace
  if (user.workspace) {
    return {
      userId: user.id,
      clerkId,
      workspaceId: user.workspace.id,
      role: "owner",
    }
  }

  // Case 2: User is a member of a workspace
  const membership = user.memberships?.[0]
  if (membership) {
    return {
      userId: user.id,
      clerkId,
      workspaceId: membership.workspaceId,
      role: normalizeRole(membership.role),
    }
  }

  return null
}

/**
 * Same as resolveWorkspaceRole but throws if not authenticated or no workspace.
 * Useful in server actions that require auth.
 */
export async function requireWorkspaceRole(): Promise<WorkspaceAuthContext> {
  const ctx = await resolveWorkspaceRole()
  if (!ctx) throw new Error(ERR_UNAUTHORIZED)
  if (!ctx.workspaceId) throw new Error(ERR_WORKSPACE_NOT_CONFIGURED)
  return ctx
}
