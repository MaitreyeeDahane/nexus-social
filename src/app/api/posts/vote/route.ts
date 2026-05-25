import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const ip = getClientIp(req)
    const rateCheck = checkRateLimit(ip, "vote")
    if (!rateCheck.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

    const { postId, type } = await req.json()
    if (!postId || !["UP", "DOWN"].includes(type)) {
      return NextResponse.json({ error: "Invalid vote data" }, { status: 400 })
    }

    const existingVote = await prisma.vote.findUnique({
      where: { userId_postId: { userId: session.user.id, postId } },
    })

    let scoreDelta = 0
    if (existingVote) {
      if (existingVote.type === type) {
        await prisma.vote.delete({ where: { id: existingVote.id } })
        scoreDelta = type === "UP" ? -1 : 1
      } else {
        await prisma.vote.update({ where: { id: existingVote.id }, data: { type } })
        scoreDelta = type === "UP" ? 2 : -2
      }
    } else {
      await prisma.vote.create({ data: { userId: session.user.id, postId, type } })
      scoreDelta = type === "UP" ? 1 : -1
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: { score: { increment: scoreDelta } },
      select: { score: true },
    })

    const finalVote = existingVote?.type === type ? null : type
    return NextResponse.json({ score: updated.score, userVote: finalVote })
  } catch (error) {
    console.error("Vote API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
