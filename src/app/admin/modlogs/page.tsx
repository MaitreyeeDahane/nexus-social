import { formatRelativeTime, getInitials } from "@/lib/utils"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin – Moderation Logs" }

export default async function AdminModLogsPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") redirect("/")

  const logs = await prisma.moderationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      moderator: { select: { id: true, name: true, username: true, image: true } },
    },
  })

  const actionColors: Record<string, string> = {
    BAN_USER: "bg-red-500/10 text-red-500",
    UNBAN_USER: "bg-green-500/10 text-green-600",
    REMOVE_POST: "bg-amber-500/10 text-amber-600",
    REMOVE_COMMENT: "bg-amber-500/10 text-amber-600",
    LOCK_POST: "bg-blue-500/10 text-blue-500",
    PIN_POST: "bg-purple-500/10 text-purple-500",
    APPROVE_POST: "bg-green-500/10 text-green-600",
    WARN_USER: "bg-orange-500/10 text-orange-500",
    MUTE_USER: "bg-slate-500/10 text-slate-500",
    FLAIR_POST: "bg-indigo-500/10 text-indigo-500",
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Moderation Logs</h1>
        <p className="text-muted-foreground text-sm">{logs.length} recent actions</p>
      </div>

      {logs.length === 0 ? (
        <div className="nexus-card text-center py-12 text-muted-foreground text-sm">No moderation actions yet.</div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="nexus-card flex items-start gap-3">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={log.moderator.image || ""} />
                <AvatarFallback className="text-xs">{getInitials(log.moderator.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-medium">u/{log.moderator.username}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${actionColors[log.action] || "bg-muted text-muted-foreground"}`}>
                    {log.action.replace(/_/g, " ")}
                  </span>
                </div>
                {log.reason && <p className="text-xs text-muted-foreground">{log.reason}</p>}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(log.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
