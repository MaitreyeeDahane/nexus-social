import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().email("Invalid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be less than 20 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Community schemas
export const createCommunitySchema = z.object({
  name: z
    .string()
    .min(3, "Community name must be at least 3 characters")
    .max(21, "Community name must be less than 21 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  type: z.enum(["PUBLIC", "RESTRICTED", "PRIVATE"]).default("PUBLIC"),
  isNSFW: z.boolean().default(false),
});

export const updateCommunitySchema = z.object({
  description: z.string().max(500).optional(),
  longDescription: z.string().max(10000).optional(),
  avatar: z.string().url().optional().or(z.literal("")),
  banner: z.string().url().optional().or(z.literal("")),
  isNSFW: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  isRestricted: z.boolean().optional(),
});

export const communityRuleSchema = z.object({
  title: z.string().min(1, "Rule title is required").max(100),
  description: z.string().max(500).optional(),
});

// Post schemas
export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(300, "Title must be less than 300 characters"),
  content: z.string().max(40000, "Content must be less than 40,000 characters").optional(),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  type: z.enum(["TEXT", "IMAGE", "LINK", "POLL"]),
  communityId: z.string().min(1, "Community is required"),
  flairId: z.string().optional(),
  isNSFW: z.boolean().default(false),
  isSpoiler: z.boolean().default(false),
  tags: z.array(z.string()).max(5).default([]),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.string().max(40000).optional(),
  isNSFW: z.boolean().optional(),
  isSpoiler: z.boolean().optional(),
  flairId: z.string().optional().nullable(),
});

// Comment schemas
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(10000, "Comment must be less than 10,000 characters"),
  postId: z.string().min(1),
  parentId: z.string().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(10000),
});

// Vote schemas
export const voteSchema = z.object({
  postId: z.string().min(1),
  type: z.enum(["UP", "DOWN"]),
});

export const commentVoteSchema = z.object({
  commentId: z.string().min(1),
  type: z.enum(["UP", "DOWN"]),
});

// Profile schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  bio: z.string().max(300, "Bio must be less than 300 characters").optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  location: z.string().max(50).optional(),
  image: z.string().url().optional().or(z.literal("")),
  coverImage: z.string().url().optional().or(z.literal("")),
});

// Search schema
export const searchSchema = z.object({
  q: z.string().min(1, "Search query is required").max(100),
  type: z.enum(["posts", "communities", "users", "comments"]).default("posts"),
  sort: z.enum(["relevance", "new", "top"]).default("relevance"),
  time: z.enum(["all", "day", "week", "month", "year"]).default("all"),
  page: z.number().int().min(1).default(1),
});

// Report schema
export const reportSchema = z.object({
  type: z.enum(["POST", "COMMENT", "USER", "COMMUNITY"]),
  reason: z.string().min(1, "Reason is required"),
  description: z.string().max(500).optional(),
  targetId: z.string().min(1),
});

// Poll schemas
export const createPollSchema = z.object({
  options: z
    .array(z.object({ text: z.string().min(1, "Option text is required").max(100) }))
    .min(2, "Poll must have at least 2 options")
    .max(6, "Poll can have at most 6 options"),
  endsAt: z.date().optional(),
  allowMultiple: z.boolean().default(false),
});

// Pagination
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
