import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function AppointmentsLoading() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Date groups */}
      {[1, 2].map((g) => (
        <div key={g}>
          {/* Date header */}
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-6 rounded-full" />
            <div className="flex-1 h-px bg-border/40" />
          </div>

          {/* Rows */}
          <Card className="divide-y divide-border/40">
            {Array.from({ length: g === 1 ? 3 : 2 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="size-10 rounded-xl shrink-0" />
                <Skeleton className="size-9 rounded-full shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  )
}
