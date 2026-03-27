import { Video } from "lucide-react"
import Link from "next/link"

export function TeleconsultaBadge({ appointmentId, type }: { appointmentId: string; type?: string | null }) {
  if (type !== "teleconsulta") return null
  return (
    <Link
      href={`/teleconsulta/${appointmentId}`}
      className="inline-flex items-center gap-1 text-xs font-medium text-vox-primary hover:underline"
    >
      <Video className="size-3" />
      Teleconsulta
    </Link>
  )
}
