import { describe, it, expect } from "vitest"
import {
  loginSchema,
  registerSchema,
  createCommunitySchema,
  createPostSchema,
  createCommentSchema,
} from "@/lib/validations"

describe("loginSchema", () => {
  it("validates correct login data", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "Password1" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "Password1" })
    expect(result.success).toBe(false)
  })

  it("rejects short password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "short" })
    expect(result.success).toBe(false)
  })
})

describe("registerSchema", () => {
  const validData = {
    name: "John Doe",
    email: "john@example.com",
    username: "johndoe",
    password: "SecurePass1",
    confirmPassword: "SecurePass1",
  }

  it("validates correct registration data", () => {
    expect(registerSchema.safeParse(validData).success).toBe(true)
  })

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({ ...validData, confirmPassword: "different" })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toBe("Passwords do not match")
  })

  it("rejects username with special characters", () => {
    const result = registerSchema.safeParse({ ...validData, username: "john doe!" })
    expect(result.success).toBe(false)
  })

  it("rejects short username", () => {
    const result = registerSchema.safeParse({ ...validData, username: "ab" })
    expect(result.success).toBe(false)
  })

  it("rejects password without uppercase", () => {
    const result = registerSchema.safeParse({ ...validData, password: "securepass1", confirmPassword: "securepass1" })
    expect(result.success).toBe(false)
  })

  it("rejects password without number", () => {
    const result = registerSchema.safeParse({ ...validData, password: "SecurePassword", confirmPassword: "SecurePassword" })
    expect(result.success).toBe(false)
  })
})

describe("createCommunitySchema", () => {
  it("validates correct community data", () => {
    const result = createCommunitySchema.safeParse({ name: "mycommunity", type: "PUBLIC", isNSFW: false })
    expect(result.success).toBe(true)
  })

  it("rejects name with spaces", () => {
    const result = createCommunitySchema.safeParse({ name: "my community" })
    expect(result.success).toBe(false)
  })

  it("rejects short name", () => {
    const result = createCommunitySchema.safeParse({ name: "ab" })
    expect(result.success).toBe(false)
  })

  it("rejects name over 21 characters", () => {
    const result = createCommunitySchema.safeParse({ name: "a".repeat(22) })
    expect(result.success).toBe(false)
  })
})

describe("createPostSchema", () => {
  const validPost = {
    title: "My Post Title",
    type: "TEXT" as const,
    communityId: "community-id",
    isNSFW: false,
    isSpoiler: false,
    tags: [],
  }

  it("validates correct text post", () => {
    expect(createPostSchema.safeParse(validPost).success).toBe(true)
  })

  it("rejects empty title", () => {
    const result = createPostSchema.safeParse({ ...validPost, title: "" })
    expect(result.success).toBe(false)
  })

  it("rejects title over 300 characters", () => {
    const result = createPostSchema.safeParse({ ...validPost, title: "a".repeat(301) })
    expect(result.success).toBe(false)
  })

  it("rejects link post with invalid URL", () => {
    const result = createPostSchema.safeParse({ ...validPost, type: "LINK", url: "not-a-url" })
    expect(result.success).toBe(false)
  })

  it("validates link post with valid URL", () => {
    const result = createPostSchema.safeParse({ ...validPost, type: "LINK", url: "https://example.com" })
    expect(result.success).toBe(true)
  })
})

describe("createCommentSchema", () => {
  it("validates correct comment", () => {
    const result = createCommentSchema.safeParse({ content: "Great post!", postId: "post-id" })
    expect(result.success).toBe(true)
  })

  it("rejects empty comment", () => {
    const result = createCommentSchema.safeParse({ content: "", postId: "post-id" })
    expect(result.success).toBe(false)
  })

  it("rejects comment over 10000 characters", () => {
    const result = createCommentSchema.safeParse({ content: "a".repeat(10001), postId: "post-id" })
    expect(result.success).toBe(false)
  })

  it("accepts optional parentId for replies", () => {
    const result = createCommentSchema.safeParse({ content: "Reply!", postId: "post-id", parentId: "parent-id" })
    expect(result.success).toBe(true)
  })
})
