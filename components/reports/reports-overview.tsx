import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReportsOverviewData } from "@/lib/reports/queries";
import {
  describeDeadline,
  formatDateOnly,
} from "@/lib/scholarships/rules";
import type { TimetableEntryRow } from "@/lib/timetable/queries";
import {
  DAY_LABELS,
  DAY_SHORT_LABELS,
  formatEntrySlot,
  formatTimeRange,
  type TimetableDay,
  type TimetableConflictType,
} from "@/lib/timetable/rules";

function conflictTypeLabel(type: TimetableConflictType): string {
  if (type === "teacher") {
    return "Teacher";
  }

  if (type === "batch") {
    return "Batch";
  }

  return "Room";
}

function sharedResource(
  conflict: ReportsOverviewData["conflicts"][number],
): string {
  if (conflict.type === "teacher") {
    return conflict.first.teacher.name;
  }

  if (conflict.type === "batch") {
    return `${conflict.first.batch.name}-${conflict.first.batch.section}`;
  }

  return `Room ${conflict.first.room.roomNumber}`;
}

function groupEntriesByBatch(entries: TimetableEntryRow[]) {
  const groups = new Map<string, TimetableEntryRow[]>();

  for (const entry of entries) {
    const label = `${entry.batch.name}-${entry.batch.section}`;
    groups.set(label, [...(groups.get(label) ?? []), entry]);
  }

  return [...groups.entries()].sort(([first], [second]) =>
    first.localeCompare(second),
  );
}

function groupEntriesByTeacher(entries: TimetableEntryRow[]) {
  const groups = new Map<string, TimetableEntryRow[]>();

  for (const entry of entries) {
    groups.set(entry.teacher.name, [
      ...(groups.get(entry.teacher.name) ?? []),
      entry,
    ]);
  }

  return [...groups.entries()].sort(([first], [second]) =>
    first.localeCompare(second),
  );
}

function WeekTable({ entries }: { entries: TimetableEntryRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Day</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Course</TableHead>
          <TableHead>Teacher</TableHead>
          <TableHead>Room</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>
              <span className="sm:hidden">
                <Badge tone="neutral">
                  {DAY_SHORT_LABELS[entry.dayOfWeek]}
                </Badge>
              </span>
              <span className="hidden sm:inline">
                <Badge tone="neutral">{DAY_LABELS[entry.dayOfWeek]}</Badge>
              </span>
            </TableCell>
            <TableCell className="font-mono text-xs whitespace-nowrap">
              {formatTimeRange(entry.startMinute, entry.endMinute)}
            </TableCell>
            <TableCell>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {entry.course.code}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {entry.course.title}
              </p>
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {entry.teacher.name}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {entry.room.roomNumber}
              {entry.room.building ? (
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  {entry.room.building}
                </span>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ReportsOverview({
  data,
  todayDay,
  nowMinutes,
}: {
  data: ReportsOverviewData;
  todayDay: TimetableDay;
  nowMinutes: number;
}) {
  const batchGroups = groupEntriesByBatch(data.entries);
  const teacherGroups = groupEntriesByTeacher(data.entries);

  return (
    <div className="space-y-8">
      <section
        aria-label="Report summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <StatCard
          label="Active scholarships"
          value={String(data.active.length)}
          detail="Published and still open"
          tone="emerald"
        />
        <StatCard
          label="Expiring soon"
          value={String(data.expiringSoon.length)}
          detail="Closing within 14 days"
          tone="amber"
        />
        <StatCard
          label="Classes scheduled"
          value={String(data.entries.length)}
          detail="All department timetable rows"
          tone="sky"
        />
        <StatCard
          label="Rooms in use now"
          value={`${data.roomsInUseNow.length}/${data.rooms.length}`}
          detail={`${DAY_LABELS[todayDay]} at the current portal time`}
          tone="zinc"
        />
        <StatCard
          label="Conflicts"
          value={String(data.conflicts.length)}
          detail="Teacher, batch, or room overlaps"
          tone={data.conflicts.length === 0 ? "emerald" : "amber"}
        />
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Active scholarships</CardTitle>
              <CardDescription>
                Published opportunities ordered by the nearest deadline.
              </CardDescription>
            </div>
            <Badge tone="success">{data.active.length} open</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scholarship</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.active.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      title="No active scholarships"
                      description="Publish a scholarship with a future deadline to include it in this report."
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data.active.map((scholarship) => (
                  <TableRow key={scholarship.id}>
                    <TableCell>
                      <Link
                        href={`/scholarships/${scholarship.id}`}
                        className="font-medium text-zinc-900 hover:text-emerald-700 dark:text-zinc-100 dark:hover:text-emerald-400"
                      >
                        {scholarship.title}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {scholarship.provider}
                    </TableCell>
                    <TableCell>{scholarship.category ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateOnly(scholarship.deadline)}
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                        {describeDeadline(scholarship.deadline)}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateOnly(scholarship.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Scholarships expiring soon</CardTitle>
              <CardDescription>
                Closing within 14 days for staff follow-up.
              </CardDescription>
            </div>
            <Badge
              tone={data.expiringSoon.length > 0 ? "warning" : "success"}
            >
              {data.expiringSoon.length} closing
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scholarship</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Timing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.expiringSoon.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      title="No immediate deadlines"
                      description="No published scholarship closes within the next 14 days."
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data.expiringSoon.map((scholarship) => (
                  <TableRow key={scholarship.id}>
                    <TableCell>
                      <Link
                        href={`/scholarships/${scholarship.id}`}
                        className="font-medium text-zinc-900 hover:text-emerald-700 dark:text-zinc-100 dark:hover:text-emerald-400"
                      >
                        {scholarship.title}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {scholarship.provider}
                    </TableCell>
                    <TableCell>{scholarship.category ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateOnly(scholarship.deadline)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge tone="warning">
                        {describeDeadline(scholarship.deadline)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <section aria-labelledby="report-batch-heading" className="space-y-4">
        <div>
          <h2
            id="report-batch-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Timetable by batch
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {batchGroups.length} batch
            {batchGroups.length === 1 ? "" : "es"} with scheduled classes.
          </p>
        </div>

        {batchGroups.length === 0 ? (
          <Card>
            <EmptyState
              title="No timetable rows"
              description="Add classes to the department timetable to populate this report."
              className="py-10"
            />
          </Card>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {batchGroups.map(([label, entries]) => (
              <Card key={label}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>{label}</CardTitle>
                    <Badge tone="neutral">{entries.length} classes</Badge>
                  </div>
                  <CardDescription>
                    Weekly schedule including course, teacher, and room.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <WeekTable entries={entries} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="report-teacher-heading" className="space-y-4">
        <div>
          <h2
            id="report-teacher-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Timetable by teacher
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {teacherGroups.length} teacher
            {teacherGroups.length === 1 ? "" : "s"} with scheduled classes.
          </p>
        </div>

        {teacherGroups.length === 0 ? (
          <Card>
            <EmptyState
              title="No teacher schedule"
              description="Teacher load appears once classes are added to the timetable."
              className="py-10"
            />
          </Card>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {teacherGroups.map(([name, entries]) => (
              <Card key={name}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>{name}</CardTitle>
                    <Badge tone="neutral">{entries.length} classes</Badge>
                  </div>
                  <CardDescription>
                    Weekly teaching load with batch and room allocation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Room</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <Badge tone="neutral">
                              {DAY_SHORT_LABELS[entry.dayOfWeek]}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs whitespace-nowrap">
                            {formatTimeRange(
                              entry.startMinute,
                              entry.endMinute,
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {entry.course.code}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {entry.batch.name}-{entry.batch.section}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {entry.room.roomNumber}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Room usage today</CardTitle>
              <CardDescription>
                {DAY_LABELS[todayDay]} schedule and current availability.
              </CardDescription>
            </div>
            <Badge tone="info">
              {data.roomsInUseNow.length} in use now
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Classes today</TableHead>
                <TableHead>Status now</TableHead>
                <TableHead>Today&apos;s schedule</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      title="No department rooms"
                      description="Create rooms in the timetable reference data before scheduling classes."
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data.rooms.map((room) => {
                  const inUse = room.entries.some(
                    (entry) =>
                      entry.startMinute <= nowMinutes &&
                      nowMinutes < entry.endMinute,
                  );

                  return (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                        {room.roomNumber}
                      </TableCell>
                      <TableCell>{room.building ?? "—"}</TableCell>
                      <TableCell>{room.entries.length}</TableCell>
                      <TableCell>
                        <Badge tone={inUse ? "warning" : "success"}>
                          {inUse ? "In use" : "Free"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {room.entries.length === 0 ? (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            No classes today
                          </span>
                        ) : (
                          <ul className="space-y-1 text-xs">
                            {room.entries.map((entry) => (
                              <li key={entry.id}>
                                <span className="font-mono">
                                  {formatTimeRange(
                                    entry.startMinute,
                                    entry.endMinute,
                                  )}
                                </span>{" "}
                                · {entry.course.code} · {entry.batch.name}-
                                {entry.batch.section}
                              </li>
                            ))}
                          </ul>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Conflict summary</CardTitle>
              <CardDescription>
                Overlapping teacher, batch, or room assignments that need
                attention.
              </CardDescription>
            </div>
            <Badge
              tone={data.conflicts.length === 0 ? "success" : "danger"}
            >
              {data.conflicts.length} issue
              {data.conflicts.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {data.conflicts.length === 0 ? (
            <EmptyState
              title="No conflicts detected"
              description="Every scheduled class has a distinct teacher, batch, and room in its time slot."
              className="py-10"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Class A</TableHead>
                  <TableHead>Class B</TableHead>
                  <TableHead>Shared resource</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.conflicts.map((conflict) => (
                  <TableRow
                    key={`${conflict.type}-${conflict.first.id}-${conflict.second.id}`}
                  >
                    <TableCell>
                      <Badge tone="danger">
                        {conflictTypeLabel(conflict.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatEntrySlot(
                        conflict.first.dayOfWeek,
                        conflict.first.startMinute,
                        conflict.first.endMinute,
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {conflict.first.course.code}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {conflict.first.batch.name}-
                        {conflict.first.batch.section} · Room{" "}
                        {conflict.first.room.roomNumber}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {conflict.second.course.code}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {conflict.second.batch.name}-
                        {conflict.second.batch.section} · Room{" "}
                        {conflict.second.room.roomNumber}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {sharedResource(conflict)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
