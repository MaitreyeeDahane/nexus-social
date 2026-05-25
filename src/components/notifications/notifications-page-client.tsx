"use client"

import Link from "next/link"
import { Bell, CheckCheck, MessageSquare, ArrowUp, Users, Trophy, AtSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { cn, formatRelativeTime, getInitials } from "@/lib/utils"
import type { NotificationData } from "@/types"

const notifIcons: Record<string, React.ReactNode> = {
  COMMENT: <MessageSquare className="w-4 h-4 text-blue-500" />,
  REPLY: <MessageSquare className="w-4 h-4 text-purple-500" />,
  VOTE: <ArrowUp className="w-4 h-4 text-orange-500" />,
  FOLLOW: <Users className="w-4 h-4 text-green-500" />,
  MENTION: <AtSign className="w-4 h-4 text-nexus-500" />,
  ACHIEVEMENT: <Trophy className="w-4 h-4 text-yellow-500" />,
}

interface NotificationsResponse {
  notifications: NotificationData[]
  unreadCount: number
  hasMore: boolean
}

export function NotificationsPageClient() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery<NotificationsResponse>({
    queryKey: ["notifications-page"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=50")
      if (!res.ok) throw new Error("Failed to fetch notifications")
      return res.json()
    },
    staleTime: 30 * 1000,
  })

  const markAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      })
      if (!res.ok) throw new Error("Failed to mark all as read")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-page"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const markOneMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-page"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="nexus-card flex gap-3">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="nexus-card text-center py-12 text-muted-foreground text-sm">
        Failed to load notifications. Please refresh.
      </div>
    )
  }

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{unreadCount} unread</span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="nexus-card text-center py-16">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="font-semibold mb-2">All caught up!</h2>
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notif) => {
            const href = notif.postId
              ? "#"
              : notif.sender
              ? `/u/${notif.sender.username}`
              : "#"

            return (
              <Link
                key={notif.id}
                href={href}
                onClick={() => {
                  if (!notif.isRead) markOneMutation.mutate(notif.id)
                }}
                className={cn(
                  "nexus-card flex items-start gap-3 hover:border-primary/30 transition-all cursor-pointer",
                  !notif.isRead && "bg-primary/5 border-primary/20"
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={notif.sender?.image || ""} />
                    <AvatarFallback className="text-sm">
                      {getInitials(notif.sender?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-background flex items-center justify-center border border-border">
                    {notifIcons[notif.type] ?? (
                      <Bell className="w-3 h-3 text-muted-foreground" />
                    )}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeTime(notif.createdAt)}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
