import { prisma } from "@/lib/db/prisma";
import { getRecentNotifications } from "@/lib/notifications/queries";
import {
  getClosingSoonScholarships,
  getStaffScholarshipStats,
  getStudentScholarshipStats,
} from "@/lib/scholarships/queries";
import {
  getRoomsWithTodaySchedule,
  getStudentTimetableEntries,
  getTimetableEntries,
  getTimetableStats,
} from "@/lib/timetable/queries";
import {
  findTimetableConflictPairs,
  findUpcomingTimetableEntry,
  type TimetableDay,
} from "@/lib/timetable/rules";

export async function getStudentDashboardData({
  userId,
  batchId,
  todayDay,
  nowMinutes,
}: {
  userId: string;
  batchId: string | null;
  todayDay: TimetableDay;
  nowMinutes: number;
}) {
  const [scholarshipStats, deadlines, recentNotifications, entries] =
    await Promise.all([
      getStudentScholarshipStats(userId),
      getClosingSoonScholarships(4),
      getRecentNotifications(userId),
      batchId
        ? getStudentTimetableEntries(batchId)
        : Promise.resolve([]),
    ]);

  const todayEntries = entries.filter(
    (entry) => entry.dayOfWeek === todayDay,
  );

  return {
    scholarshipStats,
    deadlines,
    recentNotifications,
    todayEntries,
    upcoming: findUpcomingTimetableEntry(entries, todayDay, nowMinutes),
  };
}

export async function getOperationalDashboardData({
  userId,
  departmentId,
  todayDay,
  nowMinutes,
}: {
  userId: string;
  departmentId: string;
  todayDay: TimetableDay;
  nowMinutes: number;
}) {
  const [
    scholarshipStats,
    timetableStats,
    entries,
    rooms,
    recentNotifications,
    activeAccounts,
  ] = await Promise.all([
    getStaffScholarshipStats(),
    getTimetableStats(departmentId, todayDay),
    getTimetableEntries({ departmentId }),
    getRoomsWithTodaySchedule(departmentId, todayDay),
    getRecentNotifications(userId),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  const conflicts = findTimetableConflictPairs(entries);
  const busyRooms = rooms.filter((room) =>
    room.entries.some(
      (entry) =>
        entry.startMinute <= nowMinutes && nowMinutes < entry.endMinute,
    ),
  );
  const freeRooms = rooms.filter(
    (room) => !busyRooms.some((busy) => busy.id === room.id),
  );
  const todayEntries = entries.filter(
    (entry) => entry.dayOfWeek === todayDay,
  );

  return {
    scholarshipStats,
    timetableStats,
    activeAccounts,
    conflicts,
    busyRooms,
    freeRooms,
    todayEntries,
    recentNotifications,
  };
}

export type StudentDashboardData = Awaited<
  ReturnType<typeof getStudentDashboardData>
>;

export type OperationalDashboardData = Awaited<
  ReturnType<typeof getOperationalDashboardData>
>;
