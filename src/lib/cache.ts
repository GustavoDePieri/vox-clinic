/**
 * Cache-aside helper with graceful degradation.
 * Redis is currently disabled — all calls pass through directly to the fetcher.
 * When Redis is re-enabled, restore the redis import and caching logic.
 */
export async function cached<T>(
  _key: string,
  _ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  return fetcher()
}

/**
 * Invalidate a single cache key. No-op without Redis.
 */
export async function invalidate(_key: string): Promise<void> {}

/**
 * Invalidate all keys matching a prefix. No-op without Redis.
 */
export async function invalidatePrefix(_prefix: string): Promise<void> {}
