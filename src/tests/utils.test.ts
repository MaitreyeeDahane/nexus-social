import { describe, it, expect } from "vitest"
import {
  formatNumber,
  formatScore,
  slugify,
  truncate,
  getInitials,
  isUrl,
  getDomain,
  generateUsername,
  cn,
} from "@/lib/utils"

describe("formatNumber", () => {
  it("returns number as-is below 1000", () => {
    expect(formatNumber(999)).toBe("999")
    expect(formatNumber(0)).toBe("0")
  })

  it("formats thousands with k suffix", () => {
    expect(formatNumber(1000)).toBe("1.0k")
    expect(formatNumber(1500)).toBe("1.5k")
    expect(formatNumber(10000)).toBe("10.0k")
  })

  it("formats millions with M suffix", () => {
    expect(formatNumber(1000000)).toBe("1.0M")
    expect(formatNumber(2500000)).toBe("2.5M")
  })
})

describe("formatScore", () => {
  it("formats negative scores correctly", () => {
    expect(formatScore(-5)).toBe("-5")
  })

  it("handles zero", () => {
    expect(formatScore(0)).toBe("0")
  })

  it("formats large scores", () => {
    expect(formatScore(5000)).toBe("5.0k")
  })
})

describe("slugify", () => {
  it("converts to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  it("removes special characters", () => {
    expect(slugify("Hello! World?")).toBe("hello-world")
  })

  it("replaces spaces with hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world")
  })

  it("trims hyphens from edges", () => {
    expect(slugify("-hello world-")).toBe("hello-world")
  })
})

describe("truncate", () => {
  it("returns string unchanged if shorter than limit", () => {
    expect(truncate("hello", 10)).toBe("hello")
  })

  it("truncates and adds ellipsis", () => {
    expect(truncate("hello world", 5)).toBe("hello...")
  })

  it("returns unchanged when exactly at limit", () => {
    expect(truncate("hello", 5)).toBe("hello")
  })
})

describe("getInitials", () => {
  it("gets initials from full name", () => {
    expect(getInitials("John Doe")).toBe("JD")
  })

  it("handles single name", () => {
    expect(getInitials("John")).toBe("J")
  })

  it("returns ? for null/undefined", () => {
    expect(getInitials(null)).toBe("?")
    expect(getInitials(undefined)).toBe("?")
  })

  it("limits to 2 characters", () => {
    expect(getInitials("John Michael Doe")).toBe("JM")
  })
})

describe("isUrl", () => {
  it("returns true for valid URLs", () => {
    expect(isUrl("https://example.com")).toBe(true)
    expect(isUrl("http://example.com/path?q=1")).toBe(true)
  })

  it("returns false for invalid URLs", () => {
    expect(isUrl("not-a-url")).toBe(false)
    expect(isUrl("")).toBe(false)
  })
})

describe("getDomain", () => {
  it("extracts domain from URL", () => {
    expect(getDomain("https://www.example.com/path")).toBe("example.com")
    expect(getDomain("https://sub.example.com")).toBe("sub.example.com")
  })

  it("returns original string for invalid URLs", () => {
    expect(getDomain("not-a-url")).toBe("not-a-url")
  })
})

describe("generateUsername", () => {
  it("creates username from email", () => {
    expect(generateUsername("john.doe@example.com")).toBe("john_doe")
  })

  it("limits to 20 characters", () => {
    const result = generateUsername("verylongemailaddress@example.com")
    expect(result.length).toBeLessThanOrEqual(20)
  })

  it("converts to lowercase", () => {
    expect(generateUsername("JohnDoe@example.com")).toBe("johndoe")
  })
})

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz")
  })

  it("merges tailwind classes correctly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4")
  })
})
