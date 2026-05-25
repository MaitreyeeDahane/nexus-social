import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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
            votes: { where: { userId: session.user.id }, select: { type: true } },
            _count: { select: { comments: true } },
          },
        },
      },
    })

    const posts = bookmarks
      .filter(b => !b.post.isDeleted)
      .map(b => ({
        ...b.post,
        userVote: (b.post as any).votes?.[0]?.type || null,
        isBookmarked: true,
        commentCount: b.post._count.comments,
        votes: undefined,
        _count: undefined,
      }))

    return NextResponse.json({ posts })
  } catch (error) {
    console.error("Bookmarks API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
