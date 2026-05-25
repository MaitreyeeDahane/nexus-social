import { Suspense } from "react"
import { SearchResults } from "@/components/search/search-results"
import type { Metadata } from "next"

interface PageProps {
  searchParams: Promise<{ q?: string; type?: string; sort?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams
  return { title: q ? `Search: ${q}` : "Search" }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q, type = "posts", sort = "relevance" } = await searchParams
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Suspense fallback={<div className="text-muted-foreground text-sm p-4">Searching...</div>}>
        <SearchResults query={q || ""} type={type} sort={sort} />
      </Suspense>
    </div>
  )
}
