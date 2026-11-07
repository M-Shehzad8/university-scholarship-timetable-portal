import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NoDepartmentNotice } from "@/components/timetable/no-department-notice";
import { TimetableEntryForm } from "@/components/timetable/timetable-entry-form";
import { buttonStyles } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth/dal";
import {
  getReferenceData,
  getTimetableEntryById,
} from "@/lib/timetable/queries";
import {
  DAY_LABELS,
  formatMinutes,
  formatTimeRange,
} from "@/lib/timetable/rules";
import { sanitizeTimetableReturnPath } from "@/lib/validation/timetable";

export const metadata: Metadata = {
  title: "Edit class",
};

export const instant = false;

export default async function EditTimetableEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const user = await requireRole(["STAFF"]);
  const { id } = await params;
  const query = await searchParams;
  const returnTo = sanitizeTimetableReturnPath(query.returnTo ?? null);

  const header = (
    <PageHeader
      eyebrow="Timetable"
      title="Edit class"
      description="Update the row and save. Teacher, batch, and room conflicts are checked again, while this class is excluded from its own conflict check."
      actions={
        <Link
          href={returnTo}
          className={buttonStyles({ variant: "secondary", size: "md" })}
        >
          Back to timetable
        </Link>
      }
    />
  );

  if (!user.department) {
    return (
      <div className="space-y-8">
        {header}
        <NoDepartmentNotice />
      </div>
    );
  }

  const entry = await getTimetableEntryById(id, user.department.id);

  if (!entry) {
    notFound();
  }

  const { courses, batches, teachers, rooms } = await getReferenceData(
    user.department.id,
  );

  return (
    <div className="space-y-8">
      {header}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <Card>
          <CardHeader>
            <CardTitle>Class details</CardTitle>
            <CardDescription>
              The room can stay explicit or be switched to automatic assignment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimetableEntryForm
              mode="edit"
              entryId={entry.id}
              values={{
                courseId: entry.courseId,
                batchId: entry.batchId,
                teacherId: entry.teacherId,
                dayOfWeek: entry.dayOfWeek,
                startTime: formatMinutes(entry.startMinute),
                endTime: formatMinutes(entry.endMinute),
                roomId: entry.roomId,
                returnTo,
              }}
              courses={courses.map((course) => ({
                value: course.id,
                label: `${course.code} · ${course.title}`,
              }))}
              batches={batches.map((batch) => ({
                value: batch.id,
                label: `${batch.name}-${batch.section}`,
              }))}
              teachers={teachers.map((teacher) => ({
                value: teacher.id,
                label: teacher.name,
              }))}
              rooms={rooms.map((room) => ({
                value: room.id,
                label: `${room.roomNumber}${room.building ? ` · ${room.building}` : ""}`,
              }))}
              cancelHref={returnTo}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current row</CardTitle>
            <CardDescription>
              The values currently stored for this timetable entry.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Course</dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-100">
                  {entry.course.code}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Batch</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {entry.batch.name}-{entry.batch.section}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Teacher</dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-100">
                  {entry.teacher.name}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Day</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {DAY_LABELS[entry.dayOfWeek]}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Time</dt>
                <dd className="font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {formatTimeRange(entry.startMinute, entry.endMinute)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Room</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {entry.room.roomNumber}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
