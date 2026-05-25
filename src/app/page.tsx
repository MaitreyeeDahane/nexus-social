import { Suspense } from "react"
import { auth } from "@/auth"
import { PostFeed } from "@/components/posts/post-feed"
import { HomeSidebar } from "@/components/layout/home-sidebar"
import { CreatePostCard } from "@/components/posts/create-post-card"
import { PostCardSkeleton } from "@/components/posts/post-card-skeleton"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Nexus Social – Where Communities Come to Life",
  description: "Discover the best posts and communities on Nexus Social",
}

export default async function HomePage() {
  const session = await auth()

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Main feed */}
        <div className="flex-1 min-w-0 space-y-3">
          {session && <CreatePostCard />}
          <Suspense fallback={<FeedSkeleton />}>
            <PostFeed feed={session ? "home" : "all"} showCommunity={true} />
          </Suspense>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block w-80 shrink-0">
          <HomeSidebar session={session} />
        </aside>
      </div>
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}
