import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import { loginSchema } from "@/lib/validations/auth"
import bcrypt from "bcryptjs"
import type { UserRole } from "@prisma/client"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials)
        if (!validated.success) return null
        const { email, password } = validated.data
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, image: true, isBanned: true, passwordHash: true },
        })
        if (!user || user.isBanned || !user.passwordHash) return null
        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null
        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false
      if (account?.provider !== "credentials") {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { username: true, isBanned: true } })
        if (dbUser?.isBanned) return false
        if (!dbUser?.username) {
          const base = user.email.split("@")[0].replace(/[^a-z0-9]/gi, "_").toLowerCase().slice(0, 15)
          let username = base, i = 1
          while (await prisma.user.findUnique({ where: { username } })) username = `${base}${i++}`
          await prisma.user.update({ where: { email: user.email }, data: { username } })
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session: sessionUpdate }) {
      if (user?.id) {
        token.id = user.id
        const db = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, username: true, karma: true, isBanned: true },
        })
        if (db) { token.role = db.role; token.username = db.username ?? ""; token.karma = db.karma; token.isBanned = db.isBanned }
      }
      if (trigger === "update" && sessionUpdate) {
        if (sessionUpdate.username) token.username = sessionUpdate.username
        if (sessionUpdate.karma !== undefined) token.karma = sessionUpdate.karma
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.username = token.username as string
        session.user.karma = token.karma as number
        session.user.isBanned = token.isBanned as boolean
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return
      const u = await prisma.user.findUnique({ where: { id: user.id }, select: { username: true, email: true } })
      if (!u?.username && u?.email) {
        const base = u.email.split("@")[0].replace(/[^a-z0-9]/gi, "_").toLowerCase().slice(0, 15)
        let username = base, i = 1
        while (await prisma.user.findUnique({ where: { username } })) username = `${base}${i++}`
        await prisma.user.update({ where: { id: user.id }, data: { username } })
      }
    },
  },
})
