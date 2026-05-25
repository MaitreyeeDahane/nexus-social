import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { AdminReportsClient } from "@/components/admin/admin-reports-client"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin – Reports" }

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") redirect("/")

  const { status = "PENDING", page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page))
  const limit = 20

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where: { status: status as "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED" },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (pageNum - 1) * limit,
      include: {
        reporter: { select: { id: true, username: true, name: true, image: true } },
        post: { select: { id: true, title: true, community: { select: { slug: true } } } },
        comment: { select: { id: true, content: true, post: { select: { id: true, community: { select: { slug: true } } } } } },
        reportedUser: { select: { id: true, username: true, name: true } },
      },
    }),
    prisma.report.count({ where: { status: status as "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED" } }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm">{total} {status.toLowerCase()} reports</p>
      </div>
      <AdminReportsClient reports={reports as any} total={total} page={pageNum} limit={limit} status={status} />
    </div>
  )
}
