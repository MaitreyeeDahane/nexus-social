"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useState, useCallback } from "react";
import {
  Bell,
  Search,
  Plus,
  Moon,
  Sun,
  LogOut,
  User,
  Settings,
  Bookmark,
  ChevronDown,
  Flame,
  Home,
  Hash,
  Shield,
  BarChart2,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { SearchCommand } from "@/components/search/search-command";
import { getInitials, formatNumber } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <>
      <header className="sticky top-0 z-50 glass-strong border-b border-border/50 h-14">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 group"
            aria-label="Nexus Social Home"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nexus-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text hidden sm:block">
              Nexus
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className="nav-link text-sm">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link href="/communities" className="nav-link text-sm">
              <Hash className="w-4 h-4" />
              Communities
            </Link>
            <Link href="/popular" className="nav-link text-sm">
              <BarChart2 className="w-4 h-4" />
              Popular
            </Link>
          </nav>

          {/* Search */}
          <div className="flex-1 max-w-lg">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 hover:bg-muted border border-border rounded-lg transition-all hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Open search"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left hidden sm:block">
                Search communities, posts, users...
              </span>
              <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {session ? (
              <>
                {/* Create post */}
                <Button asChild size="sm" variant="outline" className="hidden sm:flex gap-1.5">
                  <Link href="/submit">
                    <Plus className="w-4 h-4" />
                    Create
                  </Link>
                </Button>

                {/* Notifications */}
                <NotificationDropdown />

                {/* Theme toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="w-9 h-9"
                  aria-label="Toggle theme"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 px-2 h-9 hover:bg-accent"
                      aria-label="User menu"
                    >
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-nexus-500 to-purple-600 text-white">
                          {getInitials(session.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden lg:flex flex-col items-start text-left">
                        <span className="text-xs font-medium leading-none">
                          {session.user.username || session.user.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatNumber(session.user.karma || 0)} karma
                        </span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-muted-foreground hidden lg:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {session.user.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          u/{session.user.username}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/u/${session.user.username}`}>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bookmarks">
                        <Bookmark className="mr-2 h-4 w-4" />
                        Saved Posts
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    {(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <Shield className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="w-9 h-9"
                  aria-label="Toggle theme"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="hidden sm:flex">
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden w-9 h-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-background"
            >
              <nav className="flex flex-col p-3 gap-1">
                <Link href="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <Home className="w-4 h-4" /> Home
                </Link>
                <Link href="/communities" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <Hash className="w-4 h-4" /> Communities
                </Link>
                <Link href="/popular" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <BarChart2 className="w-4 h-4" /> Popular
                </Link>
                {session && (
                  <Link href="/submit" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                    <Plus className="w-4 h-4" /> Create Post
                  </Link>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search Command Palette */}
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
