"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Trash2, Image, AlignLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { updateCommunitySchema, type UpdateCommunityInput } from "@/lib/validations"
import { updateCommunity, addCommunityRule } from "@/lib/actions/communities"
import { toast } from "sonner"

interface CommunitySettingsFormProps {
  community: {
    id: string
    name: string
    slug: string
    description?: string | null
    longDescription?: string | null
    avatar?: string | null
    banner?: string | null
    isNSFW: boolean
    isPrivate: boolean
    isRestricted: boolean
    rules: Array<{ id: string; title: string; description?: string | null; order: number }>
    moderators: Array<{ user: { id: string; name?: string | null; username?: string | null; image?: string | null } }>
    settings: { allowImagePosts: boolean; allowLinkPosts: boolean; allowPollPosts: boolean; requireFlair: boolean } | null
  }
}

export function CommunitySettingsForm({ community }: CommunitySettingsFormProps) {
  const router = useRouter()
  const [rules, setRules] = useState(community.rules)
  const [newRuleTitle, setNewRuleTitle] = useState("")
  const [newRuleDesc, setNewRuleDesc] = useState("")
  const [isAddingRule, setIsAddingRule] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { isSubmitting, isDirty } } = useForm<UpdateCommunityInput>({
    resolver: zodResolver(updateCommunitySchema),
    defaultValues: {
      description: community.description || "",
      longDescription: community.longDescription || "",
      avatar: community.avatar || "",
      banner: community.banner || "",
      isNSFW: community.isNSFW,
      isPrivate: community.isPrivate,
      isRestricted: community.isRestricted,
    },
  })

  const onSubmit = async (data: UpdateCommunityInput) => {
    const result = await updateCommunity(community.id, data)
    if (result.success) {
      toast.success("Community updated!")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleAddRule = async () => {
    if (!newRuleTitle.trim()) return
    setIsAddingRule(true)
    const result = await addCommunityRule(community.id, { title: newRuleTitle.trim(), description: newRuleDesc.trim() || undefined })
    setIsAddingRule(false)
    if (result.success) {
      toast.success("Rule added!")
      setRules(prev => [...prev, { id: Date.now().toString(), title: newRuleTitle, description: newRuleDesc || null, order: prev.length }])
      setNewRuleTitle("")
      setNewRuleDesc("")
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Tabs defaultValue="general">
      <TabsList className="mb-6">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="rules">Rules</TabsTrigger>
        <TabsTrigger value="moderators">Moderators</TabsTrigger>
      </TabsList>

      <form onSubmit={handleSubmit(onSubmit)}>
        <TabsContent value="general" className="space-y-6">
          <div className="nexus-card space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            <div className="space-y-1.5">
              <Label>Community Name</Label>
              <Input value={`r/${community.name}`} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Community names cannot be changed</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea rows={3} id="description" placeholder="What is your community about?" maxLength={500} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" {...register("description")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="longDescription">Sidebar Description (Markdown)</Label>
              <textarea rows={6} id="longDescription" placeholder="Detailed community description..." className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono" {...register("longDescription")} />
            </div>
          </div>

          <div className="nexus-card space-y-4">
            <h3 className="font-semibold">Community Settings</h3>
            {[
              { id: "isNSFW", label: "NSFW Community", desc: "All content is marked as adult", field: "isNSFW" as const },
              { id: "isPrivate", label: "Private Community", desc: "Only approved members can view", field: "isPrivate" as const },
              { id: "isRestricted", label: "Restricted", desc: "Only approved users can post", field: "isRestricted" as const },
            ].map(({ id, label, desc, field }) => (
              <div key={id} className="flex items-center justify-between">
                <div>
                  <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch id={id} defaultChecked={watch(field)} onCheckedChange={v => setValue(field, v)} />
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : "Save Changes"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <div className="nexus-card space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Image className="w-4 h-4" />Community Images</h3>
            <div className="space-y-1.5">
              <Label htmlFor="avatar">Community Avatar URL</Label>
              <Input id="avatar" type="url" placeholder="https://example.com/avatar.png" {...register("avatar")} />
              <p className="text-xs text-muted-foreground">Recommended: 256x256px square image</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="banner">Community Banner URL</Label>
              <Input id="banner" type="url" placeholder="https://example.com/banner.jpg" {...register("banner")} />
              <p className="text-xs text-muted-foreground">Recommended: 1920x384px wide image</p>
            </div>
            {(watch("avatar") || community.avatar) && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <img src={watch("avatar") || community.avatar || ""} alt="Preview" className="w-12 h-12 rounded-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                <p className="text-xs text-muted-foreground">Avatar preview</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : "Save Appearance"}
            </Button>
          </div>
        </TabsContent>
      </form>

      <TabsContent value="rules" className="space-y-4">
        <div className="nexus-card">
          <h3 className="font-semibold mb-4">Community Rules</h3>
          <div className="space-y-3 mb-4">
            {rules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No rules yet. Add your first rule!</p>
            ) : (
              rules.map((rule, i) => (
                <div key={rule.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs font-bold text-primary w-5 shrink-0 mt-0.5">{i + 1}.</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rule.title}</p>
                    {rule.description && <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
          <Separator className="mb-4" />
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Add New Rule</h4>
            <Input placeholder="Rule title" value={newRuleTitle} onChange={e => setNewRuleTitle(e.target.value)} maxLength={100} />
            <textarea rows={2} placeholder="Rule description (optional)" value={newRuleDesc} onChange={e => setNewRuleDesc(e.target.value)} maxLength={500} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
            <Button onClick={handleAddRule} disabled={isAddingRule || !newRuleTitle.trim()} size="sm" className="gap-1.5">
              {isAddingRule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Rule
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="moderators" className="space-y-4">
        <div className="nexus-card">
          <h3 className="font-semibold mb-4">Moderators</h3>
          <div className="space-y-3">
            {community.moderators.map(({ user }) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nexus-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user.image ? <img src={user.image} alt="" className="w-8 h-8 rounded-full object-cover" /> : (user.name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">u/{user.username}</p>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="space-y-2">
            <Label>Invite Moderator (by username)</Label>
            <div className="flex gap-2">
              <Input placeholder="username" />
              <Button variant="outline" size="sm">Invite</Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
