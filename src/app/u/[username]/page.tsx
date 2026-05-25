import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { UserProfileHeader } from "@/components/profile/user-profile-header"
import { UserProfileContent } from "@/components/profile/user-profile-content"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const user = await prisma.user.findUnique({ where: { username }, select: { name: true, bio: true } })
  if (!user) return { title: "User Not Found" }
  return {
    title: `u/${username}`,
    description: user.bio || `${user.name}'s profile on Nexus Social`,
  }
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      achievements: { include: { achievement: true }, take: 10 },
      _count: {
        select: { posts: true, comments: true, followers: true, following: true },
      },
    },
  })

  if (!user || user.isBanned) notFound()

  const isOwnProfile = session?.user?.id === user.id

  let isFollowing = false
  if (session?.user?.id && !isOwnProfile) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId: user.id } },
    })
    isFollowing = !!follow
  }

  const profileData = {
    id: user.id,
    name: user.name,
    username: user.username,
    bio: user.bio,
    image: user.image,
    coverImage: user.coverImage,
    karma: user.karma,
    website: user.website,
    location: user.location,
    isVerified: user.isVerified,
    role: user.role,
    createdAt: user.createdAt,
    achievements: user.achievements,
    _count: user._count,
  }

  return (
    <div>
      <UserProfileHeader
        user={profileData}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        session={session}
      />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <UserProfileContent userId={user.id} username={username} isOwnProfile={isOwnProfile} />
      </div>
    </div>
  )
}
