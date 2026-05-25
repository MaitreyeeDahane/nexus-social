"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/posts/post-card"
import { PostCardSkeleton } from "@/components/posts/post-card-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { formatRelativeTime, formatScore } from "@/lib/utils"
import { MessageSquare, ArrowUp, FileText, Bookmark } from "lucide-react"
import type { PostListItem, CommentData } from "@/types"

interface UserProfileContentProps {
  userId: string
  username: string
  isOwnProfile: boolean
}

export function UserProfileContent({ userId, username, isOwnProfile }: UserProfileContentProps) {
  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="posts" className="gap-1.5">
          <FileText className="w-3.5 h-3.5" />Posts
        </TabsTrigger>
        <TabsTrigger value="comments" className="gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />Comments
        </TabsTrigger>
        {isOwnProfile && (
          <TabsTrigger value="saved" className="gap-1.5">
            <Bookmark className="w-3.5 h-3.5" />Saved
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="posts">
        <UserPosts userId={userId} />
      </TabsContent>
      <TabsContent value="comments">
        <UserComments userId={userId} />
      </TabsContent>
      {isOwnProfile && (
        <TabsContent value="saved">
          <UserSavedPosts />
        </TabsContent>
      )}
    </Tabs>
  )
}

function UserPosts({ userId }: { userId: string }) {
  const { data, isLoading, isError } = useQuery<{ posts: PostListItem[] }>({
    queryKey: ["user-posts", userId],
    queryFn: async () => {
      const res = await fetch(`/api/posts?userId=${userId}&sort=new&limit=20`)
      if (!res.ok) throw new Error("Failed to fetch posts")
      return res.json()
    },
    staleTime: 30 * 1000,
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)}
      </div>
    )
  }
  if (isError) {
    return (
      <div className="nexus-card text-center py-12 text-muted-foreground text-sm">
        Failed to load posts. Please refresh.
      </div>
    )
  }

  const posts = data?.posts ?? []
  if (posts.length === 0) {
    return (
      <div className="nexus-card text-center py-12">
        <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
        <p className="font-semibold text-sm">No posts yet</p>
        <p className="text-xs text-muted-foreground mt-1">Posts will appear here once created.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} showCommunity={true} />
      ))}
    </div>
  )
}

interface CommentWithPost extends CommentData {
  post?: {
    id: string
    title: string
    community?: { slug: string; name: string } | null
  } | null
}

function UserComments({ userId }: { userId: string }) {
  const { data, isLoading, isError } = useQuery<{ comments: CommentWithPost[] }>({
    queryKey: ["user-comments", userId],
    queryFn: async () => {
      const res = await fetch(`/api/comments?userId=${userId}&limit=20`)
      if (!res.ok) throw new Error("Failed to fetch comments")
      return res.json()
    },
    staleTime: 30 * 1000,
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="nexus-card space-y-2">
            <Skeleton className="h-3 w-1/3 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
        ))}
      </div>
    )
  }
  if (isError) {
    return (
      <div className="nexus-card text-center py-12 text-muted-foreground text-sm">
        Failed to load comments.
      </div>
    )
  }

  const comments = data?.comments ?? []
  if (comments.length === 0) {
    return (
      <div className="nexus-card text-center py-12">
        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
        <p className="font-semibold text-sm">No comments yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <Link
          key={comment.id}
          href={comment.post?.community?.slug
            ? `/r/${comment.post.community.slug}/comments/${comment.post?.id}`
            : "#"}
          className="nexus-card block hover:border-primary/30 transition-all"
        >
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              {formatScore(comment.score)}
            </span>
            <span>•</span>
            <span>
              on <span className="text-primary font-medium line-clamp-1">{comment.post?.title ?? "a post"}</span>
            </span>
            <span>•</span>
            <span>{formatRelativeTime(comment.createdAt)}</span>
          </div>
          <p
            className="text-sm text-foreground line-clamp-3 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />
        </Link>
      ))}
    </div>
  )
}

function UserSavedPosts() {
  const { data, isLoading, isError } = useQuery<{ posts: PostListItem[] }>({
    queryKey: ["user-saved"],
    queryFn: async () => {
      const res = await fetch("/api/users/bookmarks")
      if (!res.ok) throw new Error("Failed to fetch saved posts")
      return res.json()
    },
    staleTime: 30 * 1000,
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)}
      </div>
    )
  }
  if (isError) {
    return (
      <div className="nexus-card text-center py-12 text-muted-foreground text-sm">
        Failed to load saved posts.
      </div>
    )
  }

  const posts = data?.posts ?? []
  if (posts.length === 0) {
    return (
      <div className="nexus-card text-center py-12">
        <Bookmark className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
        <p className="font-semibold text-sm">No saved posts yet</p>
        <p className="text-xs text-muted-foreground mt-1">Bookmark posts to find them here later.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} showCommunity={true} />
      ))}
    </div>
  )
}
