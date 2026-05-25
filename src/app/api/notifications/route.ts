import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const cursor = searchParams.get("cursor");

    const notifications = await prisma.notification.findMany({
      where: { recipientId: session.user.id },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    const unreadCount = await prisma.notification.count({
      where: { recipientId: session.user.id, isRead: false },
    });

    const hasMore = notifications.length > limit;
    const data = notifications.slice(0, limit);

    return NextResponse.json({
      notifications: data,
      unreadCount,
      hasMore,
      nextCursor: hasMore ? data[data.length - 1]?.id : null,
    });
  } catch (error) {
    console.error("Notifications API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: { recipientId: session.user.id, isRead: false },
        data: { isRead: true },
      });
    } else if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId, recipientId: session.user.id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
