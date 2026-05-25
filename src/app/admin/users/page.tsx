import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { AdminUsersClient } from "@/components/admin/admin-users-client"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin – Users" }

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") redirect("/")

  const { q, page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page))
  const limit = 25

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: q ? {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      } : undefined,
      select: {
        id: true, name: true, username: true, email: true, image: true,
        role: true, karma: true, isBanned: true, isVerified: true,
        createdAt: true, _count: { select: { posts: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (pageNum - 1) * limit,
    }),
    prisma.user.count({
      where: q ? {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      } : undefined,
    }),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground text-sm">{total} total users</p>
      </div>
      <AdminUsersClient users={users} total={total} page={pageNum} limit={limit} query={q} />
    </div>
  )
}
