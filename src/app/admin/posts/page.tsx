import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { formatRelativeTime } from "@/lib/utils"
import { ExternalLink, Pin, Lock, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin – Posts" }

interface PageProps { searchParams: Promise<{ q?: string }> }

export default async function AdminPostsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") redirect("/")

  const { q } = await searchParams

  const posts = await prisma.post.findMany({
    where: {
      isDeleted: false,
      ...(q && { title: { contains: q, mode: "insensitive" } }),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { username: true } },
      community: { select: { name: true, slug: true } },
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Posts</h1>
        <p className="text-muted-foreground text-sm">{posts.length} posts shown</p>
      </div>
      <div className="nexus-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {["Title", "Author", "Community", "Score", "Comments", "Created", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map(p => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 max-w-[300px]">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <div className="flex gap-1 mt-0.5">
                      {p.isPinned && <span className="text-[10px] bg-green-500/10 text-green-600 px-1 rounded">Pinned</span>}
                      {p.isLocked && <span className="text-[10px] bg-amber-500/10 text-amber-600 px-1 rounded">Locked</span>}
                      {p.isNSFW && <span className="text-[10px] bg-red-500/10 text-red-500 px-1 rounded">NSFW</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">u/{p.author.username}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">r/{p.community.name}</td>
                  <td className="px-4 py-3 font-medium">{p.score}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.commentCount}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatRelativeTime(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" asChild>
                      <Link href={`/r/${p.community.slug}/comments/${p.id}`}>
                        <ExternalLink className="w-3 h-3" />View
                      </Link>
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
