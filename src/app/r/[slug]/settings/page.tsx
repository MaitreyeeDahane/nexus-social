import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { CommunitySettingsForm } from "@/components/communities/community-settings-form"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = { title: "Community Settings" }

export default async function CommunitySettingsPage({ params }: PageProps) {
  const { slug } = await params
  const session = await auth()
  if (!session) redirect("/login")

  const community = await prisma.community.findUnique({
    where: { slug },
    include: {
      rules: { orderBy: { order: "asc" } },
      settings: true,
      moderators: {
        include: { user: { select: { id: true, name: true, username: true, image: true } } },
      },
    },
  })

  if (!community) notFound()

  const isMod = await prisma.communityModerator.findUnique({
    where: { userId_communityId: { userId: session.user.id, communityId: community.id } },
  })

  if (!isMod && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect(`/r/${slug}`)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">r/{community.name} Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your community settings and moderation tools</p>
      </div>
      <CommunitySettingsForm community={community} />
    </div>
  )
}
