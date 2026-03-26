import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Hero Greeting */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-vox-primary/[0.06] via-card to-vox-primary/[0.03] p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-7 w-48" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl mt-3 sm:mt-0" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="size-9 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {/* Left Column */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-5">
          {/* Today's Agenda */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="space-y-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                  <Skeleton className="size-9 rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent className="space-y-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2">
                  <Skeleton className="h-4 w-12 shrink-0" />
                  <Skeleton className="size-7 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-28 flex-1" />
                  <Skeleton className="h-5 w-14 rounded-full shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-1.5">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </CardContent>
          </Card>

          {/* Quick Search */}
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full rounded-xl" />
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent className="space-y-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2">
                  <Skeleton className="size-7 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-28 flex-1" />
                  <Skeleton className="h-3 w-20 shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
