import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Shield, ShieldCheck, ShieldX, FileText, Stethoscope } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Verificacao de Documento Digital — VoxClinic",
  description: "Verifique a autenticidade de um documento assinado digitalmente.",
}

/**
 * Mask a patient name for LGPD compliance.
 * "Joao da Silva" → "Jo** da Si***"
 */
function maskName(name: string): string {
  return name
    .split(" ")
    .map((part) => {
      if (part.length <= 2) return part
      const visible = Math.min(2, Math.ceil(part.length * 0.4))
      return part.slice(0, visible) + "*".repeat(part.length - visible)
    })
    .join(" ")
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const documentTypeLabels: Record<string, string> = {
  atestado: "Atestado Medico",
  declaracao_comparecimento: "Declaracao de Comparecimento",
  encaminhamento: "Encaminhamento",
  laudo: "Laudo Medico",
  prescription: "Prescricao Medica",
}

export default async function VerificarPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Look up the token in both Prescription and MedicalCertificate
  const [prescription, certificate] = await Promise.all([
    db.prescription.findUnique({
      where: { verificationToken: token },
      select: {
        id: true,
        signedAt: true,
        signatureProvider: true,
        certificateSerial: true,
        certificateSubject: true,
        signedByUserId: true,
        patient: { select: { name: true } },
        workspaceId: true,
      },
    }),
    db.medicalCertificate.findUnique({
      where: { verificationToken: token },
      select: {
        id: true,
        type: true,
        signedAt: true,
        signatureProvider: true,
        certificateSerial: true,
        certificateSubject: true,
        signedByUserId: true,
        patient: { select: { name: true } },
        workspaceId: true,
      },
    }),
  ])

  const doc = prescription || certificate
  if (!doc || !doc.signedAt) {
    notFound()
  }

  const documentType = prescription ? "prescription" : (certificate?.type ?? "atestado")
  const documentLabel = documentTypeLabels[documentType] ?? "Documento"

  // Get professional name from workspace
  const workspace = await db.workspace.findUnique({
    where: { id: doc.workspaceId },
    select: {
      user: { select: { name: true, clinicName: true } },
    },
  })

  const professionalName = workspace?.user?.name ?? "Profissional"
  const clinicName = workspace?.user?.clinicName ?? null
  const patientName = maskName(doc.patient.name)
  const isSigned = !!doc.signedAt

  const providerLabels: Record<string, string> = {
    a1_server: "Certificado A1 (Server-side)",
    birdid: "BirdID (Cloud)",
    vidaas: "VIDaaS (Cloud)",
    webpki: "Web PKI (Client-side)",
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-lg px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-vox-primary to-teal-600 shadow-lg shadow-vox-primary/25">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">
            Verificacao de Documento Digital
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">VoxClinic</p>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {isSigned ? (
                <div className="flex size-14 items-center justify-center rounded-2xl bg-vox-success/10">
                  <ShieldCheck className="size-7 text-vox-success" />
                </div>
              ) : (
                <div className="flex size-14 items-center justify-center rounded-2xl bg-vox-error/10">
                  <ShieldX className="size-7 text-vox-error" />
                </div>
              )}
              <div>
                <p className="text-base font-semibold">
                  {isSigned ? "Documento assinado digitalmente" : "Documento sem assinatura"}
                </p>
                <Badge
                  variant="secondary"
                  className={
                    isSigned
                      ? "mt-1 bg-vox-success/10 text-vox-success border-vox-success/20"
                      : "mt-1 bg-vox-error/10 text-vox-error border-vox-error/20"
                  }
                >
                  {isSigned ? "Assinatura valida" : "Nao assinado"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-vox-primary" />
              Detalhes do Documento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <DetailRow label="Tipo de documento" value={documentLabel} />
              <DetailRow label="Paciente" value={patientName} />
              <DetailRow label="Profissional" value={professionalName} />
              {clinicName && <DetailRow label="Clinica" value={clinicName} />}
              {doc.signedAt && (
                <DetailRow
                  label="Data da assinatura"
                  value={formatDate(doc.signedAt)}
                />
              )}
              {doc.signatureProvider && (
                <DetailRow
                  label="Metodo de assinatura"
                  value={providerLabels[doc.signatureProvider] ?? doc.signatureProvider}
                />
              )}
              {doc.certificateSerial && (
                <DetailRow label="Serial do certificado" value={doc.certificateSerial} />
              )}
              {doc.certificateSubject && (
                <DetailRow label="Titular do certificado" value={doc.certificateSubject} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <p className="mt-6 text-center text-[11px] text-muted-foreground/60">
          Por motivos de privacidade (LGPD), o conteudo completo do documento nao e exibido nesta pagina.
        </p>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/30 pb-2.5 last:border-0 last:pb-0">
      <span className="text-[13px] text-muted-foreground shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-right">{value}</span>
    </div>
  )
}
