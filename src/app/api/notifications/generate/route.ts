import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { env } from "@/lib/env"

// Vercel Cron invokes via GET; re-export POST handler as GET for compatibility
export { POST as GET }

export async function POST(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization")
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    const in30min = new Date(now.getTime() + 30 * 60 * 1000)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Get all active workspaces with their users
    const workspaces = await db.workspace.findMany({
      where: { planStatus: { not: "canceled" } },
      select: {
        id: true,
        user: { select: { clerkId: true } },
        members: { select: { userId: true, user: { select: { clerkId: true } } } },
      },
    })

    let totalGenerated = 0

    for (const workspace of workspaces) {
      // Collect all user clerkIds for this workspace (owner + members)
      const userIds: string[] = []
      if (workspace.user?.clerkId) userIds.push(workspace.user.clerkId)
      for (const member of workspace.members) {
        if (member.user?.clerkId && !userIds.includes(member.user.clerkId)) {
          userIds.push(member.user.clerkId)
        }
      }
      if (userIds.length === 0) continue

      // Find appointments in next 30 minutes
      const upcoming = await db.appointment.findMany({
        where: {
          workspaceId: workspace.id,
          status: "scheduled",
          date: { gte: now, lte: in30min },
        },
        include: { patient: { select: { name: true } } },
      })

      for (const apt of upcoming) {
        const time = apt.date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

        for (const userId of userIds) {
          const existing = await db.notification.findFirst({
            where: {
              workspaceId: workspace.id,
              userId,
              entityType: "Appointment",
              entityId: apt.id,
              type: "appointment_soon",
            },
          })
          if (existing) continue

          await db.notification.create({
            data: {
              workspaceId: workspace.id,
              userId,
              type: "appointment_soon",
              title: "Consulta em breve",
              body: `${apt.patient.name} as ${time}`,
              entityType: "Appointment",
              entityId: apt.id,
            },
          })
          totalGenerated++
        }
      }

      // Find no-shows from today (appointments that passed without completion)
      const missed = await db.appointment.findMany({
        where: {
          workspaceId: workspace.id,
          status: "scheduled",
          date: { gte: startOfDay, lt: now },
        },
        include: { patient: { select: { name: true } } },
      })

      for (const apt of missed) {
        for (const userId of userIds) {
          const existing = await db.notification.findFirst({
            where: {
              workspaceId: workspace.id,
              userId,
              entityType: "Appointment",
              entityId: apt.id,
              type: "appointment_missed",
            },
          })
          if (existing) continue

          await db.notification.create({
            data: {
              workspaceId: workspace.id,
              userId,
              type: "appointment_missed",
              title: "Consulta nao realizada",
              body: `${apt.patient.name} — consulta agendada nao foi concluida`,
              entityType: "Appointment",
              entityId: apt.id,
            },
          })
          totalGenerated++
        }
      }
    }

    return NextResponse.json({
      success: true,
      generated: totalGenerated,
      workspacesProcessed: workspaces.length,
    })
  } catch (error) {
    console.error("Notification generation cron error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
