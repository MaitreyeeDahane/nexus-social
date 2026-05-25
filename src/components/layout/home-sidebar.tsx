import Link from "next/link"
import { prisma } from "@/lib/db"
import { formatNumber, getCommunityColor } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Flame, Plus, TrendingUp, Users, Zap, Shield } from "lucide-react"
import type { Session } from "next-auth"

interface HomeSidebarProps {
  session: Session | null
}

export async function HomeSidebar({ session }: HomeSidebarProps) {
  const [topCommunities, stats] = await Promise.all([
    prisma.community.findMany({
      orderBy: { memberCount: "desc" },
      take: 5,
      select: { id: true, name: true, slug: true, avatar: true, memberCount: true, description: true },
    }),
    prisma.$transaction([
      prisma.user.count(),
      prisma.community.count(),
      prisma.post.count({ where: { isDeleted: false } }),
    ]),
  ])

  const [userCount, communityCount, postCount] = stats

  return (
    <div className="space-y-4 sticky top-20">
      {/* Welcome card */}
      <div className="nexus-card overflow-hidden">
        <div className="h-20 bg-gradient-to-br from-nexus-500 via-purple-600 to-pink-600 -mx-4 -mt-4 mb-4 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <Flame className="w-10 h-10 text-white/80" />
          </div>
        </div>
        <h2 className="font-bold text-base mb-1">Welcome to Nexus</h2>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          The front page of your internet. Join communities and start sharing.
        </p>
        <div className="space-y-2">
          {session ? (
            <Button asChild className="w-full" size="sm">
              <Link href="/submit">
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild className="w-full" size="sm">
                <Link href="/register">Get Started</Link>
              </Button>
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
            </>
          )}
          <Button asChild variant="outline" className="w-full" size="sm">
            <Link href="/r/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Community
            </Link>
          </Button>
        </div>
      </div>

      {/* Platform stats */}
      <div className="nexus-card">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Nexus Stats
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{formatNumber(userCount)}</p>
            <p className="text-[10px] text-muted-foreground">Members</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{formatNumber(communityCount)}</p>
            <p className="text-[10px] text-muted-foreground">Communities</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{formatNumber(postCount)}</p>
            <p className="text-[10px] text-muted-foreground">Posts</p>
          </div>
        </div>
      </div>

      {/* Top Communities */}
      <div className="nexus-card">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Top Communities
        </h3>
        <div className="space-y-2">
          {topCommunities.map((community, i) => (
            <Link
              key={community.id}
              href={`/r/${community.slug}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors group"
            >
              <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
              {community.avatar ? (
                <img src={community.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getCommunityColor(community.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {community.name[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  r/{community.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatNumber(community.memberCount)} members
                </p>
              </div>
            </Link>
          ))}
        </div>
        <Separator className="my-3" />
        <Button asChild variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
          <Link href="/communities">View all communities</Link>
        </Button>
      </div>

      {/* Footer links */}
      <div className="text-xs text-muted-foreground space-y-1 px-1">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link href="/help" className="hover:text-foreground transition-colors">Help</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        </div>
        <p className="text-[10px]">Nexus Social © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
