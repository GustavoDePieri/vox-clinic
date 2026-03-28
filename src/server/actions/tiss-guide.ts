"use server"

// DEPRECATED: This file has been superseded by tiss.ts
// All TISS guide functionality is now in src/server/actions/tiss.ts
// This file is kept empty to avoid breaking any existing imports.
// TODO: Remove this file once all imports have been migrated to tiss.ts

export { createTissGuide, getTissGuides, getTissGuide, updateTissGuideStatus, generateTissBatch, searchAppointmentsForTiss } from "./tiss"
