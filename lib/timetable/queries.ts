import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

import type { TimetableDay } from "./rules";

const entrySelect = {
  id: true,
  dayOfWeek: true,
  startMinute: true,
  endMinute: true,
  course: {
    select: {
      id: true,
      code: true,
      title: true,
    },
  },
  batch: {
    select: {
      id: true,
      name: true,
      section: true,
    },
  },
  teacher: {
    select: {
      id: true,
      name: true,
    },
  },
  room: {
    select: {
      id: true,
      roomNumber: true,
      building: true,
    },
  },
} satisfies Prisma.TimetableEntrySelect;

export type TimetableEntryRow = Prisma.TimetableEntryGetPayload<{
  select: typeof entrySelect;
}>;

export async function getCourses(departmentId: string) {
  return prisma.course.findMany({
    where: { departmentId },
    select: {
      id: true,
      code: true,
      title: true,
      updatedAt: true,
      _count: { select: { entries: true } },
    },
    orderBy: [{ code: "asc" }, { id: "asc" }],
  });
}

export async function getTeachers(departmentId: string) {
  return prisma.teacher.findMany({
    where: { departmentId },
    select: {
      id: true,
      name: true,
      email: true,
      updatedAt: true,
      _count: { select: { entries: true } },
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

export async function getBatches(departmentId: string) {
  return prisma.batch.findMany({
    where: { departmentId },
    select: {
      id: true,
      name: true,
      section: true,
      updatedAt: true,
      _count: { select: { entries: true, students: true } },
    },
    orderBy: [{ name: "asc" }, { section: "asc" }, { id: "asc" }],
  });
}

export async function getRooms(departmentId: string) {
  return prisma.room.findMany({
    where: { departmentId },
    select: {
      id: true,
      roomNumber: true,
      building: true,
      updatedAt: true,
      _count: { select: { entries: true } },
    },
    orderBy: [{ roomNumber: "asc" }, { id: "asc" }],
  });
}

export async function getReferenceData(departmentId: string) {
  const [courses, teachers, batches, rooms] = await Promise.all([
    getCourses(departmentId),
    getTeachers(departmentId),
    getBatches(departmentId),
    getRooms(departmentId),
  ]);

  return { courses, teachers, batches, rooms };
}

export async function getTimetableEntries({
  departmentId,
  batchId,
  teacherId,
  dayOfWeek,
  q,
}: {
  departmentId: string;
  batchId?: string;
  teacherId?: string;
  dayOfWeek?: TimetableDay;
  q?: string;
}) {
  return prisma.timetableEntry.findMany({
    where: {
      course: { departmentId },
      ...(batchId ? { batchId } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...(dayOfWeek ? { dayOfWeek } : {}),
      ...(q
        ? {
            OR: [
              { course: { code: { contains: q, mode: "insensitive" } } },
              { course: { title: { contains: q, mode: "insensitive" } } },
              { teacher: { name: { contains: q, mode: "insensitive" } } },
              {
                room: { roomNumber: { contains: q, mode: "insensitive" } },
              },
            ],
          }
        : {}),
    },
    select: entrySelect,
    orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }, { id: "asc" }],
  });
}

export async function getStudentTimetableEntries(batchId: string) {
  return prisma.timetableEntry.findMany({
    where: { batchId },
    select: entrySelect,
    orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }, { id: "asc" }],
  });
}

export async function getTimetableStats(
  departmentId: string,
  todayDay: TimetableDay,
) {
  const scope = { course: { departmentId } };

  const [total, today, batches, teachers, rooms] = await Promise.all([
    prisma.timetableEntry.count({ where: scope }),
    prisma.timetableEntry.count({
      where: { ...scope, dayOfWeek: todayDay },
    }),
    prisma.timetableEntry.findMany({
      where: scope,
      distinct: ["batchId"],
      select: { batchId: true },
    }),
    prisma.timetableEntry.findMany({
      where: scope,
      distinct: ["teacherId"],
      select: { teacherId: true },
    }),
    prisma.room.count({ where: { departmentId } }),
  ]);

  return {
    totalClasses: total,
    todayClasses: today,
    batchesScheduled: batches.length,
    teachersScheduled: teachers.length,
    totalRooms: rooms,
  };
}

export async function getRoomsWithTodaySchedule(
  departmentId: string,
  todayDay: TimetableDay,
) {
  return prisma.room.findMany({
    where: { departmentId },
    select: {
      id: true,
      roomNumber: true,
      building: true,
      updatedAt: true,
      entries: {
        where: { dayOfWeek: todayDay },
        select: {
          id: true,
          startMinute: true,
          endMinute: true,
          course: { select: { code: true } },
          batch: { select: { name: true, section: true } },
        },
        orderBy: [{ startMinute: "asc" }, { id: "asc" }],
      },
      _count: { select: { entries: true } },
    },
    orderBy: [{ roomNumber: "asc" }, { id: "asc" }],
  });
}

export async function getTimetableEntryById(id: string, departmentId: string) {
  return prisma.timetableEntry.findFirst({
    where: {
      id,
      course: { departmentId },
    },
    select: {
      ...entrySelect,
      courseId: true,
      batchId: true,
      teacherId: true,
      roomId: true,
    },
  });
}

export async function getCourseInDepartment(id: string, departmentId: string) {
  return prisma.course.findFirst({
    where: { id, departmentId },
    select: { id: true, code: true, title: true, departmentId: true },
  });
}

export async function getTeacherInDepartment(id: string, departmentId: string) {
  return prisma.teacher.findFirst({
    where: { id, departmentId },
    select: { id: true, name: true, departmentId: true },
  });
}

export async function getBatchInDepartment(id: string, departmentId: string) {
  return prisma.batch.findFirst({
    where: { id, departmentId },
    select: {
      id: true,
      name: true,
      section: true,
      departmentId: true,
    },
  });
}

export async function getRoomInDepartment(id: string, departmentId: string) {
  return prisma.room.findFirst({
    where: { id, departmentId },
    select: {
      id: true,
      roomNumber: true,
      building: true,
      departmentId: true,
    },
  });
}

export type TimetableConflict = {
  type: "teacher" | "batch" | "room";
  entry: TimetableEntryRow;
};

const conflictSelect = entrySelect;

/**
 * Finds every existing entry that overlaps the requested interval for the
 * same teacher, batch, or room. The edited entry is excluded on update.
 */
export async function findTimetableConflicts({
  dayOfWeek,
  startMinute,
  endMinute,
  teacherId,
  batchId,
  roomId,
  excludeEntryId,
}: {
  dayOfWeek: TimetableDay;
  startMinute: number;
  endMinute: number;
  teacherId: string;
  batchId: string;
  roomId?: string;
  excludeEntryId?: string;
}): Promise<TimetableConflict[]> {
  const overlap = {
    dayOfWeek,
    startMinute: { lt: endMinute },
    endMinute: { gt: startMinute },
    ...(excludeEntryId ? { id: { not: excludeEntryId } } : {}),
  };

  const [teacherConflicts, batchConflicts, roomConflicts] = await Promise.all([
    prisma.timetableEntry.findMany({
      where: { ...overlap, teacherId },
      select: conflictSelect,
      orderBy: [{ startMinute: "asc" }, { id: "asc" }],
    }),
    prisma.timetableEntry.findMany({
      where: { ...overlap, batchId },
      select: conflictSelect,
      orderBy: [{ startMinute: "asc" }, { id: "asc" }],
    }),
    roomId
      ? prisma.timetableEntry.findMany({
          where: { ...overlap, roomId },
          select: conflictSelect,
          orderBy: [{ startMinute: "asc" }, { id: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  return [
    ...teacherConflicts.map((entry) => ({
      type: "teacher" as const,
      entry,
    })),
    ...batchConflicts.map((entry) => ({
      type: "batch" as const,
      entry,
    })),
    ...roomConflicts.map((entry) => ({
      type: "room" as const,
      entry,
    })),
  ];
}

/**
 * Returns the first free department room in ascending room-number order, or
 * null when every room is occupied during the requested interval.
 */
export async function findFreeRoom({
  departmentId,
  dayOfWeek,
  startMinute,
  endMinute,
  excludeEntryId,
}: {
  departmentId: string;
  dayOfWeek: TimetableDay;
  startMinute: number;
  endMinute: number;
  excludeEntryId?: string;
}) {
  const overlap = {
    dayOfWeek,
    startMinute: { lt: endMinute },
    endMinute: { gt: startMinute },
    ...(excludeEntryId ? { id: { not: excludeEntryId } } : {}),
  };

  const [rooms, occupied] = await Promise.all([
    prisma.room.findMany({
      where: { departmentId },
      select: { id: true, roomNumber: true, building: true },
      orderBy: [{ roomNumber: "asc" }, { id: "asc" }],
    }),
    prisma.timetableEntry.findMany({
      where: {
        ...overlap,
        room: { departmentId },
      },
      select: { roomId: true },
    }),
  ]);

  const occupiedRoomIds = new Set(occupied.map((entry) => entry.roomId));

  return rooms.find((room) => !occupiedRoomIds.has(room.id)) ?? null;
}
