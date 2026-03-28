"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"
import { encrypt, decrypt } from "@/lib/crypto"
import { createMemedClient } from "@/lib/memed/client"
import { logger } from "@/lib/logger"
import {
  ERR_UNAUTHORIZED,
  ERR_USER_NOT_FOUND,
  ERR_WORKSPACE_NOT_CONFIGURED,
  ERR_MEMED_NOT_CONFIGURED,
  ERR_MEMED_REGISTRATION_FAILED,
  ERR_MEMED_PRESCRIBER_NOT_FOUND,
  ERR_PATIENT_NOT_FOUND,
  ActionError,
  safeAction,
} from "@/lib/error-messages"

async function getAuthContext() {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      workspace: true,
      memberships: { select: { workspaceId: true }, take: 1 },
    },
  })
  if (!user) throw new Error(ERR_USER_NOT_FOUND)
  const workspaceId =
    user.workspace?.id ?? user.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error(ERR_WORKSPACE_NOT_CONFIGURED)

  return { userId, user, workspaceId }
}

/**
 * Register the current user as a Memed prescriber.
 * Calls the Memed API and stores the encrypted token.
 */
export const registerMemedPrescriber = safeAction(
  async (data: {
    boardCode: string // CRM, CRO, etc.
    boardNumber: string
    boardState: string // UF
    nome: string
    cpf?: string
    dataNascimento?: string
    email?: string
  }) => {
    const { userId, user, workspaceId } = await getAuthContext()

    const client = createMemedClient()
    if (!client) throw new ActionError(ERR_MEMED_NOT_CONFIGURED)

    // Check if already registered
    const existing = await db.memedPrescriber.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    })

    // Use clerkId as the external ID for Memed
    const externalId = `vox_${workspaceId}_${userId}`

    try {
      let memedId: string
      let memedToken: string

      if (existing) {
        // Already registered — refresh token from Memed
        const result = await client.getPrescriber(externalId)
        memedToken = result.token
        memedId = existing.memedExternalId

        await db.memedPrescriber.update({
          where: { id: existing.id },
          data: {
            memedToken: encrypt(memedToken),
            boardCode: data.boardCode,
            boardNumber: data.boardNumber,
            boardState: data.boardState,
            status: "active",
          },
        })
      } else {
        // New registration
        const result = await client.registerPrescriber({
          nome: data.nome,
          cpf: data.cpf,
          dataNascimento: data.dataNascimento,
          email: data.email,
          uf: data.boardState,
          conselho: data.boardCode,
          crm: data.boardNumber,
          externalId,
        })

        memedToken = result.token
        memedId = result.id

        await db.memedPrescriber.create({
          data: {
            workspaceId,
            userId,
            memedExternalId: memedId,
            memedToken: encrypt(memedToken),
            boardCode: data.boardCode,
            boardNumber: data.boardNumber,
            boardState: data.boardState,
            status: "active",
          },
        })
      }

      await logAudit({
        workspaceId,
        userId,
        action: "memed_prescriber.registered",
        entityType: "MemedPrescriber",
        entityId: memedId,
        details: {
          boardCode: data.boardCode,
          boardNumber: data.boardNumber,
          boardState: data.boardState,
        },
      })

      return {
        status: "active" as const,
        memedExternalId: memedId,
      }
    } catch (err) {
      logger.error(
        "Memed prescriber registration failed",
        { action: "registerMemedPrescriber", workspaceId, userId },
        err
      )
      throw new ActionError(ERR_MEMED_REGISTRATION_FAILED)
    }
  }
)

/**
 * Get the current prescriber's Memed status.
 * Returns status and whether Memed is configured at workspace level.
 */
export async function getMemedPrescriberStatus() {
  const { userId, workspaceId } = await getAuthContext()

  const client = createMemedClient()
  const isConfigured = client !== null

  const prescriber = await db.memedPrescriber.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: {
      id: true,
      status: true,
      boardCode: true,
      boardNumber: true,
      boardState: true,
      memedExternalId: true,
      createdAt: true,
    },
  })

  return {
    isConfigured,
    prescriber: prescriber
      ? {
          id: prescriber.id,
          status: prescriber.status,
          boardCode: prescriber.boardCode,
          boardNumber: prescriber.boardNumber,
          boardState: prescriber.boardState,
          memedExternalId: prescriber.memedExternalId,
          createdAt: prescriber.createdAt.toISOString(),
        }
      : null,
    scriptUrl: isConfigured
      ? (process.env.MEMED_SCRIPT_URL ||
          "https://integrations.memed.com.br/modulos/plataforma.sinapse-prescricao/build/sinapse-prescricao.min.js")
      : null,
  }
}

/**
 * Get decrypted Memed token for frontend script initialization.
 * Refreshes from Memed API if needed.
 */
export async function getMemedToken() {
  const { userId, workspaceId } = await getAuthContext()

  const client = createMemedClient()
  if (!client) throw new Error(ERR_MEMED_NOT_CONFIGURED)

  const prescriber = await db.memedPrescriber.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  })
  if (!prescriber) throw new Error(ERR_MEMED_PRESCRIBER_NOT_FOUND)

  // Decrypt stored token
  let token = decrypt(prescriber.memedToken)

  // Try to refresh from Memed API to ensure token is current
  try {
    const externalId = `vox_${workspaceId}_${userId}`
    const result = await client.getPrescriber(externalId)
    if (result.token && result.token !== token) {
      token = result.token
      // Update stored token
      await db.memedPrescriber.update({
        where: { id: prescriber.id },
        data: { memedToken: encrypt(token) },
      })
    }
  } catch (err) {
    // If refresh fails, use the stored token
    logger.warn("Memed token refresh failed, using stored token", {
      action: "getMemedToken",
      workspaceId,
      userId,
    })
  }

  return { token }
}

/**
 * Sync a prescription from Memed's prescricaoImpressa event.
 * Creates a Prescription record with Memed-specific fields.
 */
export const syncMemedPrescription = safeAction(
  async (payload: {
    patientId: string
    appointmentId?: string
    memedPrescriptionId: string
    medications: {
      name: string
      dosage: string
      frequency: string
      duration: string
      notes?: string
    }[]
    notes?: string
    memedPayload: object
  }) => {
    const { userId, workspaceId } = await getAuthContext()

    const client = createMemedClient()
    if (!client) throw new ActionError(ERR_MEMED_NOT_CONFIGURED)

    // Verify patient exists
    const patient = await db.patient.findFirst({
      where: { id: payload.patientId, workspaceId },
    })
    if (!patient) throw new ActionError(ERR_PATIENT_NOT_FOUND)

    // Get prescriber for token (needed for PDF URL fetch)
    const prescriber = await db.memedPrescriber.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    })
    if (!prescriber) throw new ActionError(ERR_MEMED_PRESCRIBER_NOT_FOUND)

    const token = decrypt(prescriber.memedToken)

    // Fetch PDF URL and digital link from Memed
    let signedPdfUrl: string | null = null
    let memedDigitalLink: string | null = null

    try {
      signedPdfUrl = await client.getPrescriptionPdfUrl(
        payload.memedPrescriptionId,
        token
      )
    } catch (err) {
      logger.warn("Failed to fetch Memed PDF URL", {
        action: "syncMemedPrescription",
        entityId: payload.memedPrescriptionId,
      })
    }

    try {
      memedDigitalLink = await client.getDigitalPrescriptionLink(
        payload.memedPrescriptionId,
        token
      )
    } catch (err) {
      logger.warn("Failed to fetch Memed digital link", {
        action: "syncMemedPrescription",
        entityId: payload.memedPrescriptionId,
      })
    }

    const prescription = await db.prescription.create({
      data: {
        patientId: payload.patientId,
        workspaceId,
        appointmentId: payload.appointmentId || null,
        medications: payload.medications,
        notes: payload.notes || null,
        source: "memed",
        memedPrescriptionId: payload.memedPrescriptionId,
        memedStatus: "signed",
        signedPdfUrl,
        memedDigitalLink,
        memedPayload: payload.memedPayload,
      },
    })

    await logAudit({
      workspaceId,
      userId,
      action: "prescription.created",
      entityType: "Prescription",
      entityId: prescription.id,
      details: {
        source: "memed",
        memedPrescriptionId: payload.memedPrescriptionId,
      },
    })

    return { id: prescription.id, source: "memed" as const }
  }
)

/**
 * Disconnect the current user from Memed.
 * Deletes the MemedPrescriber record.
 */
export const disconnectMemedPrescriber = safeAction(async () => {
  const { userId, workspaceId } = await getAuthContext()

  const prescriber = await db.memedPrescriber.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  })
  if (!prescriber) throw new ActionError(ERR_MEMED_PRESCRIBER_NOT_FOUND)

  await db.memedPrescriber.delete({
    where: { id: prescriber.id },
  })

  await logAudit({
    workspaceId,
    userId,
    action: "memed_prescriber.disconnected",
    entityType: "MemedPrescriber",
    entityId: prescriber.id,
  })

  return { success: true }
})
