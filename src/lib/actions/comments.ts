"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createCommentSchema, updateCommentSchema } from "@/lib/validations";
import type { ActionResult } from "./posts";

export async function createComment(
  input: { content: string; postId: string; parentId?: string }
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to comment" };
    }

    const validated = createCommentSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const post = await prisma.post.findUnique({
      where: { id: validated.data.postId, isDeleted: false },
      include: { community: true },
    });

    if (!post) return { success: false, error: "Post not found" };
    if (post.isLocked) return { success: false, error: "This post is locked" };

    let depth = 0;
    if (validated.data.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: validated.data.parentId },
        select: { depth: true },
      });
      depth = (parent?.depth ?? 0) + 1;
    }

    const comment = await prisma.comment.create({
      data: {
        content: validated.data.content,
        authorId: session.user.id,
        postId: validated.data.postId,
        parentId: validated.data.parentId || null,
        depth,
      },
    });

    // Update post comment count
    await prisma.post.update({
      where: { id: validated.data.postId },
      data: { commentCount: { increment: 1 } },
    });

    // Update karma
    await prisma.user.update({
      where: { id: session.user.id },
      data: { karma: { increment: 1 } },
    });

    // Send notification to post author (or parent comment author)
    const recipientId = validated.data.parentId
      ? (await prisma.comment.findUnique({
          where: { id: validated.data.parentId },
          select: { authorId: true },
        }))?.authorId
      : post.authorId;

    if (recipientId && recipientId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: validated.data.parentId ? "REPLY" : "COMMENT",
          recipientId,
          senderId: session.user.id,
          postId: post.id,
          commentId: comment.id,
          message: validated.data.parentId
            ? `${session.user.username || session.user.name} replied to your comment`
            : `${session.user.username || session.user.name} commented on your post`,
        },
      });
    }

    revalidatePath(`/r/${post.community.slug}/comments/${post.id}`);

    return { success: true, data: { id: comment.id } };
  } catch (error) {
    console.error("Create comment error:", error);
    return { success: false, error: "Failed to create comment" };
  }
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validated = updateCommentSchema.safeParse({ content });
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: { include: { community: true } } },
    });

    if (!comment) return { success: false, error: "Comment not found" };
    if (comment.authorId !== session.user.id && session.user.role === "USER") {
      return { success: false, error: "You can only edit your own comments" };
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { content: validated.data.content },
    });

    revalidatePath(`/r/${comment.post.community.slug}/comments/${comment.postId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Update comment error:", error);
    return { success: false, error: "Failed to update comment" };
  }
}

export async function deleteComment(commentId: string): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: { include: { community: true } } },
    });

    if (!comment) return { success: false, error: "Comment not found" };

    const isMod = await prisma.communityModerator.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: comment.post.communityId,
        },
      },
    });

    if (
      comment.authorId !== session.user.id &&
      !isMod &&
      session.user.role === "USER"
    ) {
      return { success: false, error: "You can only delete your own comments" };
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true, deletedAt: new Date(), content: "[deleted]" },
    });

    await prisma.post.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 } },
    });

    revalidatePath(`/r/${comment.post.community.slug}/comments/${comment.postId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Delete comment error:", error);
    return { success: false, error: "Failed to delete comment" };
  }
}

export async function voteComment(
  commentId: string,
  voteType: "UP" | "DOWN"
): Promise<ActionResult<{ score: number; userVote: "UP" | "DOWN" | null }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to vote" };
    }

    const existingVote = await prisma.commentVote.findUnique({
      where: { userId_commentId: { userId: session.user.id, commentId } },
    });

    let scoreDelta = 0;

    if (existingVote) {
      if (existingVote.type === voteType) {
        await prisma.commentVote.delete({ where: { id: existingVote.id } });
        scoreDelta = voteType === "UP" ? -1 : 1;
      } else {
        await prisma.commentVote.update({
          where: { id: existingVote.id },
          data: { type: voteType },
        });
        scoreDelta = voteType === "UP" ? 2 : -2;
      }
    } else {
      await prisma.commentVote.create({
        data: { userId: session.user.id, commentId, type: voteType },
      });
      scoreDelta = voteType === "UP" ? 1 : -1;
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { score: { increment: scoreDelta } },
      select: { score: true },
    });

    const finalVote = existingVote?.type === voteType ? null : voteType;

    return {
      success: true,
      data: { score: updated.score, userVote: finalVote },
    };
  } catch (error) {
    console.error("Comment vote error:", error);
    return { success: false, error: "Failed to vote" };
  }
}
