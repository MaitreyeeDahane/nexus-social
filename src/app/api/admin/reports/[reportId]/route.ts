import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { reportId } = await params
    const { status } = await req.json()

    const report = await prisma.report.update({
      where: { id: reportId },
      data: { status, resolvedAt: new Date(), resolvedById: session.user.id },
    })

    return NextResponse.json({ report })
  } catch (error) {
    console.error("Report update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
