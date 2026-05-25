import Link from "next/link"
import { Users, Calendar, Plus, Shield, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatDate, formatNumber } from "@/lib/utils"
import type { Session } from "next-auth"

interface CommunitySidebarProps {
  community: {
    id: string
    name: string
    slug: string
    description?: string | null
    longDescription?: string | null
    memberCount: number
    postCount: number
    createdAt: Date
    isNSFW: boolean
    rules: Array<{ id: string; title: string; description?: string | null; order: number }>
    moderators: Array<{
      user: { id: string; name?: string | null; username?: string | null; image?: string | null }
    }>
    _count: { members: number; posts: number }
  }
  isMember: boolean
  isMod: boolean
  session: Session | null
}

export function CommunitySidebar({ community, isMember, isMod, session }: CommunitySidebarProps) {
  return (
    <div className="space-y-4 sticky top-20">
      {/* About */}
      <div className="nexus-card">
        <h3 className="font-semibold text-sm mb-3">About r/{community.name}</h3>
        {community.description && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{community.description}</p>
        )}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span><strong className="text-foreground">{formatNumber(community.memberCount)}</strong> members</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <span><strong className="text-foreground">{formatNumber(community.postCount)}</strong> posts</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Created {formatDate(community.createdAt)}</span>
          </div>
        </div>

        {session && isMember && (
          <>
            <Separator className="my-4" />
            <Button asChild className="w-full" size="sm">
              <Link href={`/submit?community=${community.slug}`}>
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Link>
            </Button>
          </>
        )}
      </div>

      {/* Rules */}
      {community.rules.length > 0 && (
        <div className="nexus-card">
          <h3 className="font-semibold text-sm mb-3">Community Rules</h3>
          <ol className="space-y-3">
            {community.rules.map((rule, i) => (
              <li key={rule.id}>
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer list-none text-sm font-medium hover:text-primary transition-colors">
                    <span className="text-xs font-bold text-primary w-5 shrink-0">{i + 1}.</span>
                    {rule.title}
                  </summary>
                  {rule.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 ml-7 leading-relaxed">{rule.description}</p>
                  )}
                </details>
                {i < community.rules.length - 1 && <Separator className="mt-3" />}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Moderators */}
      {community.moderators.length > 0 && (
        <div className="nexus-card">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Moderators
          </h3>
          <div className="space-y-2">
            {community.moderators.slice(0, 5).map(({ user }) => (
              <Link
                key={user.id}
                href={`/u/${user.username}`}
                className="flex items-center gap-2.5 hover:text-primary transition-colors"
              >
                {user.image ? (
                  <img src={user.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-nexus-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {(user.name || "?")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs">u/{user.username || user.name}</span>
              </Link>
            ))}
          </div>
          {isMod && (
            <>
              <Separator className="my-3" />
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/r/${community.slug}/settings/moderators`}>Manage Moderators</Link>
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
