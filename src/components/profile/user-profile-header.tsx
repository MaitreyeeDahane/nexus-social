"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MapPin, Globe, Calendar, Users, UserPlus, UserMinus, Settings, BadgeCheck, Shield, Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatNumber, getInitials, getUserColor } from "@/lib/utils"
import { toast } from "sonner"
import type { Session } from "next-auth"

interface UserProfileHeaderProps {
  user: {
    id: string
    name?: string | null
    username?: string | null
    bio?: string | null
    image?: string | null
    coverImage?: string | null
    karma: number
    website?: string | null
    location?: string | null
    isVerified: boolean
    role: string
    createdAt: Date
    achievements: Array<{ achievement: { name: string; icon: string } }>
    _count: { posts: number; comments: number; followers: number; following: number }
  }
  isOwnProfile: boolean
  isFollowing: boolean
  session: Session | null
}

export function UserProfileHeader({ user, isOwnProfile, isFollowing: initialIsFollowing, session }: UserProfileHeaderProps) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followerCount, setFollowerCount] = useState(user._count.followers)
  const [isLoading, setIsLoading] = useState(false)

  const handleFollow = async () => {
    if (!session) { router.push("/login"); return }
    setIsLoading(true)
    const prevFollowing = isFollowing
    setIsFollowing(!isFollowing)
    setFollowerCount(c => isFollowing ? c - 1 : c + 1)

    const res = await fetch(`/api/users/${user.username}/follow`, { method: "POST" })
    setIsLoading(false)

    if (!res.ok) {
      setIsFollowing(prevFollowing)
      setFollowerCount(c => isFollowing ? c + 1 : c - 1)
      toast.error("Failed to update follow status")
    } else {
      const data = await res.json()
      setIsFollowing(data.following)
      toast.success(data.following ? `Following u/${user.username}` : `Unfollowed u/${user.username}`)
    }
  }

  const roleBadge = user.role === "ADMIN" || user.role === "SUPER_ADMIN"
    ? { label: "Admin", icon: Shield, color: "bg-red-500/10 text-red-500" }
    : user.role === "MODERATOR"
    ? { label: "Mod", icon: Shield, color: "bg-blue-500/10 text-blue-500" }
    : null

  return (
    <div>
      {/* Cover image */}
      <div className="h-32 md:h-48 relative overflow-hidden bg-gradient-to-br from-nexus-500/20 to-purple-600/20">
        {user.coverImage ? (
          <img src={user.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getUserColor(user.username || "u")} opacity-30`} />
        )}
      </div>

      {/* Profile info */}
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-end gap-4 -mt-10 md:-mt-14 pb-4">
            <Avatar className="w-20 h-20 md:w-28 md:h-28 ring-4 ring-background shrink-0 relative z-10">
              <AvatarImage src={user.image || ""} />
              <AvatarFallback className={`text-2xl font-bold bg-gradient-to-br ${getUserColor(user.username || "u")} text-white`}>
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold">{user.name}</h1>
                {user.isVerified && <BadgeCheck className="w-5 h-5 text-primary shrink-0" />}
                {roleBadge && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge.color}`}>
                    <roleBadge.icon className="w-3 h-3" />
                    {roleBadge.label}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">u/{user.username}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0 pb-1">
              {isOwnProfile ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings/profile">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollow}
                  disabled={isLoading}
                  className="gap-1.5"
                >
                  {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              )}
            </div>
          </div>

          {/* Stats & bio */}
          <div className="pb-4 space-y-3">
            {user.bio && <p className="text-sm text-foreground leading-relaxed max-w-2xl">{user.bio}</p>}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {user.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{user.location}</span>
              )}
              {user.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:text-primary/80">
                  <Globe className="w-3 h-3" />{user.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined {formatDate(user.createdAt)}</span>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {[
                { label: "karma", value: user.karma, icon: Star },
                { label: "posts", value: user._count.posts },
                { label: "comments", value: user._count.comments },
                { label: "followers", value: followerCount },
                { label: "following", value: user._count.following },
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-foreground">{formatNumber(stat.value)}</span>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Achievement badges */}
            {user.achievements.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {user.achievements.map(({ achievement }) => (
                  <span key={achievement.name} title={achievement.name} className="text-base cursor-help" aria-label={achievement.name}>
                    {achievement.icon}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
