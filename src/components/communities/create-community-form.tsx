"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Globe, Lock, EyeOff, Loader2, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createCommunitySchema, type CreateCommunityInput } from "@/lib/validations"
import { createCommunity } from "@/lib/actions/communities"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const COMMUNITY_TYPES = [
  { value: "PUBLIC", label: "Public", description: "Anyone can view, post, and comment", icon: Globe },
  { value: "RESTRICTED", label: "Restricted", description: "Anyone can view, only approved users can post", icon: EyeOff },
  { value: "PRIVATE", label: "Private", description: "Only approved members can view and post", icon: Lock },
] as const

export function CreateCommunityForm() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<"PUBLIC" | "RESTRICTED" | "PRIVATE">("PUBLIC")

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<CreateCommunityInput>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: { type: "PUBLIC", isNSFW: false },
  })

  const nameValue = watch("name") || ""

  const onSubmit = async (data: CreateCommunityInput) => {
    const result = await createCommunity({ ...data, type: selectedType })
    if (result.success) {
      toast.success(`r/${data.name} created!`)
      router.push(`/r/${result.data.slug}`)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="nexus-card space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Community Name <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="name"
              placeholder="mycommunity"
              className={cn("pl-10", errors.name && "border-destructive")}
              {...register("name")}
            />
          </div>
          {errors.name ? (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Community names cannot be changed after creation. No spaces or special characters.
            </p>
          )}
          {nameValue && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-nexus-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {nameValue[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium">r/{nameValue}</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            rows={3}
            placeholder="Tell us about your community..."
            maxLength={500}
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            {...register("description")}
          />
          {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
        </div>
      </div>

      {/* Community type */}
      <div className="nexus-card space-y-3">
        <Label>Community Type</Label>
        {COMMUNITY_TYPES.map(({ value, label, description, icon: Icon }) => (
          <label
            key={value}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
              selectedType === value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
            )}
          >
            <input
              type="radio"
              name="type"
              value={value}
              checked={selectedType === value}
              onChange={() => { setSelectedType(value); setValue("type", value) }}
              className="mt-0.5 accent-primary"
            />
            <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", selectedType === value ? "text-primary" : "text-muted-foreground")} />
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Adult content */}
      <div className="nexus-card">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isNSFW" className="text-sm font-medium">18+ Community</Label>
            <p className="text-xs text-muted-foreground mt-0.5">This community contains adult content (NSFW)</p>
          </div>
          <Switch id="isNSFW" onCheckedChange={v => setValue("isNSFW", v)} />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</> : "Create Community"}
        </Button>
      </div>
    </form>
  )
}
