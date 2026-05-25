import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const session = await auth()

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true, name: true, username: true, bio: true, image: true,
        coverImage: true, karma: true, website: true, location: true,
        isVerified: true, role: true, createdAt: true, isBanned: true,
        achievements: { include: { achievement: true }, take: 10 },
        _count: { select: { posts: true, comments: true, followers: true, following: true } },
      },
    })

    if (!user || user.isBanned) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let isFollowing = false
    if (session?.user?.id && session.user.id !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: session.user.id, followingId: user.id } },
      })
      isFollowing = !!follow
    }

    const { isBanned: _banned, ...safeUser } = user
    return NextResponse.json({ user: safeUser, isFollowing })
  } catch (error) {
    console.error("User API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
