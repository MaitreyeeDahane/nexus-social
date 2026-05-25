import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { reportSchema } from "@/lib/validations"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const ip = getClientIp(req)
    const rateCheck = checkRateLimit(ip, "default")
    if (!rateCheck.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

    const body = await req.json()
    const validated = reportSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.errors[0].message }, { status: 400 })
    }

    const { type, reason, description, targetId } = validated.data

    const reportData: {
      type: "POST" | "COMMENT" | "USER" | "COMMUNITY"
      reason: string
      description?: string
      reporterId: string
      postId?: string
      commentId?: string
      reportedUserId?: string
      communityId?: string
    } = {
      type,
      reason,
      description,
      reporterId: session.user.id,
    }

    if (type === "POST") reportData.postId = targetId
    else if (type === "COMMENT") reportData.commentId = targetId
    else if (type === "USER") reportData.reportedUserId = targetId
    else if (type === "COMMUNITY") reportData.communityId = targetId

    const report = await prisma.report.create({ data: reportData })
    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error("Report API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
