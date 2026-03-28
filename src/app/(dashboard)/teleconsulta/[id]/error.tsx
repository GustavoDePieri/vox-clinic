"use client"

import { useEffect } from "react"
import { Video } from "lucide-react"

export default function TeleconsultaError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[TeleconsultaPage] error:", error) }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Video className="size-12 text-muted-foreground/40" />
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold">Erro na teleconsulta</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Não foi possível carregar a sala de teleconsulta. Verifique se a consulta existe e tente novamente.
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={reset} className="rounded-xl bg-vox-primary px-4 py-2 text-sm font-medium text-white hover:bg-vox-primary/90">
          Tentar novamente
        </button>
        <a href="/calendar" className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50">
          Voltar para Agenda
        </a>
      </div>
    </div>
  )
}
