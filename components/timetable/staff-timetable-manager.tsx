import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import type { TimetableEntryRow } from "@/lib/timetable/queries";
import { DAY_LABELS, type TimetableDay } from "@/lib/timetable/rules";
import type { TimetableFilters } from "@/lib/timetable/urls";

import { TimetableFiltersForm } from "./timetable-filters";
import { TimetableTable } from "./timetable-table";

export function StaffTimetableManager({
  entries,
  batches,
  teachers,
  filters,
  stats,
  referenceCounts,
  canManage,
  todayDay,
  newEntryHref,
  returnTo,
}: {
  entries: TimetableEntryRow[];
  batches: Array<{ id: string; name: string; section: string }>;
  teachers: Array<{ id: string; name: string }>;
  filters: TimetableFilters;
  stats: {
    totalClasses: number;
    todayClasses: number;
    batchesScheduled: number;
    teachersScheduled: number;
    totalRooms: number;
  };
  referenceCounts: {
    courses: number;
    teachers: number;
    batches: number;
    rooms: number;
  };
  canManage: boolean;
  todayDay: TimetableDay;
  newEntryHref: string;
  returnTo: string;
}) {
  const selectedBatch = batches.find((batch) => batch.id === filters.batchId);
  const selectedTeacher = teachers.find(
    (teacher) => teacher.id === filters.teacherId,
  );
  const dayLabel =
    filters.day === "today"
      ? `Today (${DAY_LABELS[todayDay]})`
      : filters.day
        ? DAY_LABELS[filters.day as TimetableDay]
        : "";

  const filterSummary = [
    selectedBatch
      ? `batch ${selectedBatch.name}-${selectedBatch.section}`
      : null,
    selectedTeacher ? `teacher ${selectedTeacher.name}` : null,
    dayLabel ? dayLabel.toLowerCase() : null,
  ]
    .filter(Boolean)
    .join(", ");

  const hasFilters = Boolean(
    filters.batchId || filters.teacherId || filters.day,
  );

  return (
    <div className="space-y-8">
      <section
        aria-label="Timetable summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <StatCard
          label="Classes scheduled"
          value={String(stats.totalClasses)}
          detail="Rows across all department batches"
        />
        <StatCard
          label="Classes today"
          value={String(stats.todayClasses)}
          detail={`${DAY_LABELS[todayDay]} across the department`}
          tone="emerald"
        />
        <StatCard
          label="Batches scheduled"
          value={String(stats.batchesScheduled)}
          detail="Batches with at least one class"
          tone="sky"
        />
        <StatCard
          label="Teachers scheduled"
          value={String(stats.teachersScheduled)}
          detail="Teachers with at least one class"
          tone="amber"
        />
        <StatCard
          label="Department rooms"
          value={String(stats.totalRooms)}
          detail="Rooms available for automatic assignment"
          tone="zinc"
        />
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Filter the timetable</CardTitle>
              <CardDescription>
                Filter by batch, teacher, or day. The today shortcut resolves to
                the portal&apos;s current weekday.
              </CardDescription>
            </div>
            {hasFilters ? <Badge tone="info">Filtered</Badge> : null}
          </div>
        </CardHeader>
        <CardContent>
          <TimetableFiltersForm
            batches={batches.map((batch) => ({
              id: batch.id,
              label: `${batch.name}-${batch.section}`,
            }))}
            teachers={teachers.map((teacher) => ({
              id: teacher.id,
              label: teacher.name,
            }))}
            filters={filters}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>
                {hasFilters
                  ? `Showing ${entries.length} class${entries.length === 1 ? "" : "es"} for ${filterSummary}.`
                  : `Showing all ${entries.length} class${entries.length === 1 ? "" : "es"} in the department timetable.`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{entries.length} rows</Badge>
              {canManage ? (
                <Link
                  href={newEntryHref}
                  className={buttonStyles({ variant: "primary", size: "sm" })}
                >
                  Add class
                </Link>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <TimetableTable
            entries={entries}
            returnTo={returnTo}
            canManage={canManage}
            emptyTitle={hasFilters ? "No matching classes" : "No classes yet"}
            emptyDescription={
              hasFilters
                ? "Adjust or reset the filters to see other timetable rows."
                : canManage
                  ? "Create courses, teachers, batches, and rooms, then add the first class."
                  : "Staff have not added any timetable rows for this department."
            }
          />
        </CardContent>
      </Card>

      <section aria-labelledby="reference-data-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="reference-data-heading"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Timetable reference data
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {canManage
                ? "Maintain the records that every timetable row refers to."
                : "Coordinators review reference data; only staff can change it."}
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              href: "/timetable/courses",
              title: "Courses",
              count: referenceCounts.courses,
              description: "Codes and titles used by classes",
            },
            {
              href: "/timetable/teachers",
              title: "Teachers",
              count: referenceCounts.teachers,
              description: "Teaching staff and contact emails",
            },
            {
              href: "/timetable/batches",
              title: "Batches",
              count: referenceCounts.batches,
              description: "Programme sections that attend classes",
            },
            {
              href: "/rooms",
              title: "Rooms",
              count: referenceCounts.rooms,
              description: "Department spaces used by the schedule",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50/30 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20"
            >
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{item.title}</CardTitle>
                <Badge tone="neutral">{item.count}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {item.description}
              </p>
              <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {canManage ? "Manage" : "Review"}{" "}
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      <Alert title="Automatic room assignment is deterministic">
        For an automatic request, the server loads the department rooms in
        ascending room-number order, removes rooms with an overlapping class in
        the requested interval, and assigns the first remaining room. If no room
        is free, the class is not saved and the form explains why.
      </Alert>
    </div>
  );
}
