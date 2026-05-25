import { Suspense } from "react"
import { prisma } from "@/lib/db"
import { CommunitiesGrid } from "@/components/communities/communities-grid"
import { Skeleton } from "@/components/ui/skeleton"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Communities",
  description: "Explore all communities on Nexus Social. Find your people.",
  openGraph: {
    title: "Communities – Nexus Social",
    description: "Discover and join communities on Nexus Social.",
  },
}

interface PageProps {
  searchParams: Promise<{ q?: string; sort?: string }>
}

export default async function CommunitiesPage({ searchParams }: PageProps) {
  const { q, sort = "members" } = await searchParams

  let communities: Awaited<ReturnType<typeof fetchCommunities>> = []
  try {
    communities = await fetchCommunities(q, sort)
  } catch (error) {
    console.error("Failed to fetch communities:", error)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Communities</h1>
        <p className="text-muted-foreground">Discover places for your interests and passions</p>
      </div>
      <Suspense fallback={<CommunitiesLoadingSkeleton />}>
        <CommunitiesGrid communities={communities} initialQuery={q} />
      </Suspense>
    </div>
  )
}

async function fetchCommunities(q?: string, sort = "members") {
  return prisma.community.findMany({
    where: {
      deletedAt: null,
      isPrivate: false,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    orderBy:
      sort === "new"
        ? { createdAt: "desc" }
        : sort === "posts"
        ? { postCount: "desc" }
        : { memberCount: "desc" },
    take: 60,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      avatar: true,
      memberCount: true,
      postCount: true,
      isNSFW: true,
    },
  })
}

function CommunitiesLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-xl" />
      ))}
    </div>
  )
}
