"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ERR_UNAUTHORIZED, ERR_ACCESS_DENIED, ERR_WORKSPACE_NOT_FOUND } from "@/lib/error-messages"

async function requireSuperAdmin() {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user || user.role !== "superadmin") throw new Error(ERR_ACCESS_DENIED)
  return user
}

export async function getAdminDashboard() {
  await requireSuperAdmin()

  const [
    totalWorkspaces,
    activeWorkspaces,
    totalUsers,
    totalPatients,
    totalAppointments,
    totalRecordings,
  ] = await Promise.all([
    db.workspace.count(),
    db.workspace.count({ where: { planStatus: "active" } }),
    db.user.count(),
    db.patient.count({ where: { isActive: true } }),
    db.appointment.count(),
    db.recording.count(),
  ])

  const planCounts = await db.workspace.groupBy({
    by: ["plan"],
    _count: true,
    where: { planStatus: "active" },
  })

  const recentWorkspaces = await db.workspace.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  })

  return {
    totalWorkspaces,
    activeWorkspaces,
    totalUsers,
    totalPatients,
    totalAppointments,
    totalRecordings,
    planCounts,
    recentWorkspaces,
  }
}

export async function getAdminWorkspaces(page: number = 1, search?: string) {
  await requireSuperAdmin()

  const PAGE_SIZE = 100
  const skip = (page - 1) * PAGE_SIZE

  // Build where clause for search (filter by user name, email, or professionType)
  const where = search
    ? {
        OR: [
          { user: { name: { contains: search, mode: "insensitive" as const } } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
          { professionType: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined

  const [workspaces, total] = await Promise.all([
    db.workspace.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
      include: {
        user: { select: { name: true, email: true } },
        _count: {
          select: {
            patients: true,
            appointments: true,
            recordings: true,
            members: true,
          },
        },
      },
    }),
    db.workspace.count({ where }),
  ])

  return { workspaces, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) }
}

export async function getAdminWorkspaceDetail(workspaceId: string) {
  await requireSuperAdmin()

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      user: true,
      _count: {
        select: {
          patients: true,
          appointments: true,
          recordings: true,
          members: true,
        },
      },
    },
  })

  if (!workspace) throw new Error(ERR_WORKSPACE_NOT_FOUND)

  const [prescriptions, certificates] = await Promise.all([
    db.prescription.count({ where: { workspaceId } }),
    db.medicalCertificate.count({ where: { workspaceId } }),
  ])

  const recentAppointments = await db.appointment.findMany({
    where: { workspaceId },
    take: 5,
    orderBy: { date: "desc" },
    include: { patient: { select: { name: true } } },
  })

  return { workspace, prescriptions, certificates, recentAppointments }
}

export async function toggleWorkspaceStatus(workspaceId: string) {
  await requireSuperAdmin()

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
  })
  if (!workspace) throw new Error(ERR_WORKSPACE_NOT_FOUND)

  const newStatus = workspace.planStatus === "active" ? "suspended" : "active"
  await db.workspace.update({
    where: { id: workspaceId },
    data: { planStatus: newStatus },
  })

  return { success: true, newStatus }
}

export async function getAdminUsers(page: number = 1) {
  await requireSuperAdmin()

  const PAGE_SIZE = 100
  const skip = (page - 1) * PAGE_SIZE

  const [users, total] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
      include: {
        workspace: {
          select: {
            id: true,
            professionType: true,
            plan: true,
            planStatus: true,
            _count: { select: { patients: true, appointments: true } },
          },
        },
      },
    }),
    db.user.count(),
  ])

  return { users, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) }
}
