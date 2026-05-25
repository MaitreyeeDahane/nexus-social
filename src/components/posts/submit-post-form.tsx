"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileText, Image, Link2, BarChart2, Plus, X, Loader2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createPostSchema, type CreatePostInput } from "@/lib/validations"
import { createPost } from "@/lib/actions/posts"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const POST_TYPES = [
  { value: "TEXT", label: "Text", icon: FileText },
  { value: "IMAGE", label: "Image", icon: Image },
  { value: "LINK", label: "Link", icon: Link2 },
  { value: "POLL", label: "Poll", icon: BarChart2 },
] as const

interface SubmitPostFormProps {
  communities: Array<{ id: string; name: string; slug: string; avatar?: string | null }>
  userCommunities: Array<{ id: string; name: string; slug: string; avatar?: string | null }>
  defaultCommunityId?: string
  defaultType?: "TEXT" | "IMAGE" | "LINK" | "POLL"
}

export function SubmitPostForm({ communities, userCommunities, defaultCommunityId, defaultType = "TEXT" }: SubmitPostFormProps) {
  const router = useRouter()
  const [postType, setPostType] = useState<"TEXT" | "IMAGE" | "LINK" | "POLL">(defaultType)
  const [pollOptions, setPollOptions] = useState(["", ""])
  const [charCount, setCharCount] = useState(0)
  const [communitySearch, setCommunitySearch] = useState("")
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false)
  const [selectedCommunity, setSelectedCommunity] = useState<typeof communities[0] | null>(
    defaultCommunityId ? communities.find(c => c.id === defaultCommunityId) || null : null
  )

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      type: defaultType,
      communityId: defaultCommunityId || "",
      isNSFW: false,
      isSpoiler: false,
      tags: [],
    },
  })

  const title = watch("title") || ""
  const TITLE_MAX = 300

  const filteredCommunities = communitySearch
    ? communities.filter(c => c.name.toLowerCase().includes(communitySearch.toLowerCase())).slice(0, 8)
    : [...userCommunities.slice(0, 5), ...communities.filter(c => !userCommunities.find(u => u.id === c.id)).slice(0, 3)]

  const onSubmit = async (data: CreatePostInput) => {
    if (!selectedCommunity) { toast.error("Please select a community"); return }
    const result = await createPost({ ...data, communityId: selectedCommunity.id, type: postType })
    if (result.success) {
      toast.success("Post created!")
      router.push(`/r/${result.data.communitySlug}/comments/${result.data.id}`)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Community selector */}
      <div className="nexus-card">
        <Label className="mb-2 block">Community</Label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all text-left",
              selectedCommunity ? "border-primary/30 bg-primary/5" : "border-border bg-background hover:border-primary/20"
            )}
          >
            {selectedCommunity ? (
              <>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-nexus-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {selectedCommunity.avatar
                    ? <img src={selectedCommunity.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    : selectedCommunity.name[0].toUpperCase()
                  }
                </div>
                <span className="font-medium">r/{selectedCommunity.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Choose a community</span>
            )}
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground ml-auto transition-transform", showCommunityDropdown && "rotate-180")} />
          </button>

          {showCommunityDropdown && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
              <div className="p-2 border-b border-border">
                <Input
                  placeholder="Search communities..."
                  value={communitySearch}
                  onChange={e => setCommunitySearch(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto p-1">
                {filteredCommunities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No communities found</p>
                ) : (
                  filteredCommunities.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSelectedCommunity(c); setValue("communityId", c.id); setShowCommunityDropdown(false); setCommunitySearch("") }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-accent text-sm text-left transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-nexus-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {c.avatar ? <img src={c.avatar} alt="" className="w-7 h-7 rounded-full object-cover" /> : c.name[0].toUpperCase()}
                      </div>
                      <span>r/{c.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {errors.communityId && <p className="text-xs text-destructive mt-1">{errors.communityId.message}</p>}
      </div>

      {/* Post type tabs */}
      <div className="nexus-card">
        <div className="flex border-b border-border -mx-4 -mt-4 mb-4 px-4">
          {POST_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => { setPostType(value); setValue("type", value) }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px",
                postType === value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <span className={cn("text-xs", title.length > TITLE_MAX * 0.9 ? "text-amber-500" : "text-muted-foreground")}>
                {title.length}/{TITLE_MAX}
              </span>
            </div>
            <Input
              id="title"
              placeholder="An interesting title..."
              maxLength={TITLE_MAX}
              className={cn("text-sm", errors.title && "border-destructive")}
              {...register("title")}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Text content */}
          {postType === "TEXT" && (
            <div className="space-y-1.5">
              <Label htmlFor="content">Body (optional)</Label>
              <textarea
                id="content"
                rows={8}
                placeholder="Write your post... (supports basic HTML)"
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                {...register("content")}
              />
              {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
            </div>
          )}

          {/* Image URL */}
          {postType === "IMAGE" && (
            <div className="space-y-1.5">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" type="url" placeholder="https://example.com/image.jpg" {...register("imageUrl")} />
              {errors.imageUrl && <p className="text-xs text-destructive">{errors.imageUrl.message}</p>}
              <p className="text-xs text-muted-foreground">Paste a direct image link. Cloudinary upload coming soon.</p>
            </div>
          )}

          {/* Link */}
          {postType === "LINK" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="url">URL <span className="text-destructive">*</span></Label>
                <Input id="url" type="url" placeholder="https://example.com" className={cn(errors.url && "border-destructive")} {...register("url")} />
                {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="content">Description (optional)</Label>
                <textarea rows={3} placeholder="Add context about this link..." className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" {...register("content")} />
              </div>
            </div>
          )}

          {/* Poll */}
          {postType === "POLL" && (
            <div className="space-y-3">
              <Label>Poll Options</Label>
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={e => setPollOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                    maxLength={100}
                  />
                  {pollOptions.length > 2 && (
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => setPollOptions(prev => prev.filter((_, j) => j !== i))}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {pollOptions.length < 6 && (
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setPollOptions(prev => [...prev, ""])}>
                  <Plus className="w-4 h-4" />Add Option
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post options */}
      <div className="nexus-card space-y-4">
        <h3 className="text-sm font-semibold">Post Options</h3>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isNSFW" className="text-sm">NSFW Content</Label>
            <p className="text-xs text-muted-foreground">Mark as not safe for work</p>
          </div>
          <Switch id="isNSFW" onCheckedChange={v => setValue("isNSFW", v)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isSpoiler" className="text-sm">Spoiler</Label>
            <p className="text-xs text-muted-foreground">Hide content until revealed</p>
          </div>
          <Switch id="isSpoiler" onCheckedChange={v => setValue("isSpoiler", v)} />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Posting...</> : "Post"}
        </Button>
      </div>
    </form>
  )
}
