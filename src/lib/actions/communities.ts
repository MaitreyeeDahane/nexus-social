"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createCommunitySchema, updateCommunitySchema } from "@/lib/validations";
import type { ActionResult } from "./posts";

export async function createCommunity(
  input: { name: string; description?: string; type?: string; isNSFW?: boolean }
): Promise<ActionResult<{ slug: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to create a community" };
    }

    const validated = createCommunitySchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const existing = await prisma.community.findUnique({
      where: { name: validated.data.name },
    });

    if (existing) {
      return { success: false, error: "A community with this name already exists" };
    }

    const community = await prisma.community.create({
      data: {
        name: validated.data.name,
        slug: validated.data.name.toLowerCase(),
        description: validated.data.description,
        type: validated.data.type as "PUBLIC" | "RESTRICTED" | "PRIVATE",
        isNSFW: validated.data.isNSFW,
        creatorId: session.user.id,
        memberCount: 1,
        settings: { create: {} },
        members: {
          create: { userId: session.user.id },
        },
        moderators: {
          create: { userId: session.user.id, permissions: ["ALL"] },
        },
      },
    });

    // Update user karma
    await prisma.user.update({
      where: { id: session.user.id },
      data: { karma: { increment: 10 } },
    });

    revalidatePath("/communities");
    revalidatePath("/");

    return { success: true, data: { slug: community.slug } };
  } catch (error) {
    console.error("Create community error:", error);
    return { success: false, error: "Failed to create community. Please try again." };
  }
}

export async function joinCommunity(
  communityId: string
): Promise<ActionResult<{ joined: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to join communities" };
    }

    const existing = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: { userId: session.user.id, communityId },
      },
    });

    if (existing) {
      // Leave community
      await prisma.communityMember.delete({ where: { id: existing.id } });
      await prisma.community.update({
        where: { id: communityId },
        data: { memberCount: { decrement: 1 } },
      });
      revalidatePath("/");
      return { success: true, data: { joined: false } };
    } else {
      // Join community
      await prisma.communityMember.create({
        data: { userId: session.user.id, communityId },
      });
      await prisma.community.update({
        where: { id: communityId },
        data: { memberCount: { increment: 1 } },
      });
      revalidatePath("/");
      return { success: true, data: { joined: true } };
    }
  } catch (error) {
    console.error("Join community error:", error);
    return { success: false, error: "Failed to update membership" };
  }
}

export async function updateCommunity(
  communityId: string,
  input: { description?: string; longDescription?: string; avatar?: string; banner?: string; isNSFW?: boolean }
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const isMod = await prisma.communityModerator.findUnique({
      where: {
        userId_communityId: { userId: session.user.id, communityId },
      },
    });

    if (!isMod && session.user.role === "USER") {
      return { success: false, error: "Only moderators can update community settings" };
    }

    const validated = updateCommunitySchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const community = await prisma.community.update({
      where: { id: communityId },
      data: {
        ...(validated.data.description !== undefined && { description: validated.data.description }),
        ...(validated.data.longDescription !== undefined && { longDescription: validated.data.longDescription }),
        ...(validated.data.avatar !== undefined && { avatar: validated.data.avatar || null }),
        ...(validated.data.banner !== undefined && { banner: validated.data.banner || null }),
        ...(validated.data.isNSFW !== undefined && { isNSFW: validated.data.isNSFW }),
      },
    });

    revalidatePath(`/r/${community.slug}`);
    revalidatePath(`/r/${community.slug}/settings`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Update community error:", error);
    return { success: false, error: "Failed to update community" };
  }
}

export async function addCommunityRule(
  communityId: string,
  rule: { title: string; description?: string }
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const isMod = await prisma.communityModerator.findUnique({
      where: { userId_communityId: { userId: session.user.id, communityId } },
    });

    if (!isMod && session.user.role === "USER") {
      return { success: false, error: "Only moderators can manage rules" };
    }

    const ruleCount = await prisma.communityRule.count({ where: { communityId } });

    await prisma.communityRule.create({
      data: {
        communityId,
        title: rule.title,
        description: rule.description,
        order: ruleCount,
      },
    });

    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (community) revalidatePath(`/r/${community.slug}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Add rule error:", error);
    return { success: false, error: "Failed to add rule" };
  }
}
