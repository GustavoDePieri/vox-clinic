"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ERR_UNAUTHORIZED, ActionError, safeAction } from "@/lib/error-messages"

async function getUser() {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, tourCompleted: true, tourStep: true },
  })
  if (!user) throw new Error(ERR_UNAUTHORIZED)

  return user
}

export async function getTourState() {
  const user = await getUser()
  return {
    tourCompleted: user.tourCompleted,
    tourStep: user.tourStep,
  }
}

export const updateTourStep = safeAction(async (step: number) => {
  const user = await getUser()

  if (step < -1 || step > 10) {
    throw new ActionError("Step invalido")
  }

  await db.user.update({
    where: { id: user.id },
    data: { tourStep: step },
  })

  return { tourStep: step }
})

export const completeTour = safeAction(async () => {
  const user = await getUser()

  await db.user.update({
    where: { id: user.id },
    data: { tourCompleted: true, tourStep: 10 },
  })

  return { tourCompleted: true }
})

export const resetTour = safeAction(async () => {
  const user = await getUser()

  await db.user.update({
    where: { id: user.id },
    data: { tourCompleted: false, tourStep: 0 },
  })

  return { tourCompleted: false, tourStep: 0 }
})
