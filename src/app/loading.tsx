import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex">
                <div className="flex flex-col items-center py-3 px-2 gap-1 min-w-[44px]">
                  <Skeleton className="w-6 h-6 rounded" />
                  <Skeleton className="w-6 h-3 rounded" />
                  <Skeleton className="w-6 h-6 rounded" />
                </div>
                <div className="flex-1 py-3 pr-3 space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-2/3 rounded" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-7 w-24 rounded-md" />
                    <Skeleton className="h-7 w-16 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <aside className="hidden lg:block w-80 shrink-0 space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </aside>
      </div>
    </div>
  )
}
