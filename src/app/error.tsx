"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
          An unexpected error occurred. Please try again or go back home.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={reset}>Try Again</Button>
          <Button asChild><Link href="/">Go Home</Link></Button>
        </div>
      </div>
    </div>
  )
}
