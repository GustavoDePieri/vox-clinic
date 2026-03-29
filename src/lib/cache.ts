import { redis } from "@/lib/redis"
import { logger } from "@/lib/logger"

/**
 * Cache-aside helper with graceful degradation.
 * Uses Upstash Redis when configured, otherwise passes through to the fetcher.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  if (!redis) return fetcher()

  try {
    const hit = await redis.get<T>(key)
    if (hit !== null && hit !== undefined) return hit
  } catch (err) {
    logger.warn("Redis GET failed, falling through to fetcher", { action: "cache.get", entityId: key }, )
  }

  const value = await fetcher()

  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds })
  } catch (err) {
    logger.warn("Redis SET failed, value not cached", { action: "cache.set", entityId: key })
  }

  return value
}

/**
 * Invalidate a single cache key.
 */
export async function invalidate(key: string): Promise<void> {
  if (!redis) return

  try {
    await redis.del(key)
  } catch (err) {
    logger.warn("Redis DEL failed", { action: "cache.invalidate", entityId: key })
  }
}

/**
 * Invalidate all keys matching a prefix (using SCAN to avoid blocking).
 */
export async function invalidatePrefix(prefix: string): Promise<void> {
  if (!redis) return

  try {
    let cursor = "0"
    do {
      const [nextCursor, keys] = await redis.scan(Number(cursor), { match: `${prefix}*`, count: 100 }) as [string, string[]]
      cursor = nextCursor
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } while (cursor !== "0")
  } catch (err) {
    logger.warn("Redis SCAN/DEL failed", { action: "cache.invalidatePrefix", entityId: prefix })
  }
}
