"use client"

import Link from "next/link"
import { Users, Hash, FileText, AlertTriangle, TrendingUp, Shield, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatNumber, formatRelativeTime } from "@/lib/utils"
import { toast } from "sonner"

interface AdminDashboardProps {
  stats: { userCount: number; communityCount: number; postCount: number; reportCount: number }
  recentReports: Array<{
    id: string
    type: string
    reason: string
    status: string
    createdAt: Date
    reporter: { username?: string | null; name?: string | null }
    post?: { id: string; title: string; community: { slug: string } } | null
  }>
}

const STAT_CARDS = [
  { key: "userCount", label: "Total Users", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "communityCount", label: "Communities", icon: Hash, color: "text-purple-500", bg: "bg-purple-500/10" },
  { key: "postCount", label: "Total Posts", icon: FileText, color: "text-green-500", bg: "bg-green-500/10" },
  { key: "reportCount", label: "Pending Reports", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
]

export function AdminDashboard({ stats, recentReports }: AdminDashboardProps) {
  const handleReport = async (reportId: string, action: "resolve" | "dismiss") => {
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action === "resolve" ? "RESOLVED" : "DISMISSED" }),
    })
    if (res.ok) {
      toast.success(`Report ${action}d`)
    } else {
      toast.error("Action failed")
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className="nexus-card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(stats[key as keyof typeof stats])}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="nexus-card">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/users">Manage Users</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/communities">Manage Communities</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/reports">All Reports</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/modlogs">Moderation Logs</Link>
          </Button>
        </div>
      </div>

      {/* Pending reports */}
      <div className="nexus-card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Pending Reports
          {recentReports.length > 0 && (
            <Badge variant="destructive" className="text-[10px]">{recentReports.length}</Badge>
          )}
        </h2>
        {recentReports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">No pending reports. All clear!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentReports.map(report => (
              <div key={report.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className="text-[10px]">{report.type}</Badge>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(report.createdAt)}</span>
                  </div>
                  <p className="text-sm font-medium">{report.reason}</p>
                  {report.post && (
                    <Link href={`/r/${report.post.community.slug}/comments/${report.post.id}`} className="text-xs text-primary hover:underline line-clamp-1">
                      {report.post.title}
                    </Link>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Reported by u/{report.reporter.username || report.reporter.name}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1 text-green-600 border-green-600/30 hover:bg-green-500/10" onClick={() => handleReport(report.id, "resolve")}>
                    <CheckCircle className="w-3 h-3" />Resolve
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1 text-muted-foreground" onClick={() => handleReport(report.id, "dismiss")}>
                    <XCircle className="w-3 h-3" />Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
