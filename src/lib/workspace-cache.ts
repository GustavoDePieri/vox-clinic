import { db } from "@/lib/db"
import { cached, invalidate } from "@/lib/cache"
import { redis } from "@/lib/redis"

const TTL_MS = 60_000 // 60 seconds
const MAX_ENTRIES = 1000

interface CacheEntry {
  workspaceId: string
  timestamp: number
}

// In-memory Map as fallback when Redis is not configured
const memoryCache = new Map<string, CacheEntry>()

/**
 * Get workspaceId for a clerkId.
 * Uses Redis when configured (shared across serverless instances),
 * falls back to module-level Map cache (per-instance, resets on cold start).
 */
export async function getWorkspaceIdCached(clerkId: string): Promise<string | null> {
  // Redis path: use the shared cached() helper
  if (redis) {
    const result = await cached<string | null>(
      `ws:role:${clerkId}`,
      60, // 60 seconds
      async () => {
        const user = await db.user.findUnique({
          where: { clerkId },
          include: { workspace: true, memberships: { select: { workspaceId: true }, take: 1 } },
        })

        return user?.workspace?.id ?? user?.memberships?.[0]?.workspaceId ?? null
      },
    )

    return result
  }

  // Fallback: in-memory Map cache (original behavior)
  const now = Date.now()
  const entry = memoryCache.get(clerkId)

  if (entry && now - entry.timestamp < TTL_MS) {
    // Move to end for LRU ordering (delete + re-set)
    memoryCache.delete(clerkId)
    memoryCache.set(clerkId, entry)
    return entry.workspaceId
  }

  // Cache miss or expired — query DB
  const user = await db.user.findUnique({
    where: { clerkId },
    include: { workspace: true, memberships: { select: { workspaceId: true }, take: 1 } },
  })

  const workspaceId = user?.workspace?.id ?? user?.memberships?.[0]?.workspaceId
  if (!workspaceId) return null

  // Evict oldest if at capacity
  if (memoryCache.size >= MAX_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value
    if (oldestKey !== undefined) memoryCache.delete(oldestKey)
  }

  memoryCache.set(clerkId, { workspaceId, timestamp: now })
  return workspaceId
}

/**
 * Invalidate cached workspaceId for a clerkId (call after workspace/role changes).
 * Clears both Redis and in-memory cache.
 */
export async function invalidateWorkspaceCache(clerkId: string): Promise<void> {
  memoryCache.delete(clerkId)
  await invalidate(`ws:role:${clerkId}`)
}
