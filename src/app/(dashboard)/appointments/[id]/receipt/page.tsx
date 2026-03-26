import { generateReceiptData } from "@/server/actions/receipt"
import { PrintButton } from "./print-button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const receipt = await generateReceiptData(id)

  const today = formatDateLong(new Date())
  const totalPrice = receipt.price ?? 0

  return (
    <>
      {/* Top bar - hidden on print */}
      <div className="print:hidden mb-8 flex items-center justify-between gap-4">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
        <PrintButton />
      </div>

      {/* Receipt content */}
      <div className="mx-auto max-w-2xl bg-white print:bg-white print:max-w-none print:mx-0">
        <div className="rounded-xl border border-border print:border-0 print:shadow-none p-8 print:p-0 space-y-8">

          {/* Header */}
          <header className="border-b border-border pb-6 print:border-b-gray-300 text-center">
            <h2 className="text-sm font-medium text-vox-primary uppercase tracking-wider">
              VoxClinic
            </h2>
            <p className="text-lg font-semibold mt-1">{receipt.clinicName}</p>
            <p className="text-sm text-muted-foreground">{receipt.profession}</p>
          </header>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight print:text-3xl">
              RECIBO DE ATENDIMENTO
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
                <p className="font-medium">{receipt.patientName}</p>
              </div>
              {receipt.patientDocument && (
                <div>
                  <span className="text-muted-foreground">CPF</span>
                  <p className="font-medium">{receipt.patientDocument}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Data do Atendimento</span>
                <p className="font-medium">{formatDate(receipt.date)}</p>
              </div>
            </div>
          </section>

          {/* Procedures Table */}
          <section>
            <h2 className="text-base font-semibold mb-3 text-foreground">
              Procedimentos Realizados
            </h2>
            <div className="border border-border rounded-xl overflow-hidden print:border-gray-300 overflow-x-auto print:overflow-visible">
              <table className="w-full text-sm min-w-[400px] print:min-w-0">
                <thead>
                  <tr className="bg-muted/50 print:bg-gray-100">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Procedimento
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.procedures.length > 0 ? (
                    receipt.procedures.map((proc, index) => (
                      <tr
                        key={index}
                        className={
                          index % 2 === 0
                            ? "bg-white print:bg-white"
                            : "bg-muted/30 print:bg-gray-50"
                        }
                      >
                        <td className="px-4 py-3">{proc}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          -
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-white print:bg-white">
                      <td className="px-4 py-3 text-muted-foreground" colSpan={2}>
                        Nenhum procedimento registrado
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border print:border-t-gray-300 font-semibold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">
                      {totalPrice > 0 ? formatCurrency(totalPrice) : "-"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Signature */}
          <section className="pt-8 text-center">
            <div className="inline-block">
              <p className="text-sm mb-1">___________________________</p>
              <p className="text-sm font-medium">{receipt.clinicName}</p>
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
