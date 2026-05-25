import type { PostType, VoteType, UserRole, CommunityType, NotificationType } from "@prisma/client"

export interface PostAuthor {
  id: string
  name: string | null
  username: string | null
  image: string | null
  karma: number
  isVerified: boolean
  createdAt?: Date | string
}

export interface PostCommunity {
  id: string
  name: string
  slug: string
  avatar: string | null
  memberCount: number
  banner?: string | null
  description?: string | null
  rules?: CommunityRule[]
}

export interface PostFlair {
  id: string
  name: string
  color: string
  textColor: string
}

export interface CommunityRule {
  id: string
  title: string
  description: string | null
  order: number
}

export interface PostListItem {
  id: string
  title: string
  content: string | null
  url: string | null
  imageUrl: string | null
  type: PostType | string
  score: number
  upvotes: number
  downvotes: number
  commentCount: number
  viewCount: number
  isNSFW: boolean
  isSpoiler: boolean
  isPinned: boolean
  isLocked: boolean
  createdAt: string | Date
  updatedAt: string | Date
  userVote: VoteType | string | null
  isBookmarked: boolean
  author: PostAuthor
  community: PostCommunity
  flair: PostFlair | null
  tags: string[]
  poll?: PollData | null
}

export interface PollData {
  id: string
  question: string | null
  endsAt: string | Date | null
  totalVotes: number
  allowMultiple: boolean
  options: PollOption[]
}

export interface PollOption {
  id: string
  text: string
  voteCount: number
  votes?: unknown[]
  _count?: { votes: number }
}

export interface CommentData {
  id: string
  content: string
  score: number
  depth: number
  isDeleted: boolean
  isPinned: boolean
  createdAt: string | Date
  updatedAt: string | Date
  author: PostAuthor
  replies?: CommentData[]
  votes?: Array<{ type: VoteType }>
  _count?: { replies: number }
}

export interface NotificationData {
  id: string
  type: NotificationType | string
  message: string
  isRead: boolean
  createdAt: string | Date
  postId?: string | null
  commentId?: string | null
  communityId?: string | null
  sender?: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  } | null
}

export interface CommunityData {
  id: string
  name: string
  slug: string
  description: string | null
  longDescription: string | null
  avatar: string | null
  banner: string | null
  isPrivate: boolean
  isRestricted: boolean
  isNSFW: boolean
  memberCount: number
  postCount: number
  type: CommunityType | string
  createdAt: string | Date
  rules: CommunityRule[]
  moderators: Array<{
    user: {
      id: string
      name: string | null
      username: string | null
      image: string | null
    }
  }>
  settings: CommunitySettings | null
  _count: { members: number; posts: number }
}

export interface CommunitySettings {
  allowImagePosts: boolean
  allowLinkPosts: boolean
  allowPollPosts: boolean
  requireFlair: boolean
  approvalRequired: boolean
  allowCrossPosting: boolean
  minAccountAge: number
  minKarmaRequired: number
}

export interface UserProfile {
  id: string
  name: string | null
  username: string | null
  bio: string | null
  image: string | null
  coverImage: string | null
  karma: number
  website: string | null
  location: string | null
  isVerified: boolean
  role: UserRole | string
  createdAt: Date | string
  achievements: Array<{
    achievement: { name: string; icon: string; description: string }
    earnedAt: Date | string
  }>
  _count: {
    posts: number
    comments: number
    followers: number
    following: number
  }
}

export type SortOption = "hot" | "new" | "top" | "rising"
export type TimeFilter = "all" | "day" | "week" | "month" | "year"
export type SearchType = "posts" | "communities" | "users" | "comments" | "all"
