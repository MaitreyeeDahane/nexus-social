"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Shield, Ban, CheckCircle, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime, formatNumber, getInitials } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { useEffect } from "react"
import { toast } from "sonner"

interface User {
  id: string
  name?: string | null
  username?: string | null
  email: string
  image?: string | null
  role: string
  karma: number
  isBanned: boolean
  isVerified: boolean
  createdAt: Date
  _count: { posts: number; comments: number }
}

interface AdminUsersClientProps {
  users: User[]
  total: number
  page: number
  limit: number
  query?: string
}

export function AdminUsersClient({ users, total, page, limit, query }: AdminUsersClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState(query || "")
  const debouncedSearch = useDebounce(search, 400)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("q", debouncedSearch)
    params.set("page", "1")
    router.replace(`/admin/users?${params}`)
  }, [debouncedSearch, router])

  const handleBanToggle = async (userId: string, isBanned: boolean) => {
    setLoadingId(userId)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned: !isBanned }),
    })
    setLoadingId(null)
    if (res.ok) {
      toast.success(isBanned ? "User unbanned" : "User banned")
      router.refresh()
    } else toast.error("Action failed")
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by username, email, or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users table */}
      <div className="nexus-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {["User", "Email", "Role", "Karma", "Posts", "Joined", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(user => (
                <tr key={user.id} className={`hover:bg-muted/30 transition-colors ${user.isBanned ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/u/${user.username}`} className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1">
                          {user.name}
                          {user.isVerified && <BadgeCheck className="w-3 h-3 text-primary" />}
                        </Link>
                        <p className="text-xs text-muted-foreground">u/{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? "default" : "secondary"} className="text-[10px]">
                      {user.role}
                    </Badge>
                    {user.isBanned && <Badge variant="destructive" className="text-[10px] ml-1">BANNED</Badge>}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatNumber(user.karma)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user._count.posts}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatRelativeTime(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-7 px-2 text-xs gap-1 ${user.isBanned ? "text-green-600 border-green-600/30 hover:bg-green-500/10" : "text-red-600 border-red-600/30 hover:bg-red-500/10"}`}
                      onClick={() => handleBanToggle(user.id, user.isBanned)}
                      disabled={loadingId === user.id}
                    >
                      {user.isBanned ? <><CheckCircle className="w-3 h-3" />Unban</> : <><Ban className="w-3 h-3" />Ban</>}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm" disabled={page <= 1}
              onClick={() => { const p = new URLSearchParams({ page: String(page - 1) }); if (search) p.set("q", search); router.push(`/admin/users?${p}`) }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline" size="sm" disabled={page >= totalPages}
              onClick={() => { const p = new URLSearchParams({ page: String(page + 1) }); if (search) p.set("q", search); router.push(`/admin/users?${p}`) }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
