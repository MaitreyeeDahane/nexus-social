import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { communityId } = await params

    const community = await prisma.community.findUnique({ where: { id: communityId } })
    if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 })

    const existing = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: session.user.id, communityId } },
    })

    if (existing) {
      await prisma.communityMember.delete({ where: { id: existing.id } })
      await prisma.community.update({ where: { id: communityId }, data: { memberCount: { decrement: 1 } } })
      return NextResponse.json({ joined: false, memberCount: community.memberCount - 1 })
    } else {
      await prisma.communityMember.create({ data: { userId: session.user.id, communityId } })
      await prisma.community.update({ where: { id: communityId }, data: { memberCount: { increment: 1 } } })
      return NextResponse.json({ joined: true, memberCount: community.memberCount + 1 })
    }
  } catch (error) {
    console.error("Join community error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
