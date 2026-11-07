import { prisma } from "@/lib/db/prisma";

import {
  formatEntrySlot,
  type TimetableDay,
} from "@/lib/timetable/rules";

export type TimetableChangeAction = "created" | "updated" | "deleted";

export type TimetableChangeNotification = {
  batchIds: string[];
  action: TimetableChangeAction;
  courseCode: string;
  courseTitle: string;
  batchLabel?: string;
  dayOfWeek: TimetableDay;
  startMinute: number;
  endMinute: number;
  roomNumber: string;
};

function buildTitle(action: TimetableChangeAction, courseCode: string): string {
  if (action === "created") {
    return `New class: ${courseCode}`;
  }

  if (action === "deleted") {
    return `Class removed: ${courseCode}`;
  }

  return `Class updated: ${courseCode}`;
}

function buildMessage(change: TimetableChangeNotification): string {
  const slot = formatEntrySlot(
    change.dayOfWeek,
    change.startMinute,
    change.endMinute,
  );
  const room = change.roomNumber ? `Room ${change.roomNumber}` : "a room";

  if (change.action === "created") {
    const batch = change.batchLabel ? ` for ${change.batchLabel}` : "";
    return `${change.courseTitle} (${change.courseCode})${batch} is now scheduled on ${slot} in ${room}.`;
  }

  if (change.action === "deleted") {
    return `${change.courseTitle} (${change.courseCode}) was removed from the timetable. It had been scheduled on ${slot} in ${room}.`;
  }

  return `${change.courseTitle} (${change.courseCode}) changed to ${slot} in ${room}. Open the timetable for the latest batch details.`;
}

/**
 * Notifies active students linked to the affected batches. Callers treat this
 * as best-effort: a notification failure must never undo a timetable change.
 */
export async function notifyStudentsOfTimetableChange(
  change: TimetableChangeNotification,
): Promise<number> {
  const batchIds = [...new Set(change.batchIds.filter(Boolean))];

  if (batchIds.length === 0) {
    return 0;
  }

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      isActive: true,
      batchId: { in: batchIds },
    },
    select: { id: true },
  });

  if (students.length === 0) {
    return 0;
  }

  const title = buildTitle(change.action, change.courseCode);
  const message = buildMessage(change);

  const result = await prisma.notification.createMany({
    data: students.map((student) => ({
      userId: student.id,
      type: "TIMETABLE_CHANGED",
      title,
      message,
    })),
  });

  return result.count;
}
