import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { NotificationsPageClient } from "@/components/notifications/notifications-page-client"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Notifications" }

export default async function NotificationsPage() {
  const session = await auth()
  if (!session) redirect("/login?callbackUrl=/notifications")
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground text-sm">Your recent activity and updates</p>
      </div>
      <NotificationsPageClient />
    </div>
  )
}
