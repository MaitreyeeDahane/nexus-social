import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Flame } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-nexus-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Flame className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-7xl font-black gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" asChild><Link href="/communities">Browse Communities</Link></Button>
          <Button asChild><Link href="/">Go Home</Link></Button>
        </div>
      </div>
    </div>
  )
}
