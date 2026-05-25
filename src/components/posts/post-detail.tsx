"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowUp, ArrowDown, MessageSquare, Share2, Bookmark,
  BookmarkCheck, ExternalLink, Loader2, AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CommentSection } from "@/components/comments/comment-section"
import { votePost, toggleBookmark } from "@/lib/actions/posts"
import { formatRelativeTime, formatScore, getInitials, getDomain, cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion } from "framer-motion"
import type { Session } from "next-auth"
import type { PostListItem } from "@/types"

interface PostDetailProps {
  postId: string
  session: Session | null
}

interface PostDetailResponse {
  post: PostListItem & {
    community: {
      id: string; name: string; slug: string; avatar: string | null
      banner: string | null; description: string | null; memberCount: number
      rules: Array<{ id: string; title: string; description: string | null; order: number }>
    }
    isLocked: boolean
  }
  comments: unknown[]
  isMember: boolean
  isMod: boolean
}

export function PostDetail({ postId, session }: PostDetailProps) {
  const [commentSort, setCommentSort] = useState<"top" | "new" | "old">("top")

  const { data, isLoading, isError } = useQuery<PostDetailResponse>({
    queryKey: ["post", postId, commentSort],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}?sort=${commentSort}`)
      if (!res.ok) throw new Error("Post not found")
      return res.json()
    },
    staleTime: 30 * 1000,
  })

  if (isLoading) return <PostDetailLoader />
  if (isError || !data?.post) {
    return (
      <div className="nexus-card text-center py-16">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground font-medium">Post not found or has been deleted.</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    )
  }

  const { post, comments, isMod } = data
  const commentData = (comments as any[]) ?? []

  return (
    <div className="space-y-4">
      <PostContent post={post} session={session} />

      <div className="nexus-card">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
          <span className="text-sm font-semibold">{post.commentCount} Comments</span>
          <div className="flex gap-1 ml-auto">
            {(["top", "new", "old"] as const).map((s) => (
              <Button
                key={s}
                variant={commentSort === s ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs capitalize"
                onClick={() => setCommentSort(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        <CommentSection
          postId={postId}
          comments={commentData as any}
          session={session}
          isLocked={post.isLocked}
        />
      </div>
    </div>
  )
}

function PostContent({ post, session }: { post: PostListItem & { isLocked: boolean }; session: Session | null }) {
  const queryClient = useQueryClient()
  const [score, setScore] = useState(post.score)
  const [userVote, setUserVote] = useState<string | null>(post.userVote as string | null)
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked)
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = useCallback(
    async (type: "UP" | "DOWN") => {
      if (!session) { toast.error("Sign in to vote", { action: { label: "Sign In", onClick: () => window.location.href = "/login" } }); return }
      if (isVoting) return

      const prevScore = score
      const prevVote = userVote
      if (userVote === type) { setScore((s) => s + (type === "UP" ? -1 : 1)); setUserVote(null) }
      else if (userVote) { setScore((s) => s + (type === "UP" ? 2 : -2)); setUserVote(type) }
      else { setScore((s) => s + (type === "UP" ? 1 : -1)); setUserVote(type) }

      setIsVoting(true)
      const result = await votePost(post.id, type)
      setIsVoting(false)

      if (!result.success) {
        setScore(prevScore)
        setUserVote(prevVote)
        toast.error(result.error)
      } else {
        setScore(result.data.score)
        setUserVote(result.data.userVote)
      }
    },
    [session, post.id, score, userVote, isVoting]
  )

  const handleBookmark = useCallback(async () => {
    if (!session) { toast.error("Sign in to save posts"); return }
    const prev = isBookmarked
    setIsBookmarked((b) => !b)
    const result = await toggleBookmark(post.id)
    if (!result.success) { setIsBookmarked(prev); toast.error(result.error) }
    else toast.success(result.data.bookmarked ? "Post saved!" : "Removed from saved")
  }, [session, post.id, isBookmarked])

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
    toast.success("Link copied to clipboard!")
  }, [])

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="nexus-card"
    >
      <div className="flex gap-3">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
          <Button
            variant="ghost" size="icon"
            className={cn("h-9 w-9 vote-btn-up", userVote === "UP" && "active bg-orange-500/10")}
            onClick={() => handleVote("UP")}
            aria-label="Upvote"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
          <span className={cn("text-sm font-bold tabular-nums", userVote === "UP" && "text-orange-500", userVote === "DOWN" && "text-blue-500", !userVote && "text-muted-foreground")}>
            {formatScore(score)}
          </span>
          <Button
            variant="ghost" size="icon"
            className={cn("h-9 w-9 vote-btn-down", userVote === "DOWN" && "active bg-blue-500/10")}
            onClick={() => handleVote("DOWN")}
            aria-label="Downvote"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 flex-wrap">
            <Link href={`/r/${(post.community as any).slug}`} className="font-semibold text-foreground hover:text-primary transition-colors">
              r/{post.community.name}
            </Link>
            <span>•</span>
            <span>Posted by</span>
            <Link href={`/u/${post.author.username}`} className="hover:text-foreground transition-colors">
              u/{post.author.username || post.author.name}
            </Link>
            <span>•</span>
            <time dateTime={new Date(post.createdAt).toISOString()}>
              {formatRelativeTime(post.createdAt)}
            </time>
            {post.flair && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ backgroundColor: `${post.flair.color}20`, color: post.flair.color, border: `1px solid ${post.flair.color}40` }}
              >
                {post.flair.name}
              </span>
            )}
            {post.isPinned && <Badge variant="secondary" className="text-[10px]">📌 Pinned</Badge>}
            {post.isLocked && <Badge variant="outline" className="text-[10px]">🔒 Locked</Badge>}
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-foreground mb-3 leading-snug">
            {post.isNSFW && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 mr-2">NSFW</span>}
            {post.isSpoiler && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 mr-2">SPOILER</span>}
            {post.title}
          </h1>

          {/* Body */}
          {post.type === "TEXT" && post.content && (
            <div
              className="prose-nexus mb-4 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}
          {post.type === "LINK" && post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 mb-4 bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 transition-colors max-w-full"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span className="truncate">{getDomain(post.url)}</span>
            </a>
          )}
          {post.imageUrl && (
            <div className="mb-4 rounded-xl overflow-hidden max-h-[600px]">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full object-contain bg-muted max-h-[600px]"
                loading="lazy"
              />
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.map((tag) => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 flex-wrap -ml-2 mt-3 pt-3 border-t border-border">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground text-xs gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              {post.commentCount} Comments
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground text-xs gap-1.5" onClick={handleShare}>
              <Share2 className="w-3.5 h-3.5" />Share
            </Button>
            <Button
              variant="ghost" size="sm"
              className={cn("h-8 px-2 text-xs gap-1.5", isBookmarked ? "text-primary" : "text-muted-foreground")}
              onClick={handleBookmark}
            >
              {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              {isBookmarked ? "Saved" : "Save"}
            </Button>
            {session?.user?.id === post.author.id && (
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground text-xs gap-1.5 ml-auto" asChild>
                <Link href={`/r/${(post.community as any).slug}/comments/${post.id}/edit`}>Edit</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  )
}

function PostDetailLoader() {
  return (
    <div className="space-y-4">
      <div className="nexus-card">
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <Skeleton className="w-8 h-5 rounded" />
            <Skeleton className="w-9 h-9 rounded-lg" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
            <Skeleton className="h-7 w-3/4 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
        </div>
      </div>
      <div className="nexus-card space-y-4">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </div>
  )
}
