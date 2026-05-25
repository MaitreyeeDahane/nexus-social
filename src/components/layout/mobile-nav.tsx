"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Plus, Bell, User } from "lucide-react"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/submit", icon: Plus, label: "Post", special: true },
  { href: "/notifications", icon: Bell, label: "Alerts" },
  { href: "/settings", icon: User, label: "Profile" },
]

export function MobileNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  if (!session) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass-strong border-t border-border mobile-nav-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label, special }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                special
                  ? "bg-gradient-to-br from-nexus-500 to-purple-600 text-white px-4 py-2 shadow-lg"
                  : isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("shrink-0", special ? "w-5 h-5" : "w-5 h-5")} />
              {!special && <span className="text-[10px] font-medium">{label}</span>}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
