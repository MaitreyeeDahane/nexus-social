import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { updateProfileSchema } from "@/lib/validations"

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const validated = updateProfileSchema.safeParse(body)
    if (!validated.success) return NextResponse.json({ error: validated.error.errors[0].message }, { status: 400 })

    const { name, username, bio, website, location } = validated.data

    // Check username uniqueness if changed
    if (username) {
      const existing = await prisma.user.findFirst({
        where: { username, NOT: { id: session.user.id } },
      })
      if (existing) return NextResponse.json({ error: "Username already taken" }, { status: 409 })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(username && { username }),
        ...(bio !== undefined && { bio }),
        ...(website !== undefined && { website: website || null }),
        ...(location !== undefined && { location }),
      },
      select: { id: true, name: true, username: true, bio: true, website: true, location: true },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
