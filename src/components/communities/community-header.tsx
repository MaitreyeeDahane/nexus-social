"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, Settings, Bell, Share2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { joinCommunity } from "@/lib/actions/communities"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { Session } from "next-auth"
import { formatNumber, getCommunityColor, cn } from "@/lib/utils"

interface CommunityHeaderProps {
  community: {
    id: string
    name: string
    slug: string
    description?: string | null
    avatar?: string | null
    banner?: string | null
    isNSFW: boolean
    memberCount: number
    createdAt: Date
    _count: { members: number; posts: number }
  }
  isMember: boolean
  isMod: boolean
  session: Session | null
}

export function CommunityHeader({ community, isMember: initialIsMember, isMod, session }: CommunityHeaderProps) {
  const router = useRouter()
  const [isMember, setIsMember] = useState(initialIsMember)
  const [memberCount, setMemberCount] = useState(community.memberCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleJoin = async () => {
    if (!session) {
      toast.error("Sign in to join communities", {
        action: { label: "Sign In", onClick: () => router.push("/login") },
      })
      return
    }
    setIsLoading(true)
    const prevMember = isMember
    setIsMember(!isMember)
    setMemberCount(c => isMember ? c - 1 : c + 1)

    const result = await joinCommunity(community.id)
    setIsLoading(false)

    if (!result.success) {
      setIsMember(prevMember)
      setMemberCount(c => isMember ? c + 1 : c - 1)
      toast.error(result.error)
    } else {
      toast.success(result.data.joined ? `Joined r/${community.name}` : `Left r/${community.name}`)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success("Link copied!")
  }

  return (
    <div>
      {/* Banner */}
      <div className="h-32 md:h-44 relative overflow-hidden">
        {community.banner ? (
          <img src={community.banner} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getCommunityColor(community.name)} opacity-80`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
      </div>

      {/* Community info bar */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end gap-4 -mt-8 pb-4 md:-mt-10">
            {/* Avatar */}
            <div className="shrink-0 relative z-10">
              {community.avatar ? (
                <img
                  src={community.avatar}
                  alt={community.name}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover ring-4 ring-background"
                />
              ) : (
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${getCommunityColor(community.name)} ring-4 ring-background flex items-center justify-center text-white text-2xl font-bold`}>
                  {community.name[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">r/{community.name}</h1>
                {community.isNSFW && <Badge variant="destructive" className="text-[10px]">NSFW</Badge>}
                {isMod && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Shield className="w-3 h-3" />MOD
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {formatNumber(memberCount)} members
                </span>
                <span>{community._count.posts} posts</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 pb-1">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleShare} title="Share">
                <Share2 className="w-4 h-4" />
              </Button>
              {isMod && (
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                  <Link href={`/r/${community.slug}/settings`}>
                    <Settings className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mod Tools</span>
                  </Link>
                </Button>
              )}
              <Button
                size="sm"
                variant={isMember ? "outline" : "default"}
                onClick={handleJoin}
                disabled={isLoading}
                className={cn("min-w-[80px]", isMember && "hover:border-destructive hover:text-destructive")}
              >
                {isMember ? "Joined" : "Join"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
