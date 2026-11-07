import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

import type { NotificationView } from "./types";

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  isRead: true,
  readAt: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

export type NotificationRow = Prisma.NotificationGetPayload<{
  select: typeof notificationSelect;
}>;

export async function getNotifications(
  userId: string,
  view: NotificationView = "all",
) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(view === "unread" ? { isRead: false } : {}),
    },
    select: notificationSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function getNotificationSummary(userId: string) {
  const [total, unread] = await Promise.all([
    prisma.notification.count({ where: { userId } }),
    getUnreadNotificationCount(userId),
  ]);

  return { total, unread, read: total - unread };
}

export async function getRecentNotifications(userId: string, take = 5) {
  return prisma.notification.findMany({
    where: { userId },
    select: notificationSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
  });
}
