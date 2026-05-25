"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, User, AtSign, Globe, MapPin, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { getInitials, cn } from "@/lib/utils"

interface ProfileSettingsFormProps {
  user: {
    id: string
    name?: string | null
    username?: string | null
    email?: string | null
    bio?: string | null
    website?: string | null
    location?: string | null
    image?: string | null
    coverImage?: string | null
  }
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name || "",
      username: user.username || "",
      bio: user.bio || "",
      website: user.website || "",
      location: user.location || "",
    },
  })

  const onSubmit = async (data: UpdateProfileInput) => {
    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error || "Failed to update profile")
    } else {
      toast.success("Profile updated!")
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar section */}
      <div className="nexus-card flex items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={user.image || ""} />
          <AvatarFallback className="text-xl bg-gradient-to-br from-nexus-500 to-purple-600 text-white">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">Profile Picture</p>
          <p className="text-xs text-muted-foreground mt-0.5">Sign in with GitHub or Google to use their profile picture</p>
          <p className="text-xs text-muted-foreground">Custom upload coming soon</p>
        </div>
      </div>

      {/* Basic info */}
      <div className="nexus-card space-y-4">
        <h3 className="font-semibold text-sm">Basic Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Display Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="name" className={cn("pl-10", errors.name && "border-destructive")} {...register("name")} />
            </div>
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="username" className={cn("pl-10", errors.username && "border-destructive")} {...register("username")} />
            </div>
            {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <textarea
              id="bio"
              rows={3}
              placeholder="Tell the community about yourself..."
              maxLength={300}
              className="flex w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              {...register("bio")}
            />
          </div>
          {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="website" type="url" placeholder="https://" className="pl-10" {...register("website")} />
            </div>
            {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="location" placeholder="City, Country" className="pl-10" {...register("location")} />
            </div>
          </div>
        </div>
      </div>

      {/* Account info (read-only) */}
      <div className="nexus-card space-y-3">
        <h3 className="font-semibold text-sm">Account Information</h3>
        <div className="flex items-center justify-between py-2 border-b border-border">
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Verified</span>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting || !isDirty} className="min-w-[120px]">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
