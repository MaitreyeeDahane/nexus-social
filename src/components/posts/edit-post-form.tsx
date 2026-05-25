"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { updatePostSchema, type UpdatePostInput } from "@/lib/validations"
import { updatePost, deletePost } from "@/lib/actions/posts"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface EditPostFormProps {
  post: {
    id: string
    title: string
    content?: string | null
    type: string
    isNSFW: boolean
    isSpoiler: boolean
    flairId?: string | null
    community: {
      id: string
      slug: string
      name: string
      flairs: Array<{ id: string; name: string; color: string; textColor: string }>
    }
  }
  communitySlug: string
}

export function EditPostForm({ post, communitySlug }: EditPostFormProps) {
  const router = useRouter()

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<UpdatePostInput>({
    resolver: zodResolver(updatePostSchema),
    defaultValues: {
      content: post.content ?? "",
      isNSFW: post.isNSFW,
      isSpoiler: post.isSpoiler,
      flairId: post.flairId ?? undefined,
    },
  })

  const onSubmit = async (data: UpdatePostInput) => {
    const result = await updatePost(post.id, data)
    if (result.success) {
      toast.success("Post updated!")
      router.push(`/r/${communitySlug}/comments/${post.id}`)
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Permanently delete this post?")) return
    const result = await deletePost(post.id)
    if (result.success) {
      toast.success("Post deleted")
      router.push(`/r/${communitySlug}`)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title (display only - cannot edit title) */}
      <div className="nexus-card space-y-3">
        <div className="space-y-1.5">
          <Label>Title (cannot be edited)</Label>
          <div className="px-3 py-2 bg-muted rounded-lg text-sm text-muted-foreground">{post.title}</div>
        </div>

        {post.type === "TEXT" && (
          <div className="space-y-1.5">
            <Label htmlFor="content">Content</Label>
            <textarea
              id="content"
              rows={10}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              {...register("content")}
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
          </div>
        )}
      </div>

      {/* Flair */}
      {post.community.flairs.length > 0 && (
        <div className="nexus-card space-y-3">
          <Label>Post Flair</Label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setValue("flairId", null)}
              className={cn("px-3 py-1 rounded-full text-xs border transition-all", !watch("flairId") ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}
            >
              No flair
            </button>
            {post.community.flairs.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setValue("flairId", f.id)}
                className={cn("px-3 py-1 rounded-full text-xs border transition-all", watch("flairId") === f.id ? "ring-2 ring-offset-1" : "hover:opacity-80")}
                style={{ backgroundColor: `${f.color}20`, color: f.color, borderColor: `${f.color}40` }}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Options */}
      <div className="nexus-card space-y-3">
        <h3 className="text-sm font-medium">Post Options</h3>
        <div className="flex items-center justify-between">
          <Label htmlFor="isNSFW" className="text-sm">NSFW</Label>
          <Switch id="isNSFW" defaultChecked={post.isNSFW} onCheckedChange={v => setValue("isNSFW", v)} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="isSpoiler" className="text-sm">Spoiler</Label>
          <Switch id="isSpoiler" defaultChecked={post.isSpoiler} onCheckedChange={v => setValue("isSpoiler", v)} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-between">
        <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
          Delete Post
        </Button>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  )
}
