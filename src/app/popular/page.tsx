import { PostFeed } from "@/components/posts/post-feed"
import { HomeSidebar } from "@/components/layout/home-sidebar"
import { auth } from "@/auth"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Popular Posts",
  description: "The most popular posts on Nexus Social right now",
}

export default async function PopularPage() {
  const session = await auth()
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Popular</h1>
            <p className="text-sm text-muted-foreground">The best posts across all communities</p>
          </div>
          <PostFeed feed="all" sort="hot" showCommunity={true} />
        </div>
        <aside className="hidden lg:block w-80 shrink-0">
          <HomeSidebar session={session} />
        </aside>
      </div>
    </div>
  )
}
