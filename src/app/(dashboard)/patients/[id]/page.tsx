import { getPatient } from "@/server/actions/patient"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, FileText } from "lucide-react"
import Link from "next/link"
import { PatientTabs } from "./patient-tabs"
import { ExportButton } from "./export-button"
import { DeactivateButton } from "./deactivate-button"

export default async function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const patient = await getPatient(id)

  // Fetch workspace custom fields for display
  const { userId } = await auth()
  const user = userId
    ? await db.user.findUnique({
        where: { clerkId: userId },
        include: { workspace: { select: { customFields: true, anamnesisTemplate: true } } },
      })
    : null
  const customFields = (user?.workspace?.customFields as any[]) ?? []
  const anamnesisTemplate = (user?.workspace?.anamnesisTemplate as any[]) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/patients"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Pacientes
        </Link>
        <span className="text-muted-foreground">/</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {patient.name}
          </h1>
          {patient.document && (
            <p className="text-sm text-muted-foreground mt-0.5">
              CPF: {patient.document}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ExportButton patientId={patient.id} patientName={patient.name} />
          <Link href={`/patients/${patient.id}/report`} target="_blank">
            <Button variant="outline" size="sm">
              <FileText className="size-4" />
              Relatorio
            </Button>
          </Link>
          <DeactivateButton patientId={patient.id} />
          {patient.alerts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {patient.alerts.map((alert, i) => (
                <Badge key={i} variant="destructive">
                  <AlertTriangle className="size-3 mr-1" />
                  {alert}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <PatientTabs patient={patient} customFields={customFields} anamnesisTemplate={anamnesisTemplate} />
    </div>
  )
}
