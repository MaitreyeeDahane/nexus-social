import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { SubmitPostForm } from "@/components/posts/submit-post-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Post",
  description: "Share something with the Nexus community",
}

interface PageProps {
  searchParams: Promise<{ community?: string; type?: string }>
}

export default async function SubmitPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session) redirect("/login?callbackUrl=/submit")

  const { community: communitySlug, type } = await searchParams

  // Fetch user's communities for the selector
  const userCommunities = await prisma.communityMember.findMany({
    where: { userId: session.user.id },
    include: {
      community: { select: { id: true, name: true, slug: true, avatar: true } },
    },
    orderBy: { joinedAt: "desc" },
    take: 50,
  })

  // All communities for non-members
  const allCommunities = await prisma.community.findMany({
    where: { deletedAt: null, isPrivate: false },
    select: { id: true, name: true, slug: true, avatar: true },
    orderBy: { memberCount: "desc" },
    take: 30,
  })

  const defaultCommunityId = communitySlug
    ? allCommunities.find(c => c.slug === communitySlug)?.id
    : undefined

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create a Post</h1>
        <p className="text-muted-foreground text-sm mt-1">Share something with the community</p>
      </div>
      <SubmitPostForm
        communities={allCommunities}
        userCommunities={userCommunities.map(m => m.community)}
        defaultCommunityId={defaultCommunityId}
        defaultType={(type as "TEXT" | "IMAGE" | "LINK" | "POLL") || "TEXT"}
      />
    </div>
  )
}
