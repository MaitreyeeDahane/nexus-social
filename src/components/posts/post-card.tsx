"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Share2,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  MoreHorizontal,
  Pin,
  Eye,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { votePost, toggleBookmark } from "@/lib/actions/posts";
import { formatRelativeTime, formatScore, getInitials, getDomain, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { VoteType } from "@prisma/client";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content?: string | null;
    url?: string | null;
    imageUrl?: string | null;
    type: string;
    score: number;
    commentCount: number;
    viewCount?: number;
    isNSFW: boolean;
    isSpoiler: boolean;
    isPinned: boolean;
    createdAt: string | Date;
    userVote?: string | null;
    isBookmarked?: boolean;
    author: {
      id: string;
      name?: string | null;
      username?: string | null;
      image?: string | null;
      isVerified?: boolean;
    };
    community: {
      id: string;
      name: string;
      slug: string;
      avatar?: string | null;
    };
    flair?: {
      id: string;
      name: string;
      color: string;
      textColor: string;
    } | null;
  };
  compact?: boolean;
  showCommunity?: boolean;
}

export function PostCard({ post, compact = false, showCommunity = true }: PostCardProps) {
  const { data: session } = useSession();
  const [score, setScore] = useState(post.score);
  const [userVote, setUserVote] = useState<string | null>(post.userVote || null);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [isVoting, setIsVoting] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const handleVote = useCallback(
    async (type: "UP" | "DOWN") => {
      if (!session) {
        toast.error("Sign in to vote", {
          action: { label: "Sign In", onClick: () => window.location.href = "/login" },
        });
        return;
      }
      if (isVoting) return;

      // Optimistic update
      const prevScore = score;
      const prevVote = userVote;

      if (userVote === type) {
        setScore(s => s + (type === "UP" ? -1 : 1));
        setUserVote(null);
      } else if (userVote) {
        setScore(s => s + (type === "UP" ? 2 : -2));
        setUserVote(type);
      } else {
        setScore(s => s + (type === "UP" ? 1 : -1));
        setUserVote(type);
      }

      setIsVoting(true);
      const result = await votePost(post.id, type);
      setIsVoting(false);

      if (!result.success) {
        setScore(prevScore);
        setUserVote(prevVote);
        toast.error(result.error);
      } else {
        setScore(result.data.score);
        setUserVote(result.data.userVote);
      }
    },
    [session, post.id, score, userVote, isVoting]
  );

  const handleBookmark = useCallback(async () => {
    if (!session) {
      toast.error("Sign in to save posts");
      return;
    }
    if (isBookmarking) return;

    setIsBookmarked(b => !b);
    setIsBookmarking(true);
    const result = await toggleBookmark(post.id);
    setIsBookmarking(false);

    if (!result.success) {
      setIsBookmarked(b => !b);
      toast.error(result.error);
    } else {
      toast.success(result.data.bookmarked ? "Post saved" : "Post removed from saved");
    }
  }, [session, post.id, isBookmarking]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/r/${post.community.slug}/comments/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }, [post.community.slug, post.id]);

  const postUrl = `/r/${post.community.slug}/comments/${post.id}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "post-card group",
        compact && "rounded-lg"
      )}
      role="article"
      aria-label={post.title}
    >
      {/* Vote sidebar */}
      <div className="flex">
        <div className="flex flex-col items-center py-3 px-2 gap-0.5 min-w-[44px]">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 vote-btn-up",
              userVote === "UP" && "active bg-orange-500/10"
            )}
            onClick={() => handleVote("UP")}
            aria-label="Upvote"
            aria-pressed={userVote === "UP"}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <span
            className={cn(
              "text-xs font-bold tabular-nums",
              userVote === "UP" && "text-orange-500",
              userVote === "DOWN" && "text-blue-500",
              !userVote && "text-muted-foreground"
            )}
            aria-label={`${score} votes`}
          >
            {formatScore(score)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 vote-btn-down",
              userVote === "DOWN" && "active bg-blue-500/10"
            )}
            onClick={() => handleVote("DOWN")}
            aria-label="Downvote"
            aria-pressed={userVote === "DOWN"}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 py-3 pr-3 min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            {post.isPinned && (
              <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 font-medium">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
            {showCommunity && (
              <Link
                href={`/r/${post.community.slug}`}
                className="text-xs font-semibold text-foreground hover:text-primary transition-colors"
                onClick={e => e.stopPropagation()}
              >
                r/{post.community.name}
              </Link>
            )}
            {showCommunity && <span className="text-muted-foreground text-xs">•</span>}
            <span className="text-xs text-muted-foreground">Posted by</span>
            <Link
              href={`/u/${post.author.username}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={e => e.stopPropagation()}
            >
              u/{post.author.username || post.author.name}
            </Link>
            <span className="text-muted-foreground text-xs">•</span>
            <time
              dateTime={new Date(post.createdAt).toISOString()}
              className="text-xs text-muted-foreground"
            >
              {formatRelativeTime(post.createdAt)}
            </time>
          </div>

          {/* Title + Badges */}
          <div className="flex items-start gap-2 flex-wrap mb-2">
            <Link href={postUrl} className="flex-1 min-w-0">
              <h2 className={cn(
                "font-semibold text-foreground hover:text-primary transition-colors leading-snug",
                compact ? "text-sm" : "text-base"
              )}>
                {post.isNSFW && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 mr-2">
                    NSFW
                  </span>
                )}
                {post.isSpoiler && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 mr-2">
                    SPOILER
                  </span>
                )}
                {post.title}
              </h2>
            </Link>
            {post.flair && (
              <span
                className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: `${post.flair.color}20`,
                  color: post.flair.color,
                  borderColor: `${post.flair.color}40`,
                  border: "1px solid",
                }}
              >
                {post.flair.name}
              </span>
            )}
          </div>

          {/* Content preview */}
          {!compact && post.type === "TEXT" && post.content && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-2 leading-relaxed">
              {post.content.replace(/<[^>]*>/g, "")}
            </p>
          )}

          {/* Link preview */}
          {post.type === "LINK" && post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 mb-2 bg-primary/5 px-2 py-1 rounded-md border border-primary/10 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[200px]">{getDomain(post.url)}</span>
            </a>
          )}

          {/* Image preview */}
          {post.imageUrl && !compact && (
            <Link href={postUrl} className="block mb-2">
              <div className="relative max-h-[400px] overflow-hidden rounded-lg">
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  width={800}
                  height={400}
                  className="w-full object-cover"
                  loading="lazy"
                />
              </div>
            </Link>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 flex-wrap -ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground text-xs gap-1.5"
              asChild
            >
              <Link href={`${postUrl}#comments`}>
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{post.commentCount} Comments</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground text-xs gap-1.5"
              onClick={handleShare}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 text-xs gap-1.5 transition-colors",
                isBookmarked
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={handleBookmark}
              aria-label={isBookmarked ? "Remove bookmark" : "Save post"}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-3.5 h-3.5" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isBookmarked ? "Saved" : "Save"}</span>
            </Button>

            {post.viewCount !== undefined && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground px-2">
                <Eye className="w-3 h-3" />
                {formatScore(post.viewCount)}
              </span>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground ml-auto"
                  aria-label="More options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/r/${post.community.slug}/comments/${post.id}/report`}>
                    Report post
                  </Link>
                </DropdownMenuItem>
                {session?.user?.id === post.author.id && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={`/r/${post.community.slug}/comments/${post.id}/edit`}>
                        Edit post
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
