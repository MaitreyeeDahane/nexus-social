import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDate(date: Date | string, fmt = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, fmt);
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toString();
}

export function formatScore(score: number): string {
  if (score >= 1_000_000) return `${(score / 1_000_000).toFixed(1)}M`;
  if (score >= 1_000) return `${(score / 1_000).toFixed(1)}k`;
  return score.toString();
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + "...";
}

export function generateUsername(email: string): string {
  return email
    .split("@")[0]
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase()
    .slice(0, 20);
}

export function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export function calculateKarma(posts: number, comments: number, votes: number): number {
  return posts * 10 + comments * 2 + votes;
}

export function getVoteColor(score: number): string {
  if (score > 100) return "text-orange-500";
  if (score > 10) return "text-orange-400";
  if (score < 0) return "text-blue-500";
  return "text-muted-foreground";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseSearchParams(searchParams: URLSearchParams | Record<string, string | string[] | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  if (searchParams instanceof URLSearchParams) {
    searchParams.forEach((value, key) => {
      result[key] = value;
    });
  } else {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (typeof value === "string") result[key] = value;
      else if (Array.isArray(value) && value[0]) result[key] = value[0];
    });
  }
  return result;
}

export function buildSearchParams(params: Record<string, string | number | boolean | undefined>): string {
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      urlParams.set(key, String(value));
    }
  });
  return urlParams.toString();
}

// Color utils for community avatars
const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-green-500 to-emerald-600",
  "from-orange-500 to-red-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
  "from-teal-500 to-green-600",
  "from-amber-500 to-orange-600",
];

export function getCommunityColor(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function getUserColor(username: string): string {
  const index = username.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
