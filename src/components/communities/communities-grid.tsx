"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Users, FileText, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatNumber, getCommunityColor } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { useEffect } from "react"
import { motion } from "framer-motion"

interface Community {
  id: string
  name: string
  slug: string
  description?: string | null
  avatar?: string | null
  memberCount: number
  postCount: number
  isNSFW: boolean
}

interface CommunitiesGridProps {
  communities: Community[]
  initialQuery?: string
}

export function CommunitiesGrid({ communities, initialQuery }: CommunitiesGridProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialQuery || "")
  const debouncedSearch = useDebounce(search, 400)

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("q", debouncedSearch)
    router.replace(`/communities?${params.toString()}`)
  }, [debouncedSearch, router])

  return (
    <div className="space-y-6">
      {/* Search + Sort */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button asChild>
          <Link href="/r/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Community
          </Link>
        </Button>
      </div>

      {/* Grid */}
      {communities.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No communities found</p>
          <p className="text-sm mt-1">Try a different search or create your own!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map((community, i) => (
            <motion.div key={community.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link
                href={`/r/${community.slug}`}
                className="nexus-card block group hover:border-primary/30 hover:shadow-nexus transition-all h-full"
              >
                {/* Banner gradient */}
                <div className={`h-16 -mx-4 -mt-4 mb-4 rounded-t-xl bg-gradient-to-br ${getCommunityColor(community.name)} opacity-70`} />

                <div className="flex items-start gap-3">
                  {community.avatar ? (
                    <img src={community.avatar} alt={community.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-background -mt-8 shrink-0" />
                  ) : (
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getCommunityColor(community.name)} ring-2 ring-background -mt-8 flex items-center justify-center text-white text-lg font-bold shrink-0`}>
                      {community.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">r/{community.name}</h3>
                      {community.isNSFW && <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded font-medium shrink-0">NSFW</span>}
                    </div>
                  </div>
                </div>

                {community.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">{community.description}</p>
                )}

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {formatNumber(community.memberCount)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {formatNumber(community.postCount)}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
