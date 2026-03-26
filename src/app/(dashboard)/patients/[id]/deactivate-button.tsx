"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"
import { deactivatePatient } from "@/server/actions/patient"
import { toast } from "sonner"

export function DeactivateButton({ patientId }: { patientId: string }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDeactivate = async () => {
    setLoading(true)
    try {
      await deactivatePatient(patientId)
      toast.success("Paciente desativado")
      router.push("/patients")
    } catch {
      toast.error("Erro ao desativar paciente")
      setLoading(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <div className="rounded-xl border border-vox-error/30 bg-vox-error/5 p-3 text-sm text-vox-error max-w-sm">
          Tem certeza que deseja desativar este paciente? Os dados serao mantidos por 20 anos conforme regulamentacao.
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeactivate}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Desativando...
            </>
          ) : (
            "Confirmar"
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfirm(false)}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowConfirm(true)}
      className="text-vox-error border-vox-error/30 hover:bg-vox-error/5"
    >
      <AlertTriangle className="size-4" />
      Desativar Paciente
    </Button>
  )
}
