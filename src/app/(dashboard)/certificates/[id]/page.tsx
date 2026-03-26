import { getCertificate } from "@/server/actions/certificate"
import { PrintButton } from "./print-button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

function formatDateLong(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

const typeLabels: Record<string, string> = {
  atestado: "ATESTADO MEDICO",
  declaracao_comparecimento: "DECLARACAO DE COMPARECIMENTO",
  encaminhamento: "ENCAMINHAMENTO",
  laudo: "LAUDO MEDICO",
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const certificate = await getCertificate(id)

  const today = formatDateLong(new Date())
  const title = typeLabels[certificate.type] ?? "DOCUMENTO"

  return (
    <>
      {/* Top bar - hidden on print */}
      <div className="print:hidden mb-8 flex items-center justify-between gap-4">
        <Link
          href="/patients"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
        <PrintButton />
      </div>

      {/* Certificate content */}
      <div className="mx-auto max-w-2xl bg-white print:bg-white print:max-w-none print:mx-0">
        <div className="rounded-xl border border-border print:border-0 print:shadow-none p-8 print:p-0 space-y-8">

          {/* Header */}
          <header className="border-b border-border pb-6 print:border-b-gray-300 text-center">
            <h2 className="text-sm font-medium text-vox-primary uppercase tracking-wider">
              VoxClinic
            </h2>
            <p className="text-lg font-semibold mt-1">{certificate.clinicName}</p>
            <p className="text-sm text-muted-foreground">{certificate.profession}</p>
          </header>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight print:text-3xl">
              {title}
            </h1>
          </div>

          {/* Patient Info */}
          <section>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Paciente</span>
                <p className="font-medium">{certificate.patientName}</p>
              </div>
              {certificate.patientDocument && (
                <div>
                  <span className="text-muted-foreground">CPF</span>
                  <p className="font-medium">{certificate.patientDocument}</p>
                </div>
              )}
            </div>
          </section>

          {/* Content */}
          <section className="py-4">
            <p className="text-sm leading-7 whitespace-pre-wrap text-justify">
              {certificate.content}
            </p>
          </section>

          {/* CID / Days info for atestado */}
          {certificate.type === "atestado" && (certificate.cid || certificate.days) && (
            <section className="text-sm space-y-1">
              {certificate.days && (
                <p>
                  <span className="text-muted-foreground">Dias de afastamento: </span>
                  <span className="font-medium">{certificate.days}</span>
                </p>
              )}
              {certificate.cid && (
                <p>
                  <span className="text-muted-foreground">CID: </span>
                  <span className="font-medium">{certificate.cid}</span>
                </p>
              )}
            </section>
          )}

          {/* Signature */}
          <section className="pt-8 text-center">
            <div className="inline-block">
              <p className="text-sm mb-1">___________________________</p>
              <p className="text-sm font-medium">{certificate.doctorName}</p>
              <p className="text-xs text-muted-foreground">{certificate.profession}</p>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-border pt-6 print:border-t-gray-300 mt-8">
            <p className="text-xs text-muted-foreground text-center">
              Documento gerado pelo VoxClinic em {today}
            </p>
          </footer>
        </div>
      </div>
    </>
  )
}
