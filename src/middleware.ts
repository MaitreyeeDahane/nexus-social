import { auth } from "@/auth"
import { NextResponse } from "next/server"

const PROTECTED_ROUTES = ["/submit", "/settings", "/bookmarks", "/notifications"]
const ADMIN_ROUTES = ["/admin"]
const AUTH_ROUTES = ["/login", "/register"]

export default auth((req) => {
  const session = req.auth
  const isLoggedIn = !!session
  const path = req.nextUrl.pathname

  // Block banned users everywhere except /banned
  if (isLoggedIn && session?.user?.isBanned && path !== "/banned") {
    return NextResponse.redirect(new URL("/banned", req.nextUrl))
  }

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && AUTH_ROUTES.some((r) => path.startsWith(r))) {
    return NextResponse.redirect(new URL("/", req.nextUrl))
  }

  // Protect authenticated routes
  if (!isLoggedIn && PROTECTED_ROUTES.some((r) => path.startsWith(r))) {
    const loginUrl = new URL("/login", req.nextUrl)
    loginUrl.searchParams.set("callbackUrl", path)
    return NextResponse.redirect(loginUrl)
  }

  // Protect admin routes
  if (ADMIN_ROUTES.some((r) => path.startsWith(r))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.nextUrl))
    }
    const role = session?.user?.role
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.nextUrl))
    }
  }

  const response = NextResponse.next()
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  return response
})

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|icons/|screenshots/).*)",
  ],
}
