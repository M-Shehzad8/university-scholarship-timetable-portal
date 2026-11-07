import type { Metadata } from "next";
import Link from "next/link";

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
import { getReferenceData } from "@/lib/timetable/queries";
import {
  getPortalDayOfWeek,
  isTimetableDay,
  TIMETABLE_DAYS,
  DAY_LABELS,
} from "@/lib/timetable/rules";
import { sanitizeTimetableReturnPath } from "@/lib/validation/timetable";

export const metadata: Metadata = {
  title: "Add class",
};

export const instant = false;

export default async function NewTimetableEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; day?: string }>;
}) {
  const user = await requireRole(["STAFF"]);
  const params = await searchParams;
  const returnTo = sanitizeTimetableReturnPath(params.returnTo ?? null);

  const header = (
    <PageHeader
      eyebrow="Timetable"
      title="Add a class"
      description="Choose the course, batch, teacher, day, and time. Teacher, batch, and room conflicts are checked on the server before the row is saved."
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

  const { courses, batches, teachers, rooms } = await getReferenceData(
    user.department.id,
  );

  const missing = [
    courses.length === 0
      ? { label: "courses", href: "/timetable/courses" }
      : null,
    teachers.length === 0
      ? { label: "teachers", href: "/timetable/teachers" }
      : null,
    batches.length === 0
      ? { label: "batches", href: "/timetable/batches" }
      : null,
    rooms.length === 0 ? { label: "rooms", href: "/rooms" } : null,
  ].filter((item): item is { label: string; href: string } => item !== null);

  if (missing.length > 0) {
    return (
      <div className="space-y-8">
        {header}
        <Card>
          <CardHeader>
            <CardTitle>Reference data is incomplete</CardTitle>
            <CardDescription>
              A timetable row needs at least one course, teacher, batch, and
              room. Add the missing records first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {missing.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={buttonStyles({ variant: "secondary", size: "sm" })}
                >
                  Add {item.label}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const requestedDay =
    params.day && isTimetableDay(params.day)
      ? params.day
      : getPortalDayOfWeek();

  return (
    <div className="space-y-8">
      {header}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <Card>
          <CardHeader>
            <CardTitle>Class details</CardTitle>
            <CardDescription>
              The end time is exclusive: a 09:00–10:00 class does not overlap a
              class that starts at 10:00.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimetableEntryForm
              mode="create"
              values={{
                courseId: "",
                batchId: "",
                teacherId: "",
                dayOfWeek: requestedDay,
                startTime: "09:00",
                endTime: "10:00",
                roomId: "auto",
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conflict rule</CardTitle>
              <CardDescription>
                Applied separately to the teacher, the batch, and the room.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-100">
                <code>{`existingStart < newEnd
AND
existingEnd > newStart`}</code>
              </pre>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Same-day intervals overlap only when both conditions are true.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Automatic room</CardTitle>
              <CardDescription>
                The default room option assigns the first free department room
                in ascending room-number order. If every room is occupied, the
                class is not saved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Days available:{" "}
                {TIMETABLE_DAYS.map((day) => DAY_LABELS[day]).join(", ")}.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
