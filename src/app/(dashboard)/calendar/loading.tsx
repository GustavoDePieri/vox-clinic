import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function CalendarLoading() {
  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-5 w-[200px]" />
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-7 w-12 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl bg-muted/50 p-0.5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>

      {/* Week View Grid */}
      <Card className="rounded-2xl border border-border/40 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/40">
          <div className="py-2" />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex flex-col items-center py-2 border-l border-border/30">
              <Skeleton className="h-3 w-8 mb-1" />
              <Skeleton className="size-7 rounded-full" />
            </div>
          ))}
        </div>

        {/* Time slots */}
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/20 last:border-0">
            <div className="flex items-start justify-end pr-2 pt-1">
              <Skeleton className="h-3 w-8" />
            </div>
            {[1, 2, 3, 4, 5, 6, 7].map((j) => (
              <div key={j} className="h-14 border-l border-border/20 p-0.5">
                {(i === 1 && j === 2) || (i === 3 && j === 5) || (i === 5 && j === 1) ? (
                  <Skeleton className="h-6 w-full rounded-md" />
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </Card>
    </div>
  )
}
