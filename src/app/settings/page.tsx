import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your Nexus Social account settings",
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect("/login?callbackUrl=/settings")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, username: true, email: true, bio: true, website: true, location: true, image: true, coverImage: true },
  })

  if (!user) redirect("/login")

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile and preferences</p>
      </div>
      <ProfileSettingsForm user={user} />
    </div>
  )
}
