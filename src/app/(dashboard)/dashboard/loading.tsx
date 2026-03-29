import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      {/* Hero + inline stats */}
      <div className="rounded-2xl border border-border/40 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Today's agenda + quick actions */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-11" />
                <Skeleton className="size-2 rounded-full" />
                <Skeleton className="h-4 w-32 flex-1" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </Card>
        <div className="flex flex-row lg:flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-11 rounded-xl flex-1 lg:flex-none" />
          ))}
        </div>
      </div>

      {/* Activity + Patients */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  )
}
