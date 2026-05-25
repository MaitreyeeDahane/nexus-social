import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { username } = await params
    const targetUser = await prisma.user.findUnique({ where: { username }, select: { id: true } })
    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (targetUser.id === session.user.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId: targetUser.id } },
    })

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } })
      return NextResponse.json({ following: false })
    } else {
      await prisma.follow.create({ data: { followerId: session.user.id, followingId: targetUser.id } })
      // Create notification
      await prisma.notification.create({
        data: {
          type: "FOLLOW",
          recipientId: targetUser.id,
          senderId: session.user.id,
          message: `${session.user.username || session.user.name} started following you`,
        },
      })
      return NextResponse.json({ following: true })
    }
  } catch (error) {
    console.error("Follow error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
