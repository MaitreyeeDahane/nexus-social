"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Image, Link2, BarChart2, FileText } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/utils"

export function CreatePostCard() {
  const { data: session } = useSession()
  if (!session) return null

  return (
    <div className="nexus-card p-3">
      <div className="flex items-center gap-3">
        <Avatar className="w-9 h-9 shrink-0">
          <AvatarImage src={session.user.image || ""} />
          <AvatarFallback className="text-xs bg-gradient-to-br from-nexus-500 to-purple-600 text-white">
            {getInitials(session.user.name)}
          </AvatarFallback>
        </Avatar>
        <Link
          href="/submit"
          className="flex-1 h-9 px-4 flex items-center rounded-lg border border-border bg-muted/50 hover:border-primary/30 hover:bg-muted transition-all text-sm text-muted-foreground"
        >
          Create a post...
        </Link>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground hover:text-foreground" asChild title="Image post">
            <Link href="/submit?type=IMAGE"><Image className="w-4 h-4" /></Link>
          </Button>
          <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground hover:text-foreground" asChild title="Link post">
            <Link href="/submit?type=LINK"><Link2 className="w-4 h-4" /></Link>
          </Button>
          <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground hover:text-foreground" asChild title="Poll">
            <Link href="/submit?type=POLL"><BarChart2 className="w-4 h-4" /></Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
