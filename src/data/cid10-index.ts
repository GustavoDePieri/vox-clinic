/**
 * CID-10 search index — loads JSON at module init, provides accent-insensitive search.
 *
 * Usage:
 *   import { searchCid } from "@/data/cid10-index"
 *   const results = searchCid("diabetes", 20)
 */

import cidData from "./cid10.json"

export interface CidEntry {
  code: string
  description: string
}

// Build Map at module load (server-side only, ~500 entries)
const cidMap = new Map<string, CidEntry>()

// Pre-computed normalised strings for fast search
const normalised: { code: string; normCode: string; normDesc: string; entry: CidEntry }[] = []

function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
}

for (const item of cidData as CidEntry[]) {
  cidMap.set(item.code, item)
  normalised.push({
    code: item.code,
    normCode: normalise(item.code),
    normDesc: normalise(item.description),
    entry: item,
  })
}

/**
 * Search CID-10 codes by code or description.
 * Case-insensitive and accent-insensitive.
 * Returns up to `limit` matches (default 20).
 */
export function searchCid(query: string, limit = 20): CidEntry[] {
  const q = normalise(query.trim())
  if (q.length < 2) return []

  const results: CidEntry[] = []
  // Exact code matches first, then description matches
  const codeMatches: CidEntry[] = []
  const descMatches: CidEntry[] = []

  for (const item of normalised) {
    if (results.length + codeMatches.length + descMatches.length >= limit * 2) break

    if (item.normCode.includes(q)) {
      codeMatches.push(item.entry)
    } else if (item.normDesc.includes(q)) {
      descMatches.push(item.entry)
    }
  }

  // Code matches first (more precise), then description matches
  for (const m of codeMatches) {
    if (results.length >= limit) break
    results.push(m)
  }
  for (const m of descMatches) {
    if (results.length >= limit) break
    results.push(m)
  }

  return results
}

/**
 * Look up a single CID-10 code. Returns undefined if not found.
 */
export function getCidByCode(code: string): CidEntry | undefined {
  return cidMap.get(code.toUpperCase().trim())
}

/**
 * Total number of CID-10 entries in the dataset.
 */
export const cidCount = cidMap.size
