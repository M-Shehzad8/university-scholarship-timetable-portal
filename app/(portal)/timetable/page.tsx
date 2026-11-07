import type { Metadata } from "next";
import Link from "next/link";

import { NoDepartmentNotice } from "@/components/timetable/no-department-notice";
import { StaffTimetableManager } from "@/components/timetable/staff-timetable-manager";
import { StudentTimetable } from "@/components/timetable/student-timetable";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/dal";
import {
  entryNoticeMessages,
  entryProblemMessages,
} from "@/lib/timetable/messages";
import {
  getReferenceData,
  getStudentTimetableEntries,
  getTimetableEntries,
  getTimetableStats,
} from "@/lib/timetable/queries";
import {
  DAY_LABELS,
  getPortalDayOfWeek,
  getPortalMinutes,
  isTimetableDay,
  type TimetableDay,
} from "@/lib/timetable/rules";
import { buildNewEntryHref, buildTimetableHref } from "@/lib/timetable/urls";

export const metadata: Metadata = {
  title: "Timetable",
};

export const instant = false;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const todayDay = getPortalDayOfWeek();

  if (user.role === "STUDENT") {
    const header = (
      <PageHeader
        eyebrow="Academic module"
        title="My timetable"
        description={
          user.batch
            ? `The weekly class schedule for ${user.batch.name}-${user.batch.section}. Only your linked batch is shown.`
            : "Your account is not linked to a batch, so no class schedule is available."
        }
        actions={<Badge tone="success">Student view</Badge>}
      />
    );

    if (!user.batch) {
      return (
        <div className="space-y-8">
          {header}
          <Card>
            <EmptyState
              title="No batch linked"
              description="Ask the coordinator to link your student account to a batch or section. The timetable is scoped to one batch."
              className="py-12"
            />
          </Card>
        </div>
      );
    }

    const entries = await getStudentTimetableEntries(user.batch.id);

    return (
      <div className="space-y-8">
        {header}
        <StudentTimetable
          entries={entries}
          batchLabel={`${user.batch.name}-${user.batch.section}`}
          todayDay={todayDay}
          todayMinutes={getPortalMinutes()}
        />
      </div>
    );
  }

  const canManage = user.role === "STAFF";
  const params = await searchParams;

  if (!user.department) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Academic module"
          title="Timetable"
          description="Department schedules, conflict checks, and automatic room assignment."
          actions={canManage ? null : <Badge tone="warning">Read-only</Badge>}
        />
        <NoDepartmentNotice />
      </div>
    );
  }

  const { courses, batches, teachers, rooms } = await getReferenceData(
    user.department.id,
  );
  const stats = await getTimetableStats(user.department.id, todayDay);

  const requestedBatch = first(params.batch) ?? "";
  const requestedTeacher = first(params.teacher) ?? "";
  const requestedDay = first(params.day) ?? "";

  const validBatch = batches.some((batch) => batch.id === requestedBatch)
    ? requestedBatch
    : "";
  const validTeacher = teachers.some(
    (teacher) => teacher.id === requestedTeacher,
  )
    ? requestedTeacher
    : "";
  const validDay =
    requestedDay === "today" || isTimetableDay(requestedDay)
      ? requestedDay
      : "";

  const dayOfWeek: TimetableDay | undefined =
    validDay === "today"
      ? todayDay
      : validDay && isTimetableDay(validDay)
        ? validDay
        : undefined;

  const entries = await getTimetableEntries({
    departmentId: user.department.id,
    batchId: validBatch || undefined,
    teacherId: validTeacher || undefined,
    dayOfWeek,
  });

  const filters = {
    batchId: validBatch,
    teacherId: validTeacher,
    day: validDay,
  };
  const returnTo = buildTimetableHref(filters);
  const newEntryDay = validDay && validDay !== "today" ? validDay : todayDay;
  const newEntryHref = buildNewEntryHref(returnTo, newEntryDay);

  const notice = first(params.notice);
  const problem = first(params.problem);
  const assignedRoom = first(params.room);
  const assistant = first(params.assigned);
  const noticeMessage = notice ? entryNoticeMessages[notice] : undefined;
  const problemMessage = problem ? entryProblemMessages[problem] : undefined;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Academic module"
        title="Timetable"
        description={
          canManage
            ? "Maintain the department schedule with table-first entry, server-side conflict checks, and deterministic automatic room assignment."
            : "Review the department schedule by batch, teacher, and day. Timetable maintenance is limited to staff accounts."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canManage ? (
              <Link
                href={newEntryHref}
                className={buttonStyles({ variant: "primary", size: "md" })}
              >
                Add class
              </Link>
            ) : null}
            <Badge tone={canManage ? "info" : "warning"}>
              {canManage ? "Staff editor" : "Read-only"}
            </Badge>
          </div>
        }
      />

      {noticeMessage ? (
        <Alert tone="success" title="Timetable updated">
          {noticeMessage}
          {assignedRoom && (notice === "created" || notice === "updated")
            ? ` Room ${assignedRoom}${assistant === "auto" ? " was assigned automatically." : " is assigned."}`
            : null}
        </Alert>
      ) : null}

      {problemMessage ? (
        <Alert tone="error" title="Timetable action blocked">
          {problemMessage}
        </Alert>
      ) : null}

      <StaffTimetableManager
        entries={entries}
        batches={batches}
        teachers={teachers}
        filters={filters}
        stats={stats}
        referenceCounts={{
          courses: courses.length,
          teachers: teachers.length,
          batches: batches.length,
          rooms: rooms.length,
        }}
        canManage={canManage}
        todayDay={todayDay}
        newEntryHref={newEntryHref}
        returnTo={returnTo}
      />

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {DAY_LABELS[todayDay]} is the current portal day. Times are stored as
        minutes from midnight and compared with half-open intervals.
      </p>
    </div>
  );
}
