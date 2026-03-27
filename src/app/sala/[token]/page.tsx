import { getPatientJoinInfo } from "@/server/actions/teleconsulta"
import { PatientTeleconsulta } from "./patient-teleconsulta"

export default async function PatientJoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  try {
    const info = await getPatientJoinInfo(token)
    return <PatientTeleconsulta info={info} />
  } catch (error) {
    const message = error instanceof Error ? error.message : "Teleconsulta nao encontrada"
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 text-center space-y-4">
          <div className="mx-auto size-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="size-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Teleconsulta indisponivel</h1>
          <p className="text-sm text-gray-500">{message}</p>
          <p className="text-xs text-gray-400">Entre em contato com seu profissional de saude para mais informacoes.</p>
        </div>
      </div>
    )
  }
}
