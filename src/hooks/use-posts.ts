"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { useInView } from "react-intersection-observer"
import { useEffect } from "react"

interface UsePostsOptions {
  sort?: string
  time?: string
  community?: string
  userId?: string
  feed?: string
  limit?: number
}

export function usePosts(options: UsePostsOptions = {}) {
  const { sort = "hot", time = "all", community, userId, feed = "all", limit = 20 } = options
  const { ref, inView } = useInView({ threshold: 0.1 })

  const query = useInfiniteQuery({
    queryKey: ["posts", sort, time, community, userId, feed],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        sort,
        time,
        limit: String(limit),
        ...(community && { community }),
        ...(userId && { userId }),
        ...(feed && { feed }),
        ...(pageParam && { cursor: pageParam as string }),
      })
      const res = await fetch(`/api/posts?${params}`)
      if (!res.ok) throw new Error("Failed to fetch posts")
      return res.json()
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30 * 1000,
  })

  useEffect(() => {
    if (inView && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage()
    }
  }, [inView, query])

  const posts = query.data?.pages.flatMap(page => page.posts) ?? []

  return {
    posts,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    loadMoreRef: ref,
    refetch: query.refetch,
  }
}
