import { env } from "@/lib/env"

/**
 * Lightweight Upstash Redis client using REST API.
 * No external dependencies — uses native fetch.
 * Returns null if UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not configured.
 */
class UpstashRedis {
  constructor(
    private url: string,
    private token: string,
  ) {}

  private async command<T>(...args: (string | number)[]): Promise<T | null> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      cache: "no-store",
    })

    if (!res.ok) {
      throw new Error(`Upstash Redis error: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    if (data.error) {
      throw new Error(`Upstash Redis error: ${data.error}`)
    }

    return data.result as T
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.command<string>("GET", key)
    if (raw === null || raw === undefined) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return raw as unknown as T
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value)
    if (ttlSeconds && ttlSeconds > 0) {
      await this.command("SET", key, serialized, "EX", ttlSeconds)
    } else {
      await this.command("SET", key, serialized)
    }
  }

  async del(key: string): Promise<void> {
    await this.command("DEL", key)
  }

  /**
   * Find all keys matching a pattern using SCAN (safe for production, unlike KEYS).
   * Uses cursor-based iteration to avoid blocking Redis.
   */
  async keys(pattern: string): Promise<string[]> {
    const result: string[] = []
    let cursor = "0"

    do {
      const res = await this.command<[string, string[]]>("SCAN", cursor, "MATCH", pattern, "COUNT", 100)
      if (!res) break
      cursor = res[0]
      result.push(...res[1])
    } while (cursor !== "0")

    return result
  }
}

export const redis: UpstashRedis | null =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new UpstashRedis(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN)
    : null
