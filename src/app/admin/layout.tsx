import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Users, Hash, AlertTriangle, FileText, Shield, Activity } from "lucide-react"

const adminNavItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/communities", label: "Communities", icon: Hash },
  { href: "/admin/reports", label: "Reports", icon: AlertTriangle },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/modlogs", label: "Mod Logs", icon: Activity },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") redirect("/")

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="hidden md:block w-52 shrink-0">
          <div className="sticky top-20 nexus-card p-2 space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Admin Panel</span>
            </div>
            {adminNavItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </aside>
        {/* Main content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
