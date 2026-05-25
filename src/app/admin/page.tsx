import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin Dashboard" }

export default async function AdminPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") redirect("/")

  const [userCount, communityCount, postCount, reportCount, recentReports] = await Promise.all([
    prisma.user.count(),
    prisma.community.count(),
    prisma.post.count({ where: { isDeleted: false } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.report.findMany({
      where: { status: "PENDING" },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { username: true, name: true } },
        post: { select: { id: true, title: true, community: { select: { slug: true } } } },
      },
    }),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform overview and moderation tools</p>
      </div>
      <AdminDashboard
        stats={{ userCount, communityCount, postCount, reportCount }}
        recentReports={recentReports}
      />
    </div>
  )
}
