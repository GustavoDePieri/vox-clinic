# Upstash Redis Caching — Feature Document

> Serverless Redis for caching frequently-read, rarely-changed data. Replace in-memory Map caches that reset on every cold start.

## 1. Overview

### Current Caching Approaches

VoxClinic currently uses three caching mechanisms, each with significant limitations in a serverless environment:

1. **Module-level Map cache** (`src/lib/workspace-cache.ts`) — `new Map<string, CacheEntry>()` with 60s TTL and LRU eviction at 1000 entries. Maps clerkId to workspaceId. **Problem:** Resets on every Vercel cold start. Each serverless instance has its own isolated cache — no sharing. Used by `src/server/actions/patient.ts` via `getWorkspaceIdCached()`.

2. **Client-side Map cache** (`src/app/(dashboard)/calendar/page.tsx` line 62) — `const dataCache = new Map<string, CacheEntry>()` with 60s TTL for calendar appointment data. This is appropriate as a client-side optimization (survives within browser session) but cannot be server-side cached.

3. **Next.js `unstable_cache`** — Used in `src/server/actions/dashboard.ts` (revalidate: 300s, tags: ["dashboard"]) and `src/server/actions/patient.ts` (revalidate: 60s, tags: ["patient-search"]). **Problem:** `unstable_cache` is an experimental API that may change. On Vercel, it uses the Data Cache which works but lacks fine-grained TTL control and observability. No cache hit/miss metrics.

4. **In-memory rate limiter** (`src/lib/rate-limit.ts`) — `new Map<string, RateLimitEntry>()` for sliding window rate limiting. Resets on cold start, which the code comments acknowledge as "acceptable."

### Why Upstash Redis

- **Serverless-native:** Pay-per-request pricing, no persistent connections needed. REST-based protocol works on Vercel Edge Runtime.
- **Shared across instances:** All serverless invocations share the same cache — no cold-start reset.
- **Brazilian region:** Upstash supports `sa-east-1`, matching VoxClinic's Supabase region for low latency.
- **Simple API:** `@upstash/redis` provides a fetch-based client that works in both Node.js and Edge Runtime.
- **Graceful degradation:** If Redis is unavailable, every cache usage falls through to direct DB query.

---

## 2. What to Cache

### 2.1 Workspace Config (procedures, custom fields)

**Current path:** Every server action calls `getWorkspace()` (`src/server/actions/workspace.ts` line 23) which queries `db.user.findUnique` + `db.workspace.findUnique` — 1-2 DB queries per action.

**Cache key:** `ws:config:{workspaceId}`
**TTL:** 300s (5 minutes)
**Invalidation:** On `updateWorkspace` (`src/server/actions/workspace.ts` line 44) — explicit `redis.del()` after successful update.

**Data cached:** `{ id, professionType, procedures, customFields, anamnesisTemplate, categories }`

**Impact:** This is queried on nearly every page load and every server action. High read frequency, very low write frequency (settings change rarely).

### 2.2 Dashboard Stats

**Current path:** `getCachedDashboardData` (`src/server/actions/dashboard.ts` line 8) uses `unstable_cache` with 300s revalidation. Runs 8 parallel DB queries.

**Cache key:** `ws:dashboard:{workspaceId}`
**TTL:** 60s
**Invalidation:** On any appointment creation/update (via tag-based invalidation pattern — `revalidateTag("dashboard")` already exists in codebase).

**Replace:** `unstable_cache` wrapper with Redis get/set. Fall back to direct DB query on cache miss.

### 2.3 Patient Search Results

**Current path:** `getCachedSearchResults` (`src/server/actions/patient.ts` line 27) uses `unstable_cache` with 60s revalidation.

**Cache key:** `ws:search:{workspaceId}:{sha256(query)}`
**TTL:** 30s
**Invalidation:** On patient create/update/deactivate — `redis.del()` with prefix pattern `ws:search:{workspaceId}:*` (use Upstash `scan` + `del` or pipeline).

**Note:** Cache key uses a hash of the query string to avoid very long keys.

### 2.4 CID-10 Search Results

**Current path:** `src/app/api/cid/search/route.ts` calls `searchCid()` from `src/data/cid10-index.ts` — searches against an in-memory array of 1022 entries loaded from `src/data/cid10.json`.

**Cache key:** `cid:search:{sha256(query)}:{limit}`
**TTL:** 300s (5 minutes) — CID-10 data is completely static (DATASUS reference)
**Invalidation:** None needed. Static data.

**Note:** The current in-memory search is already fast (small dataset, no DB). Redis caching here avoids repeated JSON parsing on cold starts. Low priority but trivial to implement.

### 2.5 Workspace Role Resolution

**Current path:** `resolveWorkspaceRole()` in `src/lib/auth-context.ts` queries `db.user.findUnique` with workspace + memberships join on every page load. Also `getWorkspaceIdCached()` in `src/lib/workspace-cache.ts` uses a module-level Map that resets per cold start.

**Cache key:** `ws:role:{clerkId}`
**TTL:** 60s
**Invalidation:** On `updateMemberRole`, `removeMember`, `acceptInvite` in `src/server/actions/team.ts` — explicit `redis.del()`.

**Replace:** Module-level Map in `workspace-cache.ts` with Redis. The `resolveWorkspaceRole()` function gains a Redis-first lookup.

---

## 3. Setup

### NPM Package
```
npm install @upstash/redis
```

### Environment Variables
Add to `src/lib/env.ts` (optional, with graceful fallback):
- `UPSTASH_REDIS_REST_URL` — Upstash REST endpoint
- `UPSTASH_REDIS_REST_TOKEN` — Upstash auth token

### Redis Client
Create `src/lib/redis.ts`:
```typescript
import { Redis } from "@upstash/redis"
import { env } from "@/lib/env"

// Returns null if Redis is not configured — all callers must handle null
export const redis: Redis | null =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null
```

### Cache Helper
Create `src/lib/cache.ts`:
```typescript
/**
 * Generic cache-aside helper with graceful degradation.
 * If Redis is unavailable or errors, falls through to the fetcher function.
 */
async function cached<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T>
async function invalidate(key: string): Promise<void>
async function invalidatePrefix(prefix: string): Promise<void>
```

---

## 4. Cache Invalidation Strategy

| Cache | Key Pattern | TTL | Invalidation Trigger | Method |
|-------|-------------|-----|----------------------|--------|
| Workspace config | `ws:config:{workspaceId}` | 300s | `updateWorkspace()` | Explicit `del` |
| Dashboard stats | `ws:dashboard:{workspaceId}` | 60s | Appointment create/update/status change | Explicit `del` |
| Patient search | `ws:search:{workspaceId}:*` | 30s | Patient create/update/deactivate/merge | Prefix scan + `del` |
| CID-10 search | `cid:search:{hash}:{limit}` | 300s | Never (static data) | TTL expiry only |
| Workspace role | `ws:role:{clerkId}` | 60s | Team role change, member add/remove | Explicit `del` |

### Invalidation Locations

**`src/server/actions/workspace.ts` — `updateWorkspace`:**
- `invalidate("ws:config:{workspaceId}")`

**`src/server/actions/patient.ts` — `createPatient`, `updatePatient`, `deactivatePatient`, `mergePatients`:**
- `invalidatePrefix("ws:search:{workspaceId}:")`

**`src/server/actions/voice.ts` — `confirmPatientRegistration`:**
- `invalidatePrefix("ws:search:{workspaceId}:")`
- `invalidate("ws:dashboard:{workspaceId}")`

**`src/server/actions/consultation.ts` — `confirmConsultation`:**
- `invalidate("ws:dashboard:{workspaceId}")`

**`src/server/actions/appointment.ts` — `scheduleAppointment`, `updateAppointmentStatus`, `rescheduleAppointment`, `deleteAppointment`:**
- `invalidate("ws:dashboard:{workspaceId}")`

**`src/server/actions/team.ts` — `updateMemberRole`, `removeMember`, `acceptInvite`:**
- `invalidate("ws:role:{clerkId}")`

---

## 5. Graceful Degradation

Every Redis operation MUST be wrapped in try/catch. If Redis is unavailable (network error, misconfigured, quota exceeded), the application falls through to direct database queries — identical to current behavior.

```typescript
// Pattern: every cached() call is non-blocking on Redis failure
const workspace = await cached(
  `ws:config:${workspaceId}`,
  300,
  () => db.workspace.findUnique({ where: { id: workspaceId } })
)
// If Redis fails → fetcher() runs directly → same result, just slower
```

The `redis` client export is nullable (`Redis | null`). When env vars are missing, all `cached()` calls skip Redis entirely and call the fetcher directly. This means:
- **Local dev works without Redis** — no Upstash account needed
- **Staging/production without Redis configured** — no errors, just no caching
- **Redis outage in production** — automatic fallback, no downtime

---

## 6. Implementation Plan

### Phase 1: Redis Client + Cache Helper
1. `npm install @upstash/redis`
2. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `src/lib/env.ts` as optional vars
3. Create `src/lib/redis.ts` — nullable Redis client
4. Create `src/lib/cache.ts` — `cached()`, `invalidate()`, `invalidatePrefix()` helpers

### Phase 2: Workspace Config Cache (highest impact)
1. Modify `src/server/actions/workspace.ts`:
   - `getWorkspace()` — wrap DB query with `cached("ws:config:{workspaceId}", 300, fetcher)`
   - `updateWorkspace()` — add `invalidate("ws:config:{workspaceId}")` after successful update
2. Modify `src/server/actions/voice.ts` and `src/server/actions/consultation.ts`:
   - Replace inline workspace fetch with cached `getWorkspace()` call (already used in some places)

### Phase 3: Workspace Role Cache (replace Map cache)
1. Modify `src/lib/workspace-cache.ts`:
   - Replace module-level `Map` with Redis-backed `cached()` call
   - `getWorkspaceIdCached()` → `cached("ws:role:{clerkId}", 60, fetcher)`
   - `invalidateWorkspaceCache()` → `invalidate("ws:role:{clerkId}")`
2. Modify `src/lib/auth-context.ts`:
   - `resolveWorkspaceRole()` — use `cached("ws:role:{clerkId}", 60, fetcher)`
3. Add invalidation calls in `src/server/actions/team.ts`

### Phase 4: Dashboard Stats Cache
1. Modify `src/server/actions/dashboard.ts`:
   - Replace `unstable_cache` with `cached("ws:dashboard:{workspaceId}", 60, fetcher)`
   - Remove `unstable_cache` import
2. Add invalidation in appointment mutation actions

### Phase 5: Patient Search + CID-10 Cache
1. Modify `src/server/actions/patient.ts`:
   - Replace `unstable_cache` in `getCachedSearchResults` with Redis-backed `cached()`
   - Add prefix invalidation on patient mutations
2. Modify `src/app/api/cid/search/route.ts`:
   - Wrap `searchCid()` with `cached("cid:search:{hash}:{limit}", 300, fetcher)`

### Phase 6: Rate Limiter Migration (optional, lower priority)
1. Modify `src/lib/rate-limit.ts`:
   - Replace in-memory Map with Upstash Redis `INCR` + `EXPIRE` pattern
   - Uses `@upstash/ratelimit` package (separate from `@upstash/redis`) if desired
   - Fall back to current Map if Redis unavailable

---

## 7. Testing Considerations

- **Local dev:** Works without Upstash — all `cached()` calls fall through to fetcher
- **Cache miss verification:** Add debug logging `[cache] HIT/MISS key` in development mode
- **Invalidation verification:** After `updateWorkspace`, verify next `getWorkspace` fetches fresh data
- **TTL verification:** Confirm dashboard data refreshes within 60s of appointment change
- **Concurrency:** Redis is atomic — no race conditions on get/set (unlike the current Map which has theoretical races on multi-instance)
- **Upstash dashboard:** Monitor request count, latency percentiles, cache hit rate

---

## 8. Migration Strategy

- **Backward compatible:** Redis is optional. When `UPSTASH_REDIS_REST_URL` is not set, the app behaves exactly as it does today.
- **No schema changes:** Pure infrastructure improvement.
- **Incremental adoption:** Each phase can be deployed independently. Phase 1 (client setup) is a prerequisite, but phases 2-6 are independent.
- **Rollback:** Removing env vars instantly disables Redis caching with no code changes needed.
- **Monitoring:** Track cache hit rate in Upstash dashboard. If hit rate < 50% for any key pattern, re-evaluate TTL or invalidation strategy.
