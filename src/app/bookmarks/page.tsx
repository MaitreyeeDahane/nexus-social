import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { PostCard } from "@/components/posts/post-card"
import { Bookmark } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Saved Posts" }

export default async function BookmarksPage() {
  const session = await auth()
  if (!session) redirect("/login?callbackUrl=/bookmarks")

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      post: {
        include: {
          author: { select: { id: true, name: true, username: true, image: true, isVerified: true, karma: true } },
          community: { select: { id: true, name: true, slug: true, avatar: true, memberCount: true } },
          flair: true,
          _count: { select: { comments: true } },
          votes: { where: { userId: session.user.id }, select: { type: true } },
        },
      },
    },
  })

  const posts = bookmarks
    .filter(b => !b.post.isDeleted)
    .map(b => ({
      ...b.post,
      userVote: b.post.votes[0]?.type || null,
      isBookmarked: true,
      commentCount: b.post._count.comments,
      votes: undefined,
    }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bookmark className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Saved Posts</h1>
          <p className="text-muted-foreground text-sm">{posts.length} saved posts</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="nexus-card text-center py-16">
          <Bookmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="font-semibold mb-2">No saved posts yet</h2>
          <p className="text-sm text-muted-foreground">Click the bookmark icon on any post to save it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <PostCard key={post.id} post={post as any} showCommunity={true} />
          ))}
        </div>
      )}
    </div>
  )
}
