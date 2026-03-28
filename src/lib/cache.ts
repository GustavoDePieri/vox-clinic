import { redis } from "@/lib/redis"

const isDev = process.env.NODE_ENV === "development"

/**
 * Cache-aside helper with graceful degradation.
 * If Redis is unavailable or errors, falls through to the fetcher function.
 * Without Redis configured, this is a zero-overhead passthrough.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  if (!redis) return fetcher()

  try {
    const hit = await redis.get<T>(key)
    if (hit !== null) {
      if (isDev) console.log(`[cache] HIT ${key}`)
      return hit
    }
    if (isDev) console.log(`[cache] MISS ${key}`)
  } catch (err) {
    if (isDev) console.warn(`[cache] GET error for ${key}:`, err)
    // Redis error — fall through to fetcher
  }

  const data = await fetcher()

  try {
    await redis.set(key, data, ttlSeconds)
  } catch (err) {
    if (isDev) console.warn(`[cache] SET error for ${key}:`, err)
    // Non-critical — data is still returned from fetcher
  }

  return data
}

/**
 * Invalidate a single cache key. No-op if Redis is not configured.
 */
export async function invalidate(key: string): Promise<void> {
  if (!redis) return

  try {
    await redis.del(key)
    if (isDev) console.log(`[cache] DEL ${key}`)
  } catch (err) {
    if (isDev) console.warn(`[cache] DEL error for ${key}:`, err)
  }
}

/**
 * Invalidate all keys matching a prefix (e.g. "ws:search:abc123:").
 * Uses SCAN to find matching keys, then deletes them.
 * No-op if Redis is not configured.
 */
export async function invalidatePrefix(prefix: string): Promise<void> {
  if (!redis) return

  try {
    const keys = await redis.keys(`${prefix}*`)
    if (keys.length > 0) {
      await Promise.all(keys.map((k) => redis!.del(k)))
      if (isDev) console.log(`[cache] DEL prefix ${prefix}* (${keys.length} keys)`)
    }
  } catch (err) {
    if (isDev) console.warn(`[cache] DEL prefix error for ${prefix}*:`, err)
  }
}
