import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  addDaysDateOnly,
  CLOSING_SOON_DAYS,
  todayDateOnly,
} from "@/lib/scholarships/rules";
import {
  getRoomsWithTodaySchedule,
  getTimetableEntries,
} from "@/lib/timetable/queries";
import {
  findTimetableConflictPairs,
  type TimetableDay,
} from "@/lib/timetable/rules";

const scholarshipReportSelect = {
  id: true,
  title: true,
  provider: true,
  category: true,
  deadline: true,
  updatedAt: true,
} satisfies Prisma.ScholarshipSelect;

export type ScholarshipReportRow = Prisma.ScholarshipGetPayload<{
  select: typeof scholarshipReportSelect;
}>;

const MAX_REPORT_ROWS = 200;

export async function getScholarshipReports() {
  const today = todayDateOnly();
  const soonLimit = addDaysDateOnly(today, CLOSING_SOON_DAYS);

  const [active, expiringSoon] = await Promise.all([
    prisma.scholarship.findMany({
      where: { status: "PUBLISHED", deadline: { gte: today } },
      select: scholarshipReportSelect,
      orderBy: [{ deadline: "asc" }, { title: "asc" }],
      take: MAX_REPORT_ROWS,
    }),
    prisma.scholarship.findMany({
      where: {
        status: "PUBLISHED",
        deadline: { gte: today, lte: soonLimit },
      },
      select: scholarshipReportSelect,
      orderBy: [{ deadline: "asc" }, { title: "asc" }],
      take: MAX_REPORT_ROWS,
    }),
  ]);

  return { active, expiringSoon };
}

export async function getReportsOverview(
  departmentId: string,
  todayDay: TimetableDay,
  nowMinutes: number,
) {
  const [scholarships, entries, rooms] = await Promise.all([
    getScholarshipReports(),
    getTimetableEntries({ departmentId }),
    getRoomsWithTodaySchedule(departmentId, todayDay),
  ]);

  const conflicts = findTimetableConflictPairs(entries);
  const roomsInUseNow = rooms.filter((room) =>
    room.entries.some(
      (entry) =>
        entry.startMinute <= nowMinutes && nowMinutes < entry.endMinute,
    ),
  );

  return {
    ...scholarships,
    entries,
    rooms,
    conflicts,
    roomsInUseNow,
  };
}

export type ReportsOverviewData = Awaited<
  ReturnType<typeof getReportsOverview>
>;
