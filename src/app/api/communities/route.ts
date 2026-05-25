import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const sort = searchParams.get("sort") || "members"
    const q = searchParams.get("q")

    const communities = await prisma.community.findMany({
      where: {
        deletedAt: null,
        isPrivate: false,
        ...(q && {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: sort === "new" ? { createdAt: "desc" } : sort === "posts" ? { postCount: "desc" } : { memberCount: "desc" },
      take: limit,
      select: {
        id: true, name: true, slug: true, description: true,
        avatar: true, memberCount: true, postCount: true, isNSFW: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ communities })
  } catch (error) {
    console.error("Communities API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
