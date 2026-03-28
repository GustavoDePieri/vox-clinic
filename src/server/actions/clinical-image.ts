"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"
import {
  uploadClinicalImage as storageUpload,
  getSignedImageUrl,
  deleteClinicalImage as storageDelete,
} from "@/lib/storage"
import {
  ERR_UNAUTHORIZED,
  ERR_WORKSPACE_NOT_CONFIGURED,
  ERR_PATIENT_NOT_FOUND,
  ERR_IMAGE_NOT_FOUND,
  ERR_IMAGE_TOO_LARGE,
  ERR_IMAGE_INVALID_TYPE,
  ERR_NO_FILE,
  ActionError,
  safeAction,
} from "@/lib/error-messages"

async function getAuthContext() {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true, memberships: { select: { workspaceId: true }, take: 1 } },
  })
  const workspaceId = user?.workspace?.id ?? user?.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error(ERR_WORKSPACE_NOT_CONFIGURED)
  return { userId, workspaceId }
}

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// ============================================================
// GET — List patient images with filters
// ============================================================

export async function getPatientImages(
  patientId: string,
  filters?: {
    bodyRegion?: string
    category?: string
    startDate?: string
    endDate?: string
  }
) {
  const { workspaceId } = await getAuthContext()

  const patient = await db.patient.findFirst({
    where: { id: patientId, workspaceId },
  })
  if (!patient) throw new Error(ERR_PATIENT_NOT_FOUND)

  const where: Record<string, unknown> = {
    patientId,
    workspaceId,
  }

  if (filters?.bodyRegion) where.bodyRegion = filters.bodyRegion
  if (filters?.category) where.category = filters.category
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {
      ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
      ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
    }
  }

  const images = await db.clinicalImage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      appointment: { select: { id: true, date: true, procedures: true } },
    },
  })

  // Generate signed URLs for each image
  const result = await Promise.all(
    images.map(async (img) => {
      let signedUrl = ""
      try {
        signedUrl = await getSignedImageUrl(img.url)
      } catch {
        // If signed URL fails, skip — UI will show placeholder
      }
      return {
        id: img.id,
        url: img.url,
        signedUrl,
        thumbnailUrl: img.thumbnailUrl,
        mimeType: img.mimeType,
        fileSize: img.fileSize,
        bodyRegion: img.bodyRegion,
        category: img.category,
        pairedImageId: img.pairedImageId,
        annotations: img.annotations,
        tags: img.tags,
        notes: img.notes,
        takenAt: img.takenAt?.toISOString() ?? null,
        createdAt: img.createdAt.toISOString(),
        appointment: img.appointment
          ? {
              id: img.appointment.id,
              date: img.appointment.date.toISOString(),
              procedures: img.appointment.procedures,
            }
          : null,
      }
    })
  )

  return result
}

// ============================================================
// UPLOAD — Upload clinical image
// ============================================================

export const uploadImage = safeAction(async (formData: FormData) => {
  const { userId, workspaceId } = await getAuthContext()

  const file = formData.get("file") as File
  if (!file) throw new ActionError(ERR_NO_FILE)

  const patientId = formData.get("patientId") as string
  if (!patientId) throw new ActionError("ID do paciente e obrigatorio.")

  // Validate patient belongs to workspace
  const patient = await db.patient.findFirst({
    where: { id: patientId, workspaceId },
  })
  if (!patient) throw new Error(ERR_PATIENT_NOT_FOUND)

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ActionError(ERR_IMAGE_TOO_LARGE)
  }

  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new ActionError(ERR_IMAGE_INVALID_TYPE)
  }

  // Read form fields
  const bodyRegion = (formData.get("bodyRegion") as string) || null
  const category = (formData.get("category") as string) || "general"
  const notes = (formData.get("notes") as string) || null
  const appointmentId = (formData.get("appointmentId") as string) || null
  const takenAtStr = formData.get("takenAt") as string
  const takenAt = takenAtStr ? new Date(takenAtStr) : null

  // Upload to Supabase Storage
  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split(".").pop() || "jpg"
  const storagePath = await storageUpload(buffer, workspaceId, patientId, `image.${ext}`)

  // Create database record
  const image = await db.clinicalImage.create({
    data: {
      workspaceId,
      patientId,
      appointmentId,
      url: storagePath,
      mimeType: file.type,
      fileSize: file.size,
      bodyRegion,
      category,
      notes,
      takenAt,
      createdBy: userId,
    },
  })

  await logAudit({
    workspaceId,
    userId,
    action: "clinical_image.uploaded",
    entityType: "ClinicalImage",
    entityId: image.id,
  })

  return { id: image.id }
})

// ============================================================
// UPDATE — Edit image metadata
// ============================================================

export const updateImage = safeAction(
  async (
    imageId: string,
    data: {
      bodyRegion?: string | null
      category?: string
      notes?: string | null
      tags?: string[]
    }
  ) => {
    const { userId, workspaceId } = await getAuthContext()

    const image = await db.clinicalImage.findFirst({
      where: { id: imageId, workspaceId },
    })
    if (!image) throw new ActionError(ERR_IMAGE_NOT_FOUND)

    const updated = await db.clinicalImage.update({
      where: { id: imageId },
      data: {
        bodyRegion: data.bodyRegion !== undefined ? data.bodyRegion : undefined,
        category: data.category !== undefined ? data.category : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        tags: data.tags !== undefined ? data.tags : undefined,
      },
    })

    await logAudit({
      workspaceId,
      userId,
      action: "clinical_image.updated",
      entityType: "ClinicalImage",
      entityId: imageId,
    })

    return { id: updated.id }
  }
)

// ============================================================
// DELETE — Delete image from storage + DB
// ============================================================

export const deleteImage = safeAction(async (imageId: string) => {
  const { userId, workspaceId } = await getAuthContext()

  const image = await db.clinicalImage.findFirst({
    where: { id: imageId, workspaceId },
  })
  if (!image) throw new ActionError(ERR_IMAGE_NOT_FOUND)

  // If this image is paired, clear the pair reference
  if (image.pairedImageId) {
    await db.clinicalImage.update({
      where: { id: image.pairedImageId },
      data: { pairedImageId: null },
    }).catch(() => {
      // Paired image may not exist anymore
    })
  }

  // Also clear any image that references this one as a pair
  await db.clinicalImage.updateMany({
    where: { pairedImageId: imageId },
    data: { pairedImageId: null },
  })

  // Delete from storage
  await storageDelete(image.url)
  if (image.thumbnailUrl) {
    await storageDelete(image.thumbnailUrl).catch(() => {})
  }

  // Delete from database
  await db.clinicalImage.delete({ where: { id: imageId } })

  await logAudit({
    workspaceId,
    userId,
    action: "clinical_image.deleted",
    entityType: "ClinicalImage",
    entityId: imageId,
  })

  return { success: true }
})

// ============================================================
// PAIR — Link before/after images
// ============================================================

export const pairImages = safeAction(
  async (imageId: string, pairedImageId: string) => {
    const { userId, workspaceId } = await getAuthContext()

    if (imageId === pairedImageId) {
      throw new ActionError("Uma imagem nao pode ser pareada consigo mesma.")
    }

    const [image, pairedImage] = await Promise.all([
      db.clinicalImage.findFirst({ where: { id: imageId, workspaceId } }),
      db.clinicalImage.findFirst({ where: { id: pairedImageId, workspaceId } }),
    ])

    if (!image) throw new ActionError(ERR_IMAGE_NOT_FOUND)
    if (!pairedImage) throw new ActionError("Imagem para pareamento nao encontrada.")

    // Clear existing pairs if any
    if (image.pairedImageId) {
      await db.clinicalImage.update({
        where: { id: image.pairedImageId },
        data: { pairedImageId: null },
      }).catch(() => {})
    }
    if (pairedImage.pairedImageId) {
      await db.clinicalImage.update({
        where: { id: pairedImage.pairedImageId },
        data: { pairedImageId: null },
      }).catch(() => {})
    }

    // Set the pair (bidirectional): image points to pairedImage
    // Due to the @unique constraint, only one side stores the FK
    await db.clinicalImage.update({
      where: { id: imageId },
      data: { pairedImageId },
    })

    await logAudit({
      workspaceId,
      userId,
      action: "clinical_image.paired",
      entityType: "ClinicalImage",
      entityId: imageId,
      details: { pairedImageId },
    })

    return { success: true }
  }
)

// ============================================================
// UNPAIR — Remove pair link
// ============================================================

export const unpairImage = safeAction(async (imageId: string) => {
  const { userId, workspaceId } = await getAuthContext()

  const image = await db.clinicalImage.findFirst({
    where: { id: imageId, workspaceId },
  })
  if (!image) throw new ActionError(ERR_IMAGE_NOT_FOUND)

  // Clear pair on this image
  if (image.pairedImageId) {
    await db.clinicalImage.update({
      where: { id: imageId },
      data: { pairedImageId: null },
    })
  }

  // Also clear any image that references this one
  await db.clinicalImage.updateMany({
    where: { pairedImageId: imageId },
    data: { pairedImageId: null },
  })

  await logAudit({
    workspaceId,
    userId,
    action: "clinical_image.unpaired",
    entityType: "ClinicalImage",
    entityId: imageId,
  })

  return { success: true }
})

// ============================================================
// COUNT — Image count for badge
// ============================================================

export async function getImageCount(patientId: string): Promise<number> {
  const { workspaceId } = await getAuthContext()
  return db.clinicalImage.count({
    where: { patientId, workspaceId },
  })
}

// ============================================================
// SIGNED URL — Get signed URL for a specific image
// ============================================================

export async function getClinicalImageSignedUrl(imageId: string): Promise<string> {
  const { workspaceId } = await getAuthContext()

  const image = await db.clinicalImage.findFirst({
    where: { id: imageId, workspaceId },
  })
  if (!image) throw new Error(ERR_IMAGE_NOT_FOUND)

  return getSignedImageUrl(image.url)
}
