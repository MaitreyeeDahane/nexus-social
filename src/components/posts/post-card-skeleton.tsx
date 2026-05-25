import { Skeleton } from "@/components/ui/skeleton"

export function PostCardSkeleton() {
  return (
    <div className="post-card">
      <div className="flex">
        {/* Vote sidebar */}
        <div className="flex flex-col items-center py-3 px-2 gap-1 min-w-[44px]">
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-6 h-3 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
        </div>
        {/* Content */}
        <div className="flex-1 py-3 pr-3 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-14 rounded" />
          </div>
          <Skeleton className="h-5 w-3/4 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-7 w-24 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-14 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}
