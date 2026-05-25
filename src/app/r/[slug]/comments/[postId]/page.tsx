import { notFound } from "next/navigation"
import { Suspense } from "react"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { PostDetail } from "@/components/posts/post-detail"
import { CommunitySidebar } from "@/components/communities/community-sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string; postId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { postId } = await params
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { title: true, content: true, community: { select: { name: true } } },
  })
  if (!post) return { title: "Post Not Found" }
  return {
    title: post.title,
    description: post.content?.slice(0, 155) || `Post in r/${post.community.name}`,
  }
}

export default async function PostPage({ params }: PageProps) {
  const { slug, postId } = await params
  const session = await auth()

  const community = await prisma.community.findUnique({
    where: { slug },
    include: {
      rules: { orderBy: { order: "asc" } },
      moderators: {
        include: { user: { select: { id: true, name: true, username: true, image: true } } },
      },
      settings: true,
      _count: { select: { members: true, posts: true } },
    },
  })

  if (!community) notFound()

  let isMember = false
  let isMod = false
  if (session?.user?.id) {
    const [member, mod] = await Promise.all([
      prisma.communityMember.findUnique({
        where: { userId_communityId: { userId: session.user.id, communityId: community.id } },
      }),
      prisma.communityModerator.findUnique({
        where: { userId_communityId: { userId: session.user.id, communityId: community.id } },
      }),
    ])
    isMember = !!member
    isMod = !!mod
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <Suspense fallback={<PostDetailSkeleton />}>
            <PostDetail postId={postId} session={session} />
          </Suspense>
        </div>
        <aside className="hidden lg:block w-80 shrink-0">
          <CommunitySidebar community={community} isMember={isMember} isMod={isMod} session={session} />
        </aside>
      </div>
    </div>
  )
}

function PostDetailSkeleton() {
  return (
    <div className="nexus-card space-y-4">
      <div className="flex gap-3">
        <div className="space-y-2 flex-col flex items-center">
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-8 h-3 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
        </div>
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-3/4 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
      </div>
    </div>
  )
}
