"use client"

import { useState } from "react"
import { Flame, Clock, TrendingUp, BarChart2, Layers, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PostCard } from "@/components/posts/post-card"
import { PostCardSkeleton } from "@/components/posts/post-card-skeleton"
import { usePosts } from "@/hooks/use-posts"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const SORT_OPTIONS = [
  { value: "hot", label: "Hot", icon: Flame },
  { value: "new", label: "New", icon: Clock },
  { value: "top", label: "Top", icon: TrendingUp },
  { value: "rising", label: "Rising", icon: BarChart2 },
] as const

const TIME_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
] as const

interface PostFeedProps {
  community?: string
  userId?: string
  feed?: string
  showCommunity?: boolean
  sort?: "hot" | "new" | "top" | "rising"
  defaultTimeFilter?: "all" | "day" | "week" | "month" | "year"
}

export function PostFeed({ community, userId, feed = "all", showCommunity = true, sort: sortProp, defaultTimeFilter }: PostFeedProps) {
  const { postSort, setPostSort, postTimeFilter, setPostTimeFilter, compactMode, setCompactMode } = useUIStore()
  const [sort, setSort] = useState<"hot" | "new" | "top" | "rising">(sortProp ?? postSort)
  const [timeFilter, setTimeFilter] = useState<"all" | "day" | "week" | "month" | "year">(defaultTimeFilter ?? postTimeFilter)

  const { posts, isLoading, isError, hasNextPage, isFetchingNextPage, loadMoreRef } = usePosts({
    sort,
    time: timeFilter,
    community,
    userId,
    feed,
  })

  const handleSortChange = (newSort: typeof sort) => {
    setSort(newSort)
    setPostSort(newSort)
  }

  return (
    <div className="space-y-3">
      {/* Sort controls */}
      <div className="nexus-card p-2">
        <div className="flex items-center gap-1 flex-wrap">
          {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={sort === value ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-8 gap-1.5 text-xs", sort === value && "font-semibold")}
              onClick={() => handleSortChange(value)}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Button>
          ))}

          {sort === "top" && (
            <div className="ml-auto">
              <select
                value={timeFilter}
                onChange={e => setTimeFilter(e.target.value as typeof timeFilter)}
                className="h-8 px-2 text-xs bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TIME_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto"
            onClick={() => setCompactMode(!compactMode)}
            title={compactMode ? "Card view" : "Compact view"}
          >
            {compactMode ? <Layers className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {isLoading && (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        )}

        {isError && (
          <div className="nexus-card text-center py-12">
            <p className="text-muted-foreground text-sm">Failed to load posts.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
            >
              <PostCard post={post} compact={compactMode} showCommunity={showCommunity} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Load more trigger */}
        <div ref={loadMoreRef} className="h-4" />

        {isFetchingNextPage && (
          <div className="space-y-3">
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        )}

        {!isLoading && !hasNextPage && posts.length > 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">
            You've reached the end 🎉
          </p>
        )}

        {!isLoading && posts.length === 0 && !isError && (
          <div className="nexus-card text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Flame className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No posts yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {community ? "Be the first to post in this community!" : "Join some communities to see posts here."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
