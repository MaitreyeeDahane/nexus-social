import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 })
    }

    const body = await req.json()
    const { isBanned, role, isVerified } = body

    const updateData: Record<string, unknown> = {}
    if (typeof isBanned === "boolean") {
      updateData.isBanned = isBanned
      if (isBanned) updateData.bannedAt = new Date()
      else { updateData.bannedAt = null; updateData.banReason = null }
    }
    if (role && ["USER", "MODERATOR", "ADMIN"].includes(role)) {
      // Only SUPER_ADMIN can set ADMIN role
      if (role === "ADMIN" && session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
      updateData.role = role
    }
    if (typeof isVerified === "boolean") updateData.isVerified = isVerified

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, isBanned: true, role: true, isVerified: true },
    })

    // Log the moderation action
    await prisma.moderationLog.create({
      data: {
        moderatorId: session.user.id,
        targetId: userId,
        targetType: "USER",
        action: isBanned ? "BAN_USER" : "UNBAN_USER",
        reason: body.reason || "Admin action",
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Admin user action error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
