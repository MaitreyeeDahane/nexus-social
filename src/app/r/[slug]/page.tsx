import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { PostFeed } from "@/components/posts/post-feed"
import { CommunitySidebar } from "@/components/communities/community-sidebar"
import { CommunityHeader } from "@/components/communities/community-header"
import { CreatePostCard } from "@/components/posts/create-post-card"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const community = await prisma.community.findUnique({
    where: { slug },
    select: { name: true, description: true, avatar: true },
  })
  if (!community) return { title: "Community Not Found" }
  return {
    title: `r/${community.name}`,
    description: community.description || `The ${community.name} community on Nexus Social`,
    openGraph: {
      title: `r/${community.name} - Nexus Social`,
      description: community.description || undefined,
      images: community.avatar ? [community.avatar] : [],
    },
  }
}

export default async function CommunityPage({ params }: PageProps) {
  const { slug } = await params
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
    <div>
      <CommunityHeader community={community} isMember={isMember} isMod={isMod} session={session} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0 space-y-3">
            {session && isMember && <CreatePostCard />}
            <PostFeed community={slug} showCommunity={false} />
          </div>
          <aside className="hidden lg:block w-80 shrink-0">
            <CommunitySidebar community={community} isMember={isMember} isMod={isMod} session={session} />
          </aside>
        </div>
      </div>
    </div>
  )
}
