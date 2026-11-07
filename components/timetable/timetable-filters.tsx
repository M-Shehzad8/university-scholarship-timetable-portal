import Link from "next/link";

import { Button, buttonStyles } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { DAY_LABELS, TIMETABLE_DAYS } from "@/lib/timetable/rules";
import {
  buildTimetableHref,
  type TimetableFilters,
} from "@/lib/timetable/urls";

export function TimetableFiltersForm({
  batches,
  teachers,
  filters,
}: {
  batches: Array<{ id: string; label: string }>;
  teachers: Array<{ id: string; label: string }>;
  filters: TimetableFilters;
}) {
  const todayHref = buildTimetableHref({ ...filters, day: "today" });
  const resetHref = buildTimetableHref({
    batchId: "",
    teacherId: "",
    day: "",
  });

  return (
    <form
      action="/timetable"
      method="get"
      className="grid gap-4 md:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto]"
    >
      <Field label="Batch / section" htmlFor="filter-batch">
        <Select
          id="filter-batch"
          name="batch"
          defaultValue={filters.batchId}
          aria-label="Filter by batch"
        >
          <option value="">All batches</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Teacher" htmlFor="filter-teacher">
        <Select
          id="filter-teacher"
          name="teacher"
          defaultValue={filters.teacherId}
          aria-label="Filter by teacher"
        >
          <option value="">All teachers</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Day" htmlFor="filter-day">
        <Select
          id="filter-day"
          name="day"
          defaultValue={filters.day}
          aria-label="Filter by day"
        >
          <option value="">All days</option>
          <option value="today">Today</option>
          {TIMETABLE_DAYS.map((day) => (
            <option key={day} value={day}>
              {DAY_LABELS[day]}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex flex-wrap items-end gap-2">
        <Button type="submit" size="md">
          Apply filters
        </Button>
        <Link
          href={todayHref}
          className={buttonStyles({ variant: "secondary", size: "md" })}
        >
          Today
        </Link>
        <Link
          href={resetHref}
          className={buttonStyles({ variant: "ghost", size: "md" })}
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
