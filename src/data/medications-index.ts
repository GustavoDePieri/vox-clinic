/**
 * Medication search index — loads ANVISA JSON at module init, provides accent-insensitive search.
 * Used as fallback when MedicationDatabase table is empty (before seeding).
 * For production, prefer DB-backed search via server actions.
 *
 * Usage:
 *   import { searchMedications } from "@/data/medications-index"
 *   const results = searchMedications("amoxicilina", 20)
 */

import medicationData from "./medications-anvisa.json"

export interface MedicationEntry {
  anvisaCode: string
  name: string
  activeIngredient: string
  concentration: string | null
  pharmaceuticalForm: string | null
  manufacturer: string | null
  category: string | null
  controlType: string
}

// Pre-computed normalised strings for fast search
const normalised: {
  normName: string
  normActive: string
  normConc: string
  entry: MedicationEntry
}[] = []

function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
}

for (const item of medicationData as MedicationEntry[]) {
  normalised.push({
    normName: normalise(item.name),
    normActive: normalise(item.activeIngredient),
    normConc: normalise(item.concentration ?? ""),
    entry: item,
  })
}

/**
 * Search medications by name, active ingredient, or concentration.
 * Case-insensitive and accent-insensitive.
 * Returns up to `limit` matches (default 20).
 */
export function searchMedications(query: string, limit = 20): MedicationEntry[] {
  const q = normalise(query.trim())
  if (q.length < 2) return []

  const nameMatches: MedicationEntry[] = []
  const activeMatches: MedicationEntry[] = []

  for (const item of normalised) {
    if (nameMatches.length + activeMatches.length >= limit * 2) break

    if (item.normName.includes(q)) {
      nameMatches.push(item.entry)
    } else if (item.normActive.includes(q)) {
      activeMatches.push(item.entry)
    }
  }

  // Name matches first (more precise), then active ingredient matches
  const results: MedicationEntry[] = []
  for (const m of nameMatches) {
    if (results.length >= limit) break
    results.push(m)
  }
  for (const m of activeMatches) {
    if (results.length >= limit) break
    results.push(m)
  }

  return results
}

/**
 * Look up a single medication by ANVISA code. Returns undefined if not found.
 */
export function getMedicationByAnvisaCode(code: string): MedicationEntry | undefined {
  return (medicationData as MedicationEntry[]).find((m) => m.anvisaCode === code)
}

/**
 * Total number of medications in the dataset.
 */
export const medicationCount = medicationData.length
