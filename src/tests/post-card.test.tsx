import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PostCard } from "@/components/posts/post-card"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const mockPost = {
  id: "post-1",
  title: "Test Post Title",
  content: "This is test content",
  type: "TEXT",
  score: 42,
  commentCount: 5,
  viewCount: 100,
  isNSFW: false,
  isSpoiler: false,
  isPinned: false,
  createdAt: new Date("2024-01-01").toISOString(),
  userVote: null,
  isBookmarked: false,
  author: {
    id: "user-1",
    name: "Test User",
    username: "testuser",
    image: null,
    isVerified: false,
  },
  community: {
    id: "community-1",
    name: "programming",
    slug: "programming",
    avatar: null,
    memberCount: 1000,
  },
  flair: null,
}

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("PostCard", () => {
  it("renders post title", () => {
    render(<PostCard post={mockPost} />, { wrapper: createWrapper() })
    expect(screen.getByText("Test Post Title")).toBeDefined()
  })

  it("renders community name", () => {
    render(<PostCard post={mockPost} />, { wrapper: createWrapper() })
    expect(screen.getByText("r/programming")).toBeDefined()
  })

  it("renders author username", () => {
    render(<PostCard post={mockPost} />, { wrapper: createWrapper() })
    expect(screen.getByText("u/testuser")).toBeDefined()
  })

  it("renders vote score", () => {
    render(<PostCard post={mockPost} />, { wrapper: createWrapper() })
    expect(screen.getByText("42")).toBeDefined()
  })

  it("renders comment count", () => {
    render(<PostCard post={mockPost} />, { wrapper: createWrapper() })
    expect(screen.getByText(/5 Comments/)).toBeDefined()
  })

  it("shows NSFW badge when post is NSFW", () => {
    const nsfwPost = { ...mockPost, isNSFW: true }
    render(<PostCard post={nsfwPost} />, { wrapper: createWrapper() })
    expect(screen.getByText("NSFW")).toBeDefined()
  })

  it("shows spoiler badge when post is spoiler", () => {
    const spoilerPost = { ...mockPost, isSpoiler: true }
    render(<PostCard post={spoilerPost} />, { wrapper: createWrapper() })
    expect(screen.getByText("SPOILER")).toBeDefined()
  })

  it("hides community name when showCommunity is false", () => {
    render(<PostCard post={mockPost} showCommunity={false} />, { wrapper: createWrapper() })
    expect(screen.queryByText("r/programming")).toBeNull()
  })

  it("shows pinned indicator for pinned posts", () => {
    const pinnedPost = { ...mockPost, isPinned: true }
    render(<PostCard post={pinnedPost} />, { wrapper: createWrapper() })
    expect(screen.getByText("Pinned")).toBeDefined()
  })
})
