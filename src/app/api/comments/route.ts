import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { createCommentSchema } from "@/lib/validations"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const postId = searchParams.get("postId")
    const userId = searchParams.get("userId")
    const sort = searchParams.get("sort") || "top"
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const cursor = searchParams.get("cursor")
    const session = await auth()

    // User comments feed
    if (userId) {
      const comments = await prisma.comment.findMany({
        where: { authorId: userId, isDeleted: false },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, username: true, image: true, karma: true, isVerified: true } },
          post: {
            select: {
              id: true, title: true,
              community: { select: { slug: true, name: true } },
            },
          },
        },
      })
      const hasMore = comments.length > limit
      const data = comments.slice(0, limit)
      return NextResponse.json({
        comments: data,
        hasMore,
        nextCursor: hasMore ? data[data.length - 1]?.id : null,
      })
    }

    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 })

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
        author: { select: { id: true, name: true, username: true, image: true, karma: true, isVerified: true } },
        replies: {
          where: { isDeleted: false },
          orderBy: [{ createdAt: "asc" }],
          include: {
            author: { select: { id: true, name: true, username: true, image: true, karma: true, isVerified: true } },
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

    return NextResponse.json({ comments })
  } catch (error) {
    console.error("Comments GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const ip = getClientIp(req)
    const rateCheck = checkRateLimit(ip, "comment")
    if (!rateCheck.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

    const body = await req.json()
    const validated = createCommentSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.errors[0].message }, { status: 400 })
    }

    const { content, postId, parentId } = validated.data
    const post = await prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      select: { isLocked: true, authorId: true, communityId: true },
    })
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })
    if (post.isLocked) return NextResponse.json({ error: "Post is locked" }, { status: 403 })

    let depth = 0
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { depth: true, authorId: true },
      })
      depth = (parent?.depth ?? 0) + 1
    }

    const comment = await prisma.comment.create({
      data: { content, authorId: session.user.id, postId, parentId: parentId || null, depth },
      include: {
        author: { select: { id: true, name: true, username: true, image: true, karma: true, isVerified: true } },
      },
    })

    await prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } })
    await prisma.user.update({ where: { id: session.user.id }, data: { karma: { increment: 1 } } })

    // Notify post/comment author
    const recipientId = parentId
      ? (await prisma.comment.findUnique({ where: { id: parentId }, select: { authorId: true } }))?.authorId
      : post.authorId

    if (recipientId && recipientId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: parentId ? "REPLY" : "COMMENT",
          recipientId,
          senderId: session.user.id,
          postId,
          commentId: comment.id,
          message: parentId
            ? `${session.user.username || session.user.name} replied to your comment`
            : `${session.user.username || session.user.name} commented on your post`,
        },
      }).catch(() => {}) // Non-fatal
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error("Comment POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
