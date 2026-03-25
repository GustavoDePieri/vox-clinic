import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { sendEmail } from "@/lib/email"
import { appointmentReminder } from "@/lib/email-templates"

export async function POST(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization")
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Find tomorrow's appointments
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const startOfDay = new Date(tomorrow)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(tomorrow)
    endOfDay.setHours(23, 59, 59, 999)

    const appointments = await db.appointment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        patient: true,
        workspace: {
          include: { user: true },
        },
      },
    })

    let sent = 0
    let skipped = 0
    const errors: string[] = []

    for (const appointment of appointments) {
      if (!appointment.patient.email) {
        skipped++
        continue
      }

      try {
        const clinicName = appointment.workspace.user.clinicName || "Clínica"

        const html = appointmentReminder({
          patientName: appointment.patient.name,
          appointmentDate: appointment.date,
          clinicName,
        })

        await sendEmail({
          to: appointment.patient.email,
          subject: `Lembrete: Consulta agendada - ${clinicName}`,
          html,
        })

        sent++
      } catch (error) {
        errors.push(
          `Appointment ${appointment.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      }
    }

    return NextResponse.json({
      success: true,
      date: tomorrow.toISOString().split("T")[0],
      total: appointments.length,
      sent,
      skipped,
      errors,
    })
  } catch (error) {
    console.error("Reminder cron error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
