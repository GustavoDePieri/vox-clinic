/**
 * Seed script for MedicationDatabase table.
 * Loads curated ANVISA medication data from src/data/medications-anvisa.json.
 *
 * Usage: npx tsx prisma/seed-medications.ts
 */

import { PrismaClient } from "@prisma/client"
import medications from "../src/data/medications-anvisa.json"

const db = new PrismaClient()

async function main() {
  console.log(`Seeding ${medications.length} medications...`)

  let created = 0
  let skipped = 0

  for (const med of medications) {
    try {
      await db.medicationDatabase.upsert({
        where: { anvisaCode: med.anvisaCode },
        update: {
          name: med.name,
          activeIngredient: med.activeIngredient,
          concentration: med.concentration ?? null,
          pharmaceuticalForm: med.pharmaceuticalForm ?? null,
          manufacturer: med.manufacturer ?? null,
          category: med.category ?? null,
          controlType: med.controlType ?? "none",
        },
        create: {
          anvisaCode: med.anvisaCode,
          name: med.name,
          activeIngredient: med.activeIngredient,
          concentration: med.concentration ?? null,
          pharmaceuticalForm: med.pharmaceuticalForm ?? null,
          manufacturer: med.manufacturer ?? null,
          category: med.category ?? null,
          controlType: med.controlType ?? "none",
        },
      })
      created++
    } catch (e) {
      skipped++
      console.warn(`Skipped ${med.anvisaCode} (${med.name}):`, e instanceof Error ? e.message : e)
    }
  }

  console.log(`Done: ${created} upserted, ${skipped} skipped`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
