import { auth } from "@/auth"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Account Suspended", robots: { index: false, follow: false } }
import { redirect } from "next/navigation"
import { Shield, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function BannedPage() {
  const session = await auth()
  if (!session?.user?.isBanned) redirect("/")

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Account Suspended</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          Your account has been suspended for violating our community guidelines.
          If you believe this is an error, please contact support.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link href="mailto:support@nexus.social">Contact Support</Link>
          </Button>
          <Button asChild>
            <Link href="/api/auth/signout">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
