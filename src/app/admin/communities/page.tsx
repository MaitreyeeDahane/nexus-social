import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { formatNumber, formatRelativeTime } from "@/lib/utils"
import { Users, FileText, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin – Communities" }

export default async function AdminCommunitiesPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") redirect("/")

  const communities = await prisma.community.findMany({
    orderBy: { memberCount: "desc" },
    take: 100,
    select: {
      id: true, name: true, slug: true, avatar: true,
      memberCount: true, postCount: true, isNSFW: true,
      isPrivate: true, createdAt: true, deletedAt: true,
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communities</h1>
          <p className="text-muted-foreground text-sm">{communities.length} communities</p>
        </div>
      </div>
      <div className="nexus-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {["Community", "Members", "Posts", "Created", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {communities.map(c => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nexus-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {c.avatar
                          ? <img src={c.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          : c.name[0].toUpperCase()
                        }
                      </div>
                      <div>
                        <p className="font-medium">r/{c.name}</p>
                        <div className="flex gap-1 mt-0.5">
                          {c.isNSFW && <span className="text-[10px] px-1 py-0.5 bg-red-500/10 text-red-500 rounded">NSFW</span>}
                          {c.isPrivate && <span className="text-[10px] px-1 py-0.5 bg-muted text-muted-foreground rounded">Private</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatNumber(c.memberCount)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatNumber(c.postCount)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatRelativeTime(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.deletedAt ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"}`}>
                      {c.deletedAt ? "Deleted" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" asChild>
                      <Link href={`/r/${c.slug}`}><ExternalLink className="w-3 h-3" />View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
