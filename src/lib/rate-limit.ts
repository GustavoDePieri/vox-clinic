/**
 * In-memory sliding window rate limiter.
 *
 * Adequate for single-process serverless (Vercel). Each cold start resets
 * the counters, which is acceptable — the goal is to prevent abuse bursts,
 * not enforce precise global limits.
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Auto-clean expired entries every 60s to prevent memory leaks
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function ensureCleanup(windowMs: number) {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      // Remove timestamps older than the largest reasonable window (5 min)
      entry.timestamps = entry.timestamps.filter((t) => now - t < 5 * 60 * 1000)
      if (entry.timestamps.length === 0) {
        store.delete(key)
      }
    }
  }, 60_000)
  // Allow Node.js to exit without waiting for this interval
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref()
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check and consume one request against the rate limit.
 *
 * @param key     Unique key, typically the client IP
 * @param windowMs  Sliding window size in milliseconds
 * @param max     Maximum requests allowed in the window
 */
export function rateLimit(
  key: string,
  windowMs: number,
  max: number
): RateLimitResult {
  ensureCleanup(windowMs)

  const now = Date.now()
  const windowStart = now - windowMs

  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Slide the window: drop timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart)

  if (entry.timestamps.length >= max) {
    // Oldest timestamp in window determines when the first slot frees up
    const resetAt = entry.timestamps[0] + windowMs
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    }
  }

  // Consume one slot
  entry.timestamps.push(now)

  return {
    allowed: true,
    remaining: max - entry.timestamps.length,
    resetAt: entry.timestamps[0] + windowMs,
  }
}

/**
 * Extract client IP from request headers.
 * Works with Vercel, Cloudflare, and standard reverse proxies.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers

  // x-forwarded-for can contain multiple IPs: client, proxy1, proxy2
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0].trim()
    if (first) return first
  }

  const realIp = headers.get("x-real-ip")
  if (realIp) return realIp.trim()

  return "unknown"
}

/**
 * Build a 429 Too Many Requests response with Retry-After header.
 */
export function rateLimitResponse(resetAt: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
  return new Response(
    JSON.stringify({ error: "Muitas solicitacoes. Tente novamente mais tarde." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.max(retryAfter, 1)),
      },
    }
  )
}
