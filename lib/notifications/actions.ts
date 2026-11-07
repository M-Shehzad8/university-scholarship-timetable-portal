"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { notificationIdSchema } from "@/lib/validation/notifications";

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function revalidateNotificationSurfaces() {
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  // The unread count lives in the portal navigation, which is part of the root
  // layout. Revalidating the layout keeps the badge accurate after an action.
  revalidatePath("/", "layout");
}

export async function markNotificationReadAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const parsed = notificationIdSchema.safeParse({
    notificationId: formValue(formData, "notificationId"),
  });

  if (!parsed.success) {
    return;
  }

  await prisma.notification.updateMany({
    where: {
      id: parsed.data.notificationId,
      userId: user.id,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  revalidateNotificationSurfaces();
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requireUser();

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  revalidateNotificationSurfaces();
}
