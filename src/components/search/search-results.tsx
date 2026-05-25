"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Users, FileText, MessageSquare, Hash, Loader2, ArrowUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/posts/post-card"
import { PostCardSkeleton } from "@/components/posts/post-card-skeleton"
import { useQuery } from "@tanstack/react-query"
import { formatNumber, formatScore, getInitials, getCommunityColor, formatRelativeTime } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import type { PostListItem, CommentData, CommunityData, UserProfile } from "@/types"

interface SearchResultsProps {
  query: string
  type: string
  sort: string
}

interface SearchData {
  posts?: PostListItem[]
  communities?: Pick<CommunityData, "id" | "name" | "slug" | "avatar" | "description" | "memberCount" | "isNSFW">[]
  users?: Pick<UserProfile, "id" | "name" | "username" | "image" | "karma" | "isVerified" | "bio">[]
  comments?: (CommentData & {
    post?: { id: string; title: string; community?: { slug: string; name: string } | null } | null
  })[]
}

export function SearchResults({ query: initialQuery, type: initialType, sort: initialSort }: SearchResultsProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [activeType, setActiveType] = useState(initialType)
  const debouncedQuery = useDebounce(searchQuery, 400)

  useEffect(() => {
    if (debouncedQuery !== initialQuery || activeType !== initialType) {
      const params = new URLSearchParams({ q: debouncedQuery, type: activeType })
      router.replace(`/search?${params}`)
    }
  }, [debouncedQuery, activeType, router, initialQuery, initialType])

  const { data, isLoading, isError } = useQuery<{ results: SearchData; query: string }>({
    queryKey: ["search", debouncedQuery, activeType],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 1) return { results: {}, query: debouncedQuery }
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(debouncedQuery)}&type=${activeType}&limit=20`
      )
      if (!res.ok) throw new Error("Search failed")
      return res.json()
    },
    enabled: debouncedQuery.length >= 1,
    staleTime: 30 * 1000,
  })

  const results = data?.results ?? {}

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Nexus..."
          className="pl-12 h-12 text-base"
          autoFocus
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {!debouncedQuery ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Search for anything</p>
          <p className="text-sm mt-1">Find communities, posts, users, and comments</p>
        </div>
      ) : (
        <Tabs value={activeType} onValueChange={setActiveType}>
          <TabsList>
            <TabsTrigger value="posts" className="gap-1.5">
              <FileText className="w-3.5 h-3.5" />Posts
            </TabsTrigger>
            <TabsTrigger value="communities" className="gap-1.5">
              <Hash className="w-3.5 h-3.5" />Communities
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="w-3.5 h-3.5" />Users
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4 space-y-3">
            {isLoading ? (
              <>{Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)}</>
            ) : isError ? (
              <EmptyState query={debouncedQuery} type="posts" error />
            ) : results.posts?.length ? (
              results.posts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <EmptyState query={debouncedQuery} type="posts" />
            )}
          </TabsContent>

          <TabsContent value="communities" className="mt-4 space-y-3">
            {isLoading ? (
              <LoadingState />
            ) : results.communities?.length ? (
              results.communities.map((c) => (
                <Link
                  key={c.id}
                  href={`/r/${c.slug}`}
                  className="nexus-card flex items-center gap-4 hover:border-primary/30 transition-all"
                >
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${getCommunityColor(c.name)} flex items-center justify-center text-white text-lg font-bold shrink-0`}
                  >
                    {c.avatar ? (
                      <img src={c.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      c.name[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">r/{c.name}</p>
                    {c.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{c.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatNumber(c.memberCount)} members
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0">View</Button>
                </Link>
              ))
            ) : (
              <EmptyState query={debouncedQuery} type="communities" />
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-4 space-y-3">
            {isLoading ? (
              <LoadingState />
            ) : results.users?.length ? (
              results.users.map((u) => (
                <Link
                  key={u.id}
                  href={`/u/${u.username}`}
                  className="nexus-card flex items-center gap-4 hover:border-primary/30 transition-all"
                >
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarImage src={u.image || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-nexus-500 to-purple-600 text-white font-bold">
                      {getInitials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-sm text-muted-foreground">u/{u.username}</p>
                    {u.bio && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{u.bio}</p>}
                    <p className="text-xs text-muted-foreground">{formatNumber(u.karma)} karma</p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0">Profile</Button>
                </Link>
              ))
            ) : (
              <EmptyState query={debouncedQuery} type="users" />
            )}
          </TabsContent>

          <TabsContent value="comments" className="mt-4 space-y-3">
            {isLoading ? (
              <LoadingState />
            ) : results.comments?.length ? (
              results.comments.map((c) => (
                <Link
                  key={c.id}
                  href={
                    c.post?.community?.slug
                      ? `/r/${c.post.community.slug}/comments/${c.post?.id}`
                      : "#"
                  }
                  className="nexus-card block hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={c.author?.image || ""} />
                      <AvatarFallback className="text-[8px]">{getInitials(c.author?.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">u/{c.author?.username}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ArrowUp className="w-3 h-3" />{formatScore(c.score)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(c.createdAt)}
                    </span>
                    {c.post && (
                      <>
                        <span className="text-xs text-muted-foreground">on</span>
                        <span className="text-xs text-primary line-clamp-1">{c.post.title}</span>
                      </>
                    )}
                  </div>
                  <p
                    className="text-sm text-muted-foreground line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: c.content }}
                  />
                </Link>
              ))
            ) : (
              <EmptyState query={debouncedQuery} type="comments" />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function EmptyState({ query, type, error }: { query: string; type: string; error?: boolean }) {
  if (error) {
    return (
      <div className="nexus-card text-center py-12 text-muted-foreground text-sm">
        Search failed. Please try again.
      </div>
    )
  }
  return (
    <div className="nexus-card text-center py-12">
      <p className="text-sm text-muted-foreground">
        No {type} found for{" "}
        <strong className="text-foreground">&ldquo;{query}&rdquo;</strong>
      </p>
    </div>
  )
}
