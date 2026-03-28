import { getTeleconsultaInfo } from "@/server/actions/teleconsulta"
import { TeleconsultaRoom } from "./teleconsulta-room"

export default async function TeleconsultaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let room = null
  let errorMessage: string | null = null

  try {
    room = await getTeleconsultaInfo(id)
  } catch (err) {
    console.error("[TeleconsultaPage] failed to load appointment info:", err)
    errorMessage = err instanceof Error ? err.message : "Erro ao carregar teleconsulta"
  }

  if (errorMessage || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">Erro na teleconsulta</h2>
          <p className="text-sm text-muted-foreground">{errorMessage || "Consulta nao encontrada"}</p>
        </div>
        <a href="/calendar" className="rounded-xl bg-vox-primary px-4 py-2 text-sm font-medium text-white hover:bg-vox-primary/90">
          Voltar para Agenda
        </a>
      </div>
    )
  }

  return <TeleconsultaRoom appointment={room} />
}
