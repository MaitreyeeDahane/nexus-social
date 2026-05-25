import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        rules: { orderBy: { order: "asc" } },
        settings: true,
        _count: { select: { members: true, posts: true } },
      },
    })
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ community })
  } catch (error) {
    console.error("Community GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
