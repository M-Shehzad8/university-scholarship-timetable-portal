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
import type { TimetableEntryRow } from "@/lib/timetable/queries";
import {
  DAY_LABELS,
  formatTimeRange,
  TIMETABLE_DAYS,
  type TimetableDay,
} from "@/lib/timetable/rules";

function findByDay(entries: TimetableEntryRow[], day: TimetableDay) {
  return entries
    .filter((entry) => entry.dayOfWeek === day)
    .sort((first, second) => first.startMinute - second.startMinute);
}

function findNextClass(
  entries: TimetableEntryRow[],
  todayDay: TimetableDay,
  todayMinutes: number,
) {
  const remainingToday = findByDay(entries, todayDay).filter(
    (entry) => entry.startMinute >= todayMinutes,
  );

  if (remainingToday[0]) {
    return { entry: remainingToday[0], dayLabel: "Today" };
  }

  const todayIndex = TIMETABLE_DAYS.indexOf(todayDay);

  for (let offset = 1; offset <= TIMETABLE_DAYS.length; offset += 1) {
    const day = TIMETABLE_DAYS[(todayIndex + offset) % TIMETABLE_DAYS.length];
    const dayEntries = findByDay(entries, day);

    if (dayEntries[0]) {
      return { entry: dayEntries[0], dayLabel: DAY_LABELS[day] };
    }
  }

  return null;
}

export function StudentTimetable({
  entries,
  batchLabel,
  todayDay,
  todayMinutes,
}: {
  entries: TimetableEntryRow[];
  batchLabel: string;
  todayDay: TimetableDay;
  todayMinutes: number;
}) {
  const todayEntries = findByDay(entries, todayDay);
  const nextClass = findNextClass(entries, todayDay, todayMinutes);
  const groupedDays = TIMETABLE_DAYS.map((day) => ({
    day,
    entries: findByDay(entries, day),
  })).filter((group) => group.entries.length > 0);

  return (
    <div className="space-y-8">
      <section
        aria-label="Timetable summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <StatCard
          label="Today's classes"
          value={String(todayEntries.length)}
          detail={`${DAY_LABELS[todayDay]} schedule for ${batchLabel}`}
          tone="emerald"
        />
        <StatCard
          label="Weekly classes"
          value={String(entries.length)}
          detail="All classes in your batch timetable"
          tone="sky"
        />
        <StatCard
          label="Next class"
          value={nextClass ? nextClass.entry.course.code : "—"}
          detail={
            nextClass
              ? `${nextClass.dayLabel}, ${formatTimeRange(
                  nextClass.entry.startMinute,
                  nextClass.entry.endMinute,
                )} · Room ${nextClass.entry.room.roomNumber}`
              : "No class is scheduled this week"
          }
          tone="amber"
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Today</CardTitle>
              <Badge tone="info">{DAY_LABELS[todayDay]}</Badge>
            </div>
            <CardDescription>
              Classes for {batchLabel} scheduled today. Times are shown in the
              portal time zone.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {todayEntries.length === 0 ? (
              <EmptyState
                title="No classes today"
                description="Use the weekly schedule below to prepare for the next teaching day."
                className="py-10"
              />
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {todayEntries.map((entry) => {
                  const inProgress =
                    entry.startMinute <= todayMinutes &&
                    entry.endMinute > todayMinutes;

                  return (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-start gap-4 px-5 py-4"
                    >
                      <div className="w-24 shrink-0 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {formatTimeRange(entry.startMinute, entry.endMinute)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {entry.course.code} · {entry.course.title}
                          </p>
                          {inProgress ? (
                            <Badge tone="success">In progress</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {entry.teacher.name} · Room {entry.room.roomNumber}
                          {entry.room.building
                            ? ` (${entry.room.building})`
                            : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Up next</CardTitle>
            <CardDescription>
              The next class in your batch schedule, including today if one is
              still to come.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nextClass ? (
              <div className="space-y-4">
                <div>
                  <Badge tone="neutral">{nextClass.dayLabel}</Badge>
                  <p className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {nextClass.entry.course.code}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {nextClass.entry.course.title}
                  </p>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-zinc-500 dark:text-zinc-400">Time</dt>
                    <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                      {formatTimeRange(
                        nextClass.entry.startMinute,
                        nextClass.entry.endMinute,
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-zinc-500 dark:text-zinc-400">
                      Teacher
                    </dt>
                    <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                      {nextClass.entry.teacher.name}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-zinc-500 dark:text-zinc-400">Room</dt>
                    <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                      {nextClass.entry.room.roomNumber}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <EmptyState
                title="Nothing scheduled"
                description="Your batch has no classes in the current timetable."
                className="py-8"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="weekly-schedule-heading" className="space-y-4">
        <div>
          <h2
            id="weekly-schedule-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Weekly schedule
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Every class for {batchLabel}, grouped by day.
          </p>
        </div>

        {groupedDays.length === 0 ? (
          <Card>
            <EmptyState
              title="No timetable yet"
              description="Staff have not scheduled any classes for your batch. Check back after the timetable is published."
              className="py-12"
            />
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {groupedDays.map((group) => (
              <Card key={group.day}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>{DAY_LABELS[group.day]}</CardTitle>
                    <Badge tone="neutral">
                      {group.entries.length}{" "}
                      {group.entries.length === 1 ? "class" : "classes"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {group.entries.map((entry) => (
                      <li key={entry.id} className="space-y-1 px-5 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {entry.course.code}
                          </p>
                          <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                            {formatTimeRange(
                              entry.startMinute,
                              entry.endMinute,
                            )}
                          </p>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {entry.teacher.name} · Room {entry.room.roomNumber}
                        </p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
