import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

type SortBy = "hot" | "new" | "top" | "rising"
type TimeFilter = "all" | "day" | "week" | "month" | "year"

function getTimeFilter(filter: TimeFilter): Date | undefined {
  const now = new Date()
  const ms = { day: 86400000, week: 604800000, month: 2592000000, year: 31536000000 }
  return filter === "all" ? undefined : new Date(now.getTime() - (ms[filter] ?? 0))
}

function getOrderBy(sort: SortBy): object {
  switch (sort) {
    case "new": return { createdAt: "desc" }
    case "top": return { score: "desc" }
    case "rising": return [{ commentCount: "desc" }, { createdAt: "desc" }]
    default: return [{ score: "desc" }, { createdAt: "desc" }] // hot
  }
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rateCheck = checkRateLimit(ip, "default")
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many requests" }, {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rateCheck.reset - Date.now()) / 1000)) },
      })
    }

    const session = await auth()
    const { searchParams } = new URL(req.url)
    const sort = (searchParams.get("sort") || "hot") as SortBy
    const time = (searchParams.get("time") || "all") as TimeFilter
    const cursor = searchParams.get("cursor")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const communitySlug = searchParams.get("community")
    const userId = searchParams.get("userId")
    const feed = searchParams.get("feed") || "all"

    const timeFilter = getTimeFilter(time)

    let communityId: string | undefined
    if (communitySlug) {
      const community = await prisma.community.findUnique({
        where: { slug: communitySlug },
        select: { id: true },
      })
      communityId = community?.id
      if (!communityId) return NextResponse.json({ posts: [], hasMore: false, nextCursor: null })
    }

    const where: Record<string, unknown> = {
      isDeleted: false,
      isDraft: false,
      ...(communityId && { communityId }),
      ...(userId && { authorId: userId }),
      ...(timeFilter && { createdAt: { gte: timeFilter } }),
    }

    if (feed === "home" && session?.user?.id && !communityId && !userId) {
      const memberships = await prisma.communityMember.findMany({
        where: { userId: session.user.id },
        select: { communityId: true },
      })
      if (memberships.length > 0) {
        where.communityId = { in: memberships.map((m) => m.communityId) }
      }
    }

    const posts = await prisma.post.findMany({
      where,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: getOrderBy(sort),
      include: {
        author: {
          select: { id: true, name: true, username: true, image: true, karma: true, isVerified: true },
        },
        community: {
          select: { id: true, name: true, slug: true, avatar: true, memberCount: true },
        },
        flair: true,
        _count: { select: { comments: true } },
        ...(session?.user?.id && {
          votes: { where: { userId: session.user.id }, select: { type: true } },
          bookmarks: { where: { userId: session.user.id }, select: { id: true } },
        }),
      },
    })

    const hasMore = posts.length > limit
    const data = posts.slice(0, limit)

    const formatted = data.map((post) => {
      const p = post as typeof post & {
        votes?: Array<{ type: string }>
        bookmarks?: Array<{ id: string }>
      }
      return {
        ...p,
        commentCount: p._count.comments,
        userVote: p.votes?.[0]?.type || null,
        isBookmarked: (p.bookmarks?.length ?? 0) > 0,
        votes: undefined,
        bookmarks: undefined,
        _count: undefined,
      }
    })

    return NextResponse.json({ posts: formatted, hasMore, nextCursor: hasMore ? data[data.length - 1]?.id : null })
  } catch (error) {
    console.error("Posts API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
