import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { registerSchema } from "@/lib/validations"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rateCheck = checkRateLimit(ip, "auth")
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
    }

    const body = await req.json()
    const validated = registerSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.errors[0].message }, { status: 400 })
    }

    const { name, email, username, password } = validated.data

    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { username } }),
    ])
    if (existingEmail) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    if (existingUsername) return NextResponse.json({ error: "This username is already taken" }, { status: 409 })

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, username, passwordHash },
      select: { id: true, email: true, username: true },
    })

    return NextResponse.json({ user, message: "Account created successfully" }, { status: 201 })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
