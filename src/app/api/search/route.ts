import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rateCheck = checkRateLimit(ip, "search")
    if (!rateCheck.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim()
    const type = searchParams.get("type") || "posts"
    const sort = searchParams.get("sort") || "relevance"
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1)
    const skip = (page - 1) * limit

    if (!q || q.length < 1) return NextResponse.json({ error: "Query required" }, { status: 400 })

    const results: Record<string, unknown> = {}
    const isoQuery = { contains: q, mode: "insensitive" as const }
    const orderByScore = sort === "new" ? { createdAt: "desc" as const } : { score: "desc" as const }

    if (type === "posts" || type === "all") {
      results.posts = await prisma.post.findMany({
        where: {
          isDeleted: false, isDraft: false,
          OR: [{ title: isoQuery }, { content: isoQuery }],
        },
        take: limit, skip,
        orderBy: sort === "new" ? { createdAt: "desc" } : { score: "desc" },
        include: {
          author: { select: { id: true, name: true, username: true, image: true, karma: true, isVerified: true } },
          community: { select: { id: true, name: true, slug: true, avatar: true, memberCount: true } },
          flair: true,
          _count: { select: { comments: true } },
        },
      }).then(posts => posts.map(p => ({
        ...p,
        commentCount: p._count.comments,
        userVote: null,
        isBookmarked: false,
        _count: undefined,
      })))
    }

    if (type === "communities" || type === "all") {
      results.communities = await prisma.community.findMany({
        where: {
          deletedAt: null,
          OR: [{ name: isoQuery }, { description: isoQuery }],
        },
        take: limit, skip,
        orderBy: { memberCount: "desc" },
        select: {
          id: true, name: true, slug: true, description: true,
          avatar: true, memberCount: true, isNSFW: true,
        },
      })
    }

    if (type === "users" || type === "all") {
      results.users = await prisma.user.findMany({
        where: {
          isBanned: false,
          OR: [{ username: isoQuery }, { name: isoQuery }],
        },
        take: limit, skip,
        orderBy: { karma: "desc" },
        select: {
          id: true, name: true, username: true, image: true,
          karma: true, isVerified: true, bio: true, createdAt: true,
          _count: { select: { posts: true, followers: true } },
        },
      })
    }

    if (type === "comments" || type === "all") {
      results.comments = await prisma.comment.findMany({
        where: { isDeleted: false, content: isoQuery },
        take: limit, skip,
        orderBy: sort === "new" ? { createdAt: "desc" } : { score: "desc" },
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
    }

    return NextResponse.json({ results, query: q, type })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
