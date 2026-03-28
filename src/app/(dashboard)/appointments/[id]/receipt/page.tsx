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

function formatCurrency(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100)
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
      <div className="print:hidden mb-6 flex items-center justify-between gap-4">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
        <PrintButton />
      </div>

      {/* Receipt — A4 page simulation */}
      <div className="mx-auto max-w-[210mm] print:max-w-none print:mx-0">
        <div className="bg-white text-gray-900 shadow-lg print:shadow-none rounded-lg print:rounded-none border border-gray-200 print:border-0 min-h-[297mm] flex flex-col" style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>

          {/* ── Header with teal accent bar ── */}
          <header className="relative px-10 pt-8 pb-6">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-teal-500 to-teal-400 print:from-teal-600 print:to-teal-500 rounded-t-lg print:rounded-none" />

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  {receipt.clinicName}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{receipt.profession}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-widest text-teal-600">
                  Recibo
                </p>
                <p className="text-xs text-gray-400 mt-1">{today}</p>
              </div>
            </div>

            <div className="mt-5 border-b-2 border-gray-100 print:border-gray-200" />
          </header>

          {/* ── Patient info strip ── */}
          <section className="px-10 py-4 bg-gray-50 print:bg-gray-50 border-y border-gray-100 print:border-gray-200">
            <div className="flex flex-wrap gap-x-10 gap-y-2 text-sm">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Paciente</span>
                <p className="font-semibold text-gray-900">{receipt.patientName}</p>
              </div>
              {receipt.patientDocument && (
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">CPF</span>
                  <p className="font-semibold text-gray-900">{receipt.patientDocument}</p>
                </div>
              )}
              <div className="ml-auto text-right">
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Data do Atendimento</span>
                <p className="font-semibold text-gray-900">{formatDate(receipt.date)}</p>
              </div>
            </div>
          </section>

          {/* ── Procedures ── */}
          <section className="flex-1 px-10 py-8">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-4">Procedimentos Realizados</p>

            {receipt.procedures.length > 0 ? (
              <div className="space-y-0">
                {receipt.procedures.map((proc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3.5 border-b border-dashed border-gray-200 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center size-7 rounded-full bg-teal-50 text-teal-700 text-xs font-bold print:bg-teal-50 print:text-teal-700 border border-teal-200/60">
                        {index + 1}
                      </span>
                      <span className="text-[15px] text-gray-800">{proc}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic py-4">Nenhum procedimento registrado</p>
            )}

            {/* Total */}
            <div className="mt-8 flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-5 py-4 print:bg-gray-50">
              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total</span>
              <span className="text-xl font-bold text-gray-900">
                {totalPrice > 0 ? formatCurrency(totalPrice) : "—"}
              </span>
            </div>
          </section>

          {/* ── Signature ── */}
          <section className="px-10 pb-4 pt-8">
            <div className="mx-auto max-w-xs text-center">
              <div className="border-b-2 border-gray-900 mb-2" />
              <p className="text-sm font-semibold text-gray-900">{receipt.clinicName}</p>
            </div>
          </section>

          {/* ── Footer ── */}
          <footer className="px-10 py-4 mt-auto">
            <div className="border-t border-gray-100 print:border-gray-200 pt-4 flex items-center justify-between">
              <p className="text-[10px] text-gray-400">
                Documento gerado pelo VoxClinic em {today}
              </p>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">
                VOXCLINIC
              </p>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}
