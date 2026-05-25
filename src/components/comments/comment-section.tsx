"use client"

import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowUp, ArrowDown, Reply, Edit, Trash2, ChevronDown, ChevronUp, MoreHorizontal, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createComment, updateComment, deleteComment, voteComment } from "@/lib/actions/comments"
import { formatRelativeTime, getInitials, formatScore, cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import type { Session } from "next-auth"

interface Author {
  id: string
  name?: string | null
  username?: string | null
  image?: string | null
  karma?: number
  isVerified?: boolean
}

interface CommentData {
  id: string
  content: string
  score: number
  depth: number
  isDeleted: boolean
  isPinned: boolean
  createdAt: string | Date
  updatedAt: string | Date
  author: Author
  replies?: CommentData[]
  votes?: Array<{ type: string }>
  _count?: { replies: number }
}

interface CommentSectionProps {
  postId: string
  comments: CommentData[]
  session: Session | null
  isLocked?: boolean
}

export function CommentSection({ postId, comments, session, isLocked }: CommentSectionProps) {
  const [localComments, setLocalComments] = useState<CommentData[]>(comments)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newComment, setNewComment] = useState("")
  const router = useRouter()

  const handleSubmitTopLevel = useCallback(async () => {
    if (!session) { router.push("/login"); return }
    if (!newComment.trim()) return
    setIsSubmitting(true)

    const result = await createComment({ content: newComment.trim(), postId })
    setIsSubmitting(false)

    if (result.success) {
      toast.success("Comment posted")
      setNewComment("")
      // Optimistically add comment to top
      const optimisticComment: CommentData = {
        id: result.data.id,
        content: newComment.trim(),
        score: 0,
        depth: 0,
        isDeleted: false,
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: session.user.id,
          name: session.user.name,
          username: session.user.username,
          image: session.user.image,
        },
        replies: [],
        _count: { replies: 0 },
      }
      setLocalComments(prev => [optimisticComment, ...prev])
    } else {
      toast.error(result.error)
    }
  }, [session, newComment, postId, router])

  return (
    <div>
      {/* Comment input */}
      {!isLocked && (
        <div className="mb-6">
          {session ? (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 shrink-0 mt-1">
                <AvatarImage src={session.user.image || ""} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-nexus-500 to-purple-600 text-white">
                  {getInitials(session.user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="What are your thoughts?"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmitTopLevel()
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Ctrl+Enter to submit</span>
                  <Button
                    size="sm"
                    onClick={handleSubmitTopLevel}
                    disabled={isSubmitting || !newComment.trim()}
                    className="gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">Sign in to join the discussion</p>
              <Button size="sm" onClick={() => router.push("/login")}>Sign In to Comment</Button>
            </div>
          )}
        </div>
      )}

      {isLocked && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Comments are locked on this post.</span>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-1">
        {localComments.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">No comments yet. Be the first!</p>
          </div>
        ) : (
          localComments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              session={session}
              isLocked={isLocked}
              depth={0}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface CommentItemProps {
  comment: CommentData
  postId: string
  session: Session | null
  isLocked?: boolean
  depth: number
}

function CommentItem({ comment, postId, session, isLocked, depth }: CommentItemProps) {
  const [score, setScore] = useState(comment.score)
  const [userVote, setUserVote] = useState<string | null>(comment.votes?.[0]?.type || null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [editContent, setEditContent] = useState(comment.content)
  const [localContent, setLocalContent] = useState(comment.content)
  const [localReplies, setLocalReplies] = useState<CommentData[]>(comment.replies || [])
  const [isDeleted, setIsDeleted] = useState(comment.isDeleted)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleVote = useCallback(async (type: "UP" | "DOWN") => {
    if (!session) { toast.error("Sign in to vote"); return }
    const prevScore = score; const prevVote = userVote
    if (userVote === type) { setScore(s => s + (type === "UP" ? -1 : 1)); setUserVote(null) }
    else if (userVote) { setScore(s => s + (type === "UP" ? 2 : -2)); setUserVote(type) }
    else { setScore(s => s + (type === "UP" ? 1 : -1)); setUserVote(type) }
    const result = await voteComment(comment.id, type)
    if (!result.success) { setScore(prevScore); setUserVote(prevVote); toast.error(result.error) }
    else { setScore(result.data.score); setUserVote(result.data.userVote) }
  }, [session, comment.id, score, userVote])

  const handleReply = useCallback(async () => {
    if (!session) { router.push("/login"); return }
    if (!replyContent.trim()) return
    setIsSubmitting(true)
    const result = await createComment({ content: replyContent.trim(), postId, parentId: comment.id })
    setIsSubmitting(false)
    if (result.success) {
      toast.success("Reply posted")
      setReplyContent("")
      setIsReplying(false)
      const optimisticReply: CommentData = {
        id: result.data.id,
        content: replyContent.trim(),
        score: 0,
        depth: depth + 1,
        isDeleted: false,
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: { id: session.user.id, name: session.user.name, username: session.user.username, image: session.user.image },
        replies: [],
        _count: { replies: 0 },
      }
      setLocalReplies(prev => [...prev, optimisticReply])
    } else {
      toast.error(result.error)
    }
  }, [session, replyContent, postId, comment.id, depth, router])

  const handleEdit = useCallback(async () => {
    if (!editContent.trim()) return
    setIsSubmitting(true)
    const result = await updateComment(comment.id, editContent.trim())
    setIsSubmitting(false)
    if (result.success) {
      setLocalContent(editContent.trim())
      setIsEditing(false)
      toast.success("Comment updated")
    } else {
      toast.error(result.error)
    }
  }, [comment.id, editContent])

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this comment?")) return
    const result = await deleteComment(comment.id)
    if (result.success) { setIsDeleted(true); toast.success("Comment deleted") }
    else toast.error(result.error)
  }, [comment.id])

  if (isDeleted) {
    return (
      <div className={cn("py-2", depth > 0 && "ml-6 pl-3 border-l border-border/50")}>
        <p className="text-xs text-muted-foreground italic">[deleted]</p>
        {localReplies.length > 0 && (
          <div className="mt-1 space-y-1">
            {localReplies.map(reply => (
              <CommentItem key={reply.id} comment={reply} postId={postId} session={session} isLocked={isLocked} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const isOwner = session?.user?.id === comment.author.id
  const indentClass = depth > 0 ? "ml-6 pl-3 border-l-2 border-border/40 hover:border-primary/30 transition-colors" : ""

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("group", indentClass)}
    >
      <div className="py-2">
        {/* Comment header */}
        <div className="flex items-center gap-2 mb-1.5">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="shrink-0" aria-label={isCollapsed ? "Expand" : "Collapse"}>
            <Avatar className="w-6 h-6">
              <AvatarImage src={comment.author.image || ""} />
              <AvatarFallback className="text-[10px] bg-gradient-to-br from-nexus-500 to-purple-600 text-white">
                {getInitials(comment.author.name)}
              </AvatarFallback>
            </Avatar>
          </button>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-xs font-semibold text-foreground hover:text-primary transition-colors"
            >
              {comment.author.username || comment.author.name}
            </button>
            {comment.author.karma !== undefined && (
              <span className="text-[10px] text-muted-foreground">{formatScore(comment.author.karma)} karma</span>
            )}
            <span className="text-[10px] text-muted-foreground">•</span>
            <time className="text-[10px] text-muted-foreground">{formatRelativeTime(comment.createdAt)}</time>
            {comment.isPinned && <span className="text-[10px] text-green-500 font-medium">📌 pinned</span>}
          </div>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="ml-auto text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
            {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              {/* Comment body */}
              {isEditing ? (
                <div className="space-y-2 mb-2">
                  <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3} className="text-sm resize-none" autoFocus />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleEdit} disabled={isSubmitting} className="h-7 text-xs">
                      {isSubmitting && <Loader2 className="w-3 h-3 animate-spin mr-1" />}Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditContent(localContent) }} className="h-7 text-xs">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-foreground leading-relaxed mb-2 prose-nexus" dangerouslySetInnerHTML={{ __html: localContent }} />
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 -ml-1 flex-wrap">
                <Button variant="ghost" size="icon" className={cn("h-6 w-6 vote-btn-up", userVote === "UP" && "active text-orange-500")} onClick={() => handleVote("UP")}>
                  <ArrowUp className="w-3 h-3" />
                </Button>
                <span className={cn("text-xs font-medium tabular-nums min-w-[20px] text-center", userVote === "UP" && "text-orange-500", userVote === "DOWN" && "text-blue-500", !userVote && "text-muted-foreground")}>
                  {formatScore(score)}
                </span>
                <Button variant="ghost" size="icon" className={cn("h-6 w-6 vote-btn-down", userVote === "DOWN" && "active text-blue-500")} onClick={() => handleVote("DOWN")}>
                  <ArrowDown className="w-3 h-3" />
                </Button>

                {!isLocked && session && (
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1" onClick={() => setIsReplying(!isReplying)}>
                    <Reply className="w-3 h-3" />Reply
                  </Button>
                )}

                {isOwner && (
                  <>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1" onClick={() => { setIsEditing(true); setEditContent(localContent) }}>
                      <Edit className="w-3 h-3" />Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive gap-1" onClick={handleDelete}>
                      <Trash2 className="w-3 h-3" />Delete
                    </Button>
                  </>
                )}
              </div>

              {/* Reply input */}
              <AnimatePresence>
                {isReplying && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 flex gap-2">
                    <Avatar className="w-6 h-6 shrink-0 mt-1">
                      <AvatarImage src={session?.user.image || ""} />
                      <AvatarFallback className="text-[10px] bg-gradient-to-br from-nexus-500 to-purple-600 text-white">
                        {getInitials(session?.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder={`Reply to u/${comment.author.username}...`}
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        rows={2}
                        className="text-sm resize-none"
                        autoFocus
                        onKeyDown={e => { if (e.key === "Escape") setIsReplying(false) }}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleReply} disabled={isSubmitting || !replyContent.trim()} className="h-7 text-xs">
                          {isSubmitting && <Loader2 className="w-3 h-3 animate-spin mr-1" />}Reply
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setIsReplying(false); setReplyContent("") }} className="h-7 text-xs">Cancel</Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nested replies */}
              {localReplies.length > 0 && (
                <div className="mt-1 space-y-1">
                  {localReplies.map(reply => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      postId={postId}
                      session={session}
                      isLocked={isLocked}
                      depth={Math.min(depth + 1, 6)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isCollapsed && localReplies.length > 0 && (
          <button onClick={() => setIsCollapsed(false)} className="text-xs text-primary hover:text-primary/80 mt-1">
            {localReplies.length} {localReplies.length === 1 ? "reply" : "replies"} hidden
          </button>
        )}
      </div>
    </motion.div>
  )
}
