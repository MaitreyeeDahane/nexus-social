"use client"
import { cn, formatRelativeTime, getInitials } from "@/lib/utils"

import { useState, useEffect } from "react"
import { Bell, Check, CheckCheck, MessageSquare, ArrowUp, Users, Trophy, AtSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  message: string
  isRead: boolean
  createdAt: string
  postId?: string | null
  commentId?: string | null
  communityId?: string | null
  sender?: { id: string; name?: string | null; username?: string | null; image?: string | null } | null
}

const notifIcons: Record<string, React.ReactNode> = {
  COMMENT: <MessageSquare className="w-3.5 h-3.5 text-blue-500" />,
  REPLY: <MessageSquare className="w-3.5 h-3.5 text-purple-500" />,
  VOTE: <ArrowUp className="w-3.5 h-3.5 text-orange-500" />,
  FOLLOW: <Users className="w-3.5 h-3.5 text-green-500" />,
  MENTION: <AtSign className="w-3.5 h-3.5 text-nexus-500" />,
  ACHIEVEMENT: <Trophy className="w-3.5 h-3.5 text-yellow-500" />,
}

export function NotificationDropdown() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=15")
      if (!res.ok) return { notifications: [], unreadCount: 0 }
      return res.json()
    },
    refetchInterval: 30000,
  })

  const markReadMutation = useMutation({
    mutationFn: async (opts: { notificationId?: string; markAll?: boolean }) => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opts),
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const notifications: Notification[] = data?.notifications || []
  const unreadCount: number = data?.unreadCount || 0

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative w-9 h-9" aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => markReadMutation.mutate({ markAll: true })}
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map(notif => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onRead={() => markReadMutation.mutate({ notificationId: notif.id })}
                  onClose={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border p-2">
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" asChild>
              <Link href="/notifications" onClick={() => setOpen(false)}>
                View all notifications
              </Link>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationItem({
  notification,
  onRead,
  onClose,
}: {
  notification: Notification
  onRead: () => void
  onClose: () => void
}) {
  const href = notification.postId
    ? `/r/post/comments/${notification.postId}`
    : notification.communityId
    ? `/r/${notification.communityId}`
    : notification.sender
    ? `/u/${notification.sender.username}`
    : "#"

  const handleClick = () => {
    if (!notification.isRead) onRead()
    onClose()
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors",
        !notification.isRead && "bg-primary/5"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="w-8 h-8">
          <AvatarImage src={notification.sender?.image || ""} />
          <AvatarFallback className="text-xs">{getInitials(notification.sender?.name)}</AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background flex items-center justify-center border border-border">
          {notifIcons[notification.type] || <Bell className="w-3 h-3 text-muted-foreground" />}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-relaxed text-foreground line-clamp-2">{notification.message}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelativeTime(notification.createdAt)}</p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </Link>
  )
}
