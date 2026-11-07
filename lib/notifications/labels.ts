import type { NotificationType } from "@/lib/generated/prisma/enums";

export type NotificationTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";

type NotificationPresentation = {
  label: string;
  tone: NotificationTone;
};

export const NOTIFICATION_PRESENTATION: Record<
  NotificationType,
  NotificationPresentation
> = {
  SCHOLARSHIP_PUBLISHED: {
    label: "Scholarship published",
    tone: "success",
  },
  SCHOLARSHIP_DEADLINE: {
    label: "Deadline reminder",
    tone: "warning",
  },
  SCHOLARSHIP_EXPIRED: {
    label: "Scholarship expired",
    tone: "danger",
  },
  TIMETABLE_CHANGED: {
    label: "Timetable change",
    tone: "info",
  },
  ROOM_ASSIGNED: {
    label: "Room assigned",
    tone: "info",
  },
  TIMETABLE_CONFLICT: {
    label: "Timetable conflict",
    tone: "danger",
  },
};
