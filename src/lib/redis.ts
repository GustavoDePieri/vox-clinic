/**
 * Redis is disabled for now. Export null so all consumers gracefully fall back
 * to in-memory caching (workspace-cache uses Map, cache.ts skips Redis path).
 */
export const redis = null
