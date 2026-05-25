"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatRelativeTime, getInitials } from "@/lib/utils"
import { toast } from "sonner"

interface Report {
  id: string
  type: string
  reason: string
  description?: string | null
  status: string
  createdAt: Date
  reporter: { id: string; username?: string | null; name?: string | null; image?: string | null }
  post?: { id: string; title: string; community: { slug: string } } | null
  comment?: { id: string; content: string; post?: { id: string; community: { slug: string } } | null } | null
  reportedUser?: { id: string; username?: string | null; name?: string | null } | null
}

interface AdminReportsClientProps {
  reports: Report[]
  total: number
  page: number
  limit: number
  status: string
}

export function AdminReportsClient({ reports, total, page, limit, status }: AdminReportsClientProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleAction = async (reportId: string, newStatus: "RESOLVED" | "DISMISSED") => {
    setLoadingId(reportId)
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    setLoadingId(null)
    if (res.ok) {
      toast.success(`Report ${newStatus.toLowerCase()}`)
      router.refresh()
    } else toast.error("Action failed")
  }

  const totalPages = Math.ceil(total / limit)
  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-500",
    REVIEWING: "bg-blue-500/10 text-blue-500",
    RESOLVED: "bg-green-500/10 text-green-500",
    DISMISSED: "bg-muted text-muted-foreground",
  }

  return (
    <div className="space-y-4">
      <Tabs value={status} onValueChange={s => router.push(`/admin/reports?status=${s}`)}>
        <TabsList>
          {["PENDING", "REVIEWING", "RESOLVED", "DISMISSED"].map(s => (
            <TabsTrigger key={s} value={s} className="text-xs capitalize">{s.toLowerCase()}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {reports.length === 0 ? (
        <div className="nexus-card text-center py-12">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500 opacity-50" />
          <p className="text-muted-foreground text-sm">No {status.toLowerCase()} reports</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="nexus-card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={r.reporter.image || ""} />
                    <AvatarFallback className="text-xs">{getInitials(r.reporter.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Reported by <span className="font-medium text-foreground">u/{r.reporter.username}</span> · {formatRelativeTime(r.createdAt)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColors[r.status] || ""}`}>{r.status}</span>
                    </div>
                  </div>
                </div>
                {status === "PENDING" && (
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm" variant="outline"
                      className="h-7 px-2 text-xs gap-1 text-green-600 border-green-600/30 hover:bg-green-500/10"
                      onClick={() => handleAction(r.id, "RESOLVED")}
                      disabled={loadingId === r.id}
                    >
                      <CheckCircle className="w-3 h-3" />Resolve
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className="h-7 px-2 text-xs gap-1 text-muted-foreground"
                      onClick={() => handleAction(r.id, "DISMISSED")}
                      disabled={loadingId === r.id}
                    >
                      <XCircle className="w-3 h-3" />Dismiss
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium">Reason: {r.reason}</p>
                {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
              </div>

              {r.post && (
                <Link href={`/r/${r.post.community.slug}/comments/${r.post.id}`} className="flex items-center gap-2 text-xs text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" />
                  Post: {r.post.title}
                </Link>
              )}
              {r.reportedUser && (
                <Link href={`/u/${r.reportedUser.username}`} className="flex items-center gap-2 text-xs text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" />
                  User: u/{r.reportedUser.username}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1}
              onClick={() => router.push(`/admin/reports?status=${status}&page=${page - 1}`)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages}
              onClick={() => router.push(`/admin/reports?status=${status}&page=${page + 1}`)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
