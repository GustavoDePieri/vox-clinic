import { Redis } from "@upstash/redis"

/**
 * Upstash Redis client — shared cache across serverless instances.
 * Gracefully returns null when env vars are not configured,
 * so all consumers can fall back to in-memory caching.
 */
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null
