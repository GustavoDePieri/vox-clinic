import { getPrescription } from "@/server/actions/prescription"
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

export default async function PrescriptionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const prescription = await getPrescription(id)

  const today = formatDateLong(new Date())

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

      {/* Prescription content */}
      <div className="mx-auto max-w-2xl bg-white print:bg-white print:max-w-none print:mx-0">
        <div className="rounded-xl border border-border print:border-0 print:shadow-none p-8 print:p-0 space-y-8">

          {/* Header */}
          <header className="border-b border-border pb-6 print:border-b-gray-300 text-center">
            <h2 className="text-sm font-medium text-vox-primary uppercase tracking-wider">
              VoxClinic
            </h2>
            <p className="text-lg font-semibold mt-1">{prescription.clinicName}</p>
            <p className="text-sm text-muted-foreground">{prescription.profession}</p>
          </header>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight print:text-3xl">
              PRESCRICAO MEDICA
            </h1>
          </div>

          {/* Patient Info */}
          <section>
            <h2 className="text-base font-semibold mb-3 text-foreground">
              Dados do Paciente
            </h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Nome</span>
                <p className="font-medium">{prescription.patientName}</p>
              </div>
              {prescription.patientDocument && (
                <div>
                  <span className="text-muted-foreground">CPF</span>
                  <p className="font-medium">{prescription.patientDocument}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Data</span>
                <p className="font-medium">{new Date(prescription.createdAt).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          </section>

          {/* Medications Table */}
          <section>
            <h2 className="text-base font-semibold mb-3 text-foreground">
              Medicamentos
            </h2>
            <div className="border border-border rounded-xl overflow-hidden print:border-gray-300 overflow-x-auto print:overflow-visible">
              <table className="w-full text-sm min-w-[500px] print:min-w-0">
                <thead>
                  <tr className="bg-muted/50 print:bg-gray-100">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Medicamento
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Posologia
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Frequencia
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Duracao
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Obs.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.medications.map((med, index) => (
                    <tr
                      key={index}
                      className={
                        index % 2 === 0
                          ? "bg-white print:bg-white"
                          : "bg-muted/30 print:bg-gray-50"
                      }
                    >
                      <td className="px-4 py-3 font-medium">{med.name}</td>
                      <td className="px-4 py-3">{med.dosage}</td>
                      <td className="px-4 py-3">{med.frequency}</td>
                      <td className="px-4 py-3">{med.duration}</td>
                      <td className="px-4 py-3 text-muted-foreground">{med.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* General Notes */}
          {prescription.notes && (
            <section>
              <h2 className="text-base font-semibold mb-3 text-foreground">
                Observacoes Gerais
              </h2>
              <p className="text-sm whitespace-pre-wrap">{prescription.notes}</p>
            </section>
          )}

          {/* Signature */}
          <section className="pt-8 text-center">
            <div className="inline-block">
              <p className="text-sm mb-1">___________________________</p>
              <p className="text-sm font-medium">{prescription.doctorName}</p>
              <p className="text-xs text-muted-foreground">{prescription.profession}</p>
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
