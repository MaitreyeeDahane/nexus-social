"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Hash, User, FileText, Loader2 } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useDebounce } from "@/hooks/use-debounce"
import { getInitials, formatNumber } from "@/lib/utils"

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SearchResults {
  posts?: Array<{ id: string; title: string; community: { slug: string; name: string } }>
  communities?: Array<{ id: string; name: string; slug: string; avatar?: string | null; memberCount: number }>
  users?: Array<{ id: string; name?: string | null; username?: string | null; image?: string | null; karma: number }>
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults>({})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "posts" | "communities" | "users">("all")
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults({})
      return
    }
    const search = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&type=all&limit=5`)
        const data = await res.json()
        setResults(data.results || {})
      } catch { setResults({}) }
      finally { setLoading(false) }
    }
    search()
  }, [debouncedQuery])

  const navigate = useCallback((path: string) => {
    router.push(path)
    onOpenChange(false)
    setQuery("")
  }, [router, onOpenChange])

  const hasResults = Object.values(results).some(arr => Array.isArray(arr) && arr.length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search communities, posts, users..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onKeyDown={e => {
              if (e.key === "Enter" && query.trim()) {
                navigate(`/search?q=${encodeURIComponent(query)}`)
              }
            }}
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <kbd className="hidden sm:inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[480px] overflow-y-auto">
          {!query && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>Search for communities, posts, and users</p>
            </div>
          )}

          {query && !loading && !hasResults && query.length >= 2 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <p>No results for "<strong>{query}</strong>"</p>
            </div>
          )}

          {/* Communities */}
          {results.communities && results.communities.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Communities</p>
              {results.communities.map(c => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/r/${c.slug}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nexus-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {c.avatar ? <img src={c.avatar} alt="" className="w-8 h-8 rounded-full object-cover" /> : c.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">r/{c.name}</p>
                    <p className="text-xs text-muted-foreground">{formatNumber(c.memberCount)} members</p>
                  </div>
                  <Hash className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Posts */}
          {results.posts && results.posts.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Posts</p>
              {results.posts.map(p => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/r/${p.community.slug}/comments/${p.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                    <p className="text-xs text-muted-foreground">r/{p.community.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Users */}
          {results.users && results.users.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Users</p>
              {results.users.map(u => (
                <button
                  key={u.id}
                  onClick={() => navigate(`/u/${u.username}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={u.image || ""} />
                    <AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">u/{u.username || u.name}</p>
                    <p className="text-xs text-muted-foreground">{formatNumber(u.karma)} karma</p>
                  </div>
                  <User className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Full search link */}
          {query.trim() && (
            <div className="p-2 border-t border-border">
              <button
                onClick={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm text-muted-foreground"
              >
                <Search className="w-4 h-4" />
                Search all results for "<strong className="text-foreground">{query}</strong>"
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
