"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

const filters = [
  { value: "all", label: "Todos" },
  { value: "scheduled", label: "Agendados" },
  { value: "completed", label: "Concluidos" },
  { value: "cancelled", label: "Cancelados" },
]

export function AppointmentsFilter({ currentStatus }: { currentStatus: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <Link
          key={f.value}
          href={`/appointments${f.value !== "all" ? `?status=${f.value}` : ""}`}
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors",
            currentStatus === f.value
              ? "bg-vox-primary text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          {f.label}
        </Link>
      ))}
    </div>
  )
}
