import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const session = await auth()
    const { searchParams } = new URL(req.url)
    const sort = searchParams.get("sort") || "top"

    const post = await prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      include: {
        author: {
          select: { id: true, name: true, username: true, image: true, karma: true, isVerified: true, createdAt: true },
        },
        community: {
          select: {
            id: true, name: true, slug: true, avatar: true, banner: true,
            description: true, memberCount: true,
            rules: { orderBy: { order: "asc" } },
          },
        },
        flair: true,
        poll: {
          include: {
            options: {
              include: {
                _count: { select: { votes: true } },
                ...(session?.user?.id && {
                  votes: { where: { userId: session.user.id } },
                }),
              },
            },
          },
        },
        _count: { select: { comments: true } },
        ...(session?.user?.id && {
          votes: { where: { userId: session.user.id }, select: { type: true } },
          bookmarks: { where: { userId: session.user.id }, select: { id: true } },
        }),
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    await prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    })

    let isMember = false
    let isMod = false
    if (session?.user?.id) {
      const [member, mod] = await Promise.all([
        prisma.communityMember.findUnique({
          where: { userId_communityId: { userId: session.user.id, communityId: post.communityId } },
        }),
        prisma.communityModerator.findUnique({
          where: { userId_communityId: { userId: session.user.id, communityId: post.communityId } },
        }),
      ])
      isMember = !!member
      isMod = !!mod
    }

    const orderBy =
      sort === "new"
        ? [{ createdAt: "desc" as const }]
        : sort === "old"
        ? [{ createdAt: "asc" as const }]
        : [{ score: "desc" as const }, { createdAt: "asc" as const }]

    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null, isDeleted: false },
      orderBy,
      include: {
        author: {
          select: { id: true, name: true, username: true, image: true, karma: true, isVerified: true },
        },
        replies: {
          where: { isDeleted: false },
          orderBy: [{ createdAt: "asc" }],
          include: {
            author: {
              select: { id: true, name: true, username: true, image: true, karma: true, isVerified: true },
            },
            replies: {
              where: { isDeleted: false },
              orderBy: [{ createdAt: "asc" }],
              include: {
                author: {
                  select: { id: true, name: true, username: true, image: true, karma: true, isVerified: true },
                },
                _count: { select: { replies: true } },
                ...(session?.user?.id && {
                  votes: { where: { userId: session.user.id }, select: { type: true } },
                }),
              },
            },
            _count: { select: { replies: true } },
            ...(session?.user?.id && {
              votes: { where: { userId: session.user.id }, select: { type: true } },
            }),
          },
        },
        _count: { select: { replies: true } },
        ...(session?.user?.id && {
          votes: { where: { userId: session.user.id }, select: { type: true } },
        }),
      },
    })

    const postData = post as typeof post & {
      votes?: Array<{ type: string }>
      bookmarks?: Array<{ id: string }>
    }

    return NextResponse.json({
      post: {
        ...postData,
        commentCount: post._count.comments,
        userVote: postData.votes?.[0]?.type || null,
        isBookmarked: (postData.bookmarks?.length ?? 0) > 0,
        votes: undefined,
        bookmarks: undefined,
        _count: undefined,
      },
      comments,
      isMember,
      isMod,
    })
  } catch (error) {
    console.error("Post detail API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { postId } = await params
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, communityId: true },
    })
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const isMod = await prisma.communityModerator.findUnique({
      where: { userId_communityId: { userId: session.user.id, communityId: post.communityId } },
    })

    if (post.authorId !== session.user.id && !isMod && session.user.role === "USER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.post.update({
      where: { id: postId },
      data: { isDeleted: true, deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
