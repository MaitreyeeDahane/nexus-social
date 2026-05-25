"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createPostSchema, updatePostSchema } from "@/lib/validations";
import type { z } from "zod";

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createPost(
  input: z.infer<typeof createPostSchema>
): Promise<ActionResult<{ id: string; communitySlug: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to create a post" };
    }

    const validated = createPostSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const community = await prisma.community.findUnique({
      where: { id: validated.data.communityId },
      include: { settings: true },
    });

    if (!community) {
      return { success: false, error: "Community not found" };
    }

    // Check membership
    const isMember = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: community.id,
        },
      },
    });

    if (community.isPrivate && !isMember) {
      return { success: false, error: "You must join this community to post" };
    }

    const post = await prisma.post.create({
      data: {
        title: validated.data.title,
        content: validated.data.content,
        url: validated.data.url || null,
        imageUrl: validated.data.imageUrl || null,
        type: validated.data.type,
        authorId: session.user.id,
        communityId: community.id,
        flairId: validated.data.flairId || null,
        isNSFW: validated.data.isNSFW,
        isSpoiler: validated.data.isSpoiler,
        tags: validated.data.tags,
      },
    });

    // Update community post count
    await prisma.community.update({
      where: { id: community.id },
      data: { postCount: { increment: 1 } },
    });

    // Update karma
    await prisma.user.update({
      where: { id: session.user.id },
      data: { karma: { increment: 5 } },
    });

    revalidatePath(`/r/${community.slug}`);
    revalidatePath("/");

    return {
      success: true,
      data: { id: post.id, communitySlug: community.slug },
    };
  } catch (error) {
    console.error("Create post error:", error);
    return { success: false, error: "Failed to create post. Please try again." };
  }
}

export async function updatePost(
  postId: string,
  input: z.infer<typeof updatePostSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { community: true },
    });

    if (!post) return { success: false, error: "Post not found" };
    if (post.authorId !== session.user.id && session.user.role === "USER") {
      return { success: false, error: "You can only edit your own posts" };
    }

    const validated = updatePostSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        ...(validated.data.content !== undefined && { content: validated.data.content }),
        ...(validated.data.isNSFW !== undefined && { isNSFW: validated.data.isNSFW }),
        ...(validated.data.isSpoiler !== undefined && { isSpoiler: validated.data.isSpoiler }),
        ...(validated.data.flairId !== undefined && { flairId: validated.data.flairId }),
      },
    });

    revalidatePath(`/r/${post.community.slug}/comments/${postId}`);

    return { success: true, data: { id: postId } };
  } catch (error) {
    console.error("Update post error:", error);
    return { success: false, error: "Failed to update post" };
  }
}

export async function deletePost(postId: string): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { community: true },
    });

    if (!post) return { success: false, error: "Post not found" };

    const isMod = await prisma.communityModerator.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: post.communityId,
        },
      },
    });

    if (
      post.authorId !== session.user.id &&
      !isMod &&
      session.user.role === "USER"
    ) {
      return { success: false, error: "You can only delete your own posts" };
    }

    await prisma.post.update({
      where: { id: postId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await prisma.community.update({
      where: { id: post.communityId },
      data: { postCount: { decrement: 1 } },
    });

    revalidatePath(`/r/${post.community.slug}`);
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Delete post error:", error);
    return { success: false, error: "Failed to delete post" };
  }
}

export async function votePost(
  postId: string,
  voteType: "UP" | "DOWN"
): Promise<ActionResult<{ score: number; userVote: "UP" | "DOWN" | null }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to vote" };
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_postId: { userId: session.user.id, postId },
      },
    });

    let scoreDelta = 0;

    if (existingVote) {
      if (existingVote.type === voteType) {
        // Remove vote
        await prisma.vote.delete({
          where: { id: existingVote.id },
        });
        scoreDelta = voteType === "UP" ? -1 : 1;
      } else {
        // Change vote
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type: voteType },
        });
        scoreDelta = voteType === "UP" ? 2 : -2;
      }
    } else {
      // New vote
      await prisma.vote.create({
        data: { userId: session.user.id, postId, type: voteType },
      });
      scoreDelta = voteType === "UP" ? 1 : -1;
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        score: { increment: scoreDelta },
        ...(voteType === "UP" && scoreDelta > 0 && { upvotes: { increment: 1 } }),
        ...(voteType === "DOWN" && scoreDelta < 0 && { downvotes: { increment: 1 } }),
        ...(voteType === "UP" && scoreDelta < 0 && { upvotes: { decrement: 1 } }),
        ...(voteType === "DOWN" && scoreDelta > 0 && { downvotes: { decrement: 1 } }),
      },
      select: { score: true, authorId: true },
    });

    // Update author karma
    if (voteType === "UP" && scoreDelta > 0) {
      await prisma.user.update({
        where: { id: updatedPost.authorId },
        data: { karma: { increment: 1 } },
      });
    }

    const finalVote = existingVote?.type === voteType ? null : voteType;

    return {
      success: true,
      data: { score: updatedPost.score, userVote: finalVote },
    };
  } catch (error) {
    console.error("Vote error:", error);
    return { success: false, error: "Failed to process vote" };
  }
}

export async function toggleBookmark(
  postId: string
): Promise<ActionResult<{ bookmarked: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const existing = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId: session.user.id, postId } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return { success: true, data: { bookmarked: false } };
    } else {
      await prisma.bookmark.create({
        data: { userId: session.user.id, postId },
      });
      return { success: true, data: { bookmarked: true } };
    }
  } catch (error) {
    console.error("Bookmark error:", error);
    return { success: false, error: "Failed to toggle bookmark" };
  }
}
