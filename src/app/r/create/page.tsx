import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CreateCommunityForm } from "@/components/communities/create-community-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Community",
  description: "Start a new community on Nexus Social",
}

export default async function CreateCommunityPage() {
  const session = await auth()
  if (!session) redirect("/login?callbackUrl=/r/create")

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create a Community</h1>
        <p className="text-muted-foreground text-sm mt-1">Build a home for your people, content, and conversations</p>
      </div>
      <CreateCommunityForm />
    </div>
  )
}
