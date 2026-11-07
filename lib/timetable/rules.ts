import { PORTAL_TIME_ZONE } from "@/lib/time/portal";

// The timetable is a recurring weekly schedule. Times are minutes from
// midnight, and the end of an interval is exclusive.

export const TIMETABLE_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export type TimetableDay = (typeof TIMETABLE_DAYS)[number];

export const DAY_LABELS: Record<TimetableDay, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export const DAY_SHORT_LABELS: Record<TimetableDay, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

export function isTimetableDay(value: string): value is TimetableDay {
  return (TIMETABLE_DAYS as readonly string[]).includes(value);
}

/** The current weekday in the portal's fixed calendar time zone. */
export function getPortalDayOfWeek(now: Date = new Date()): TimetableDay {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: PORTAL_TIME_ZONE,
    weekday: "long",
  })
    .format(now)
    .toUpperCase();

  return isTimetableDay(weekday) ? weekday : "MONDAY";
}

/** Minutes since midnight in the portal's fixed calendar time zone. */
export function getPortalMinutes(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PORTAL_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);

  return hour * 60 + minute;
}

/**
 * Parses `HH:mm` into minutes from midnight. `24:00` is accepted as an
 * exclusive end-of-day boundary; every other value must be a real clock time.
 */
export function parseTimeInput(value: string): number | null {
  if (value === "24:00") {
    return 24 * 60;
  }

  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

export function formatTimeRange(
  startMinute: number,
  endMinute: number,
): string {
  return `${formatMinutes(startMinute)}–${formatMinutes(endMinute)}`;
}

/**
 * Standard half-open interval overlap:
 * existingStart < newEnd AND existingEnd > newStart.
 */
export function intervalsOverlap(
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number,
): boolean {
  return firstStart < secondEnd && firstEnd > secondStart;
}

export function dayIndex(day: TimetableDay): number {
  return TIMETABLE_DAYS.indexOf(day);
}

export function compareTimetableEntries(
  first: { dayOfWeek: TimetableDay; startMinute: number; endMinute: number },
  second: { dayOfWeek: TimetableDay; startMinute: number; endMinute: number },
): number {
  const dayDifference = dayIndex(first.dayOfWeek) - dayIndex(second.dayOfWeek);

  if (dayDifference !== 0) {
    return dayDifference;
  }

  if (first.startMinute !== second.startMinute) {
    return first.startMinute - second.startMinute;
  }

  return first.endMinute - second.endMinute;
}

export function sortTimetableEntries<
  T extends { dayOfWeek: TimetableDay; startMinute: number; endMinute: number },
>(entries: T[]): T[] {
  return [...entries].sort(compareTimetableEntries);
}

/** Formats an entry interval for compact display in tables and messages. */
export function formatEntrySlot(
  day: TimetableDay,
  startMinute: number,
  endMinute: number,
): string {
  return `${DAY_LABELS[day]} ${formatTimeRange(startMinute, endMinute)}`;
}

export type TimetableConflictType = "teacher" | "batch" | "room";

export type ConflictEntryShape = {
  id: string;
  dayOfWeek: TimetableDay;
  startMinute: number;
  endMinute: number;
  course: { code: string; title: string };
  teacher: { id: string; name: string };
  batch: { id: string; name: string; section: string };
  room: { id: string; roomNumber: string };
};

export type TimetableConflictPair<T extends ConflictEntryShape> = {
  type: TimetableConflictType;
  first: T;
  second: T;
};

/**
 * Finds pairs of classes that overlap for the same teacher, batch, or room.
 * A single pair can generate more than one conflict type when several
 * resources are shared.
 */
export function findTimetableConflictPairs<T extends ConflictEntryShape>(
  entries: T[],
): TimetableConflictPair<T>[] {
  const sorted = sortTimetableEntries(entries);
  const pairs: TimetableConflictPair<T>[] = [];

  for (let firstIndex = 0; firstIndex < sorted.length; firstIndex += 1) {
    const first = sorted[firstIndex];

    for (
      let secondIndex = firstIndex + 1;
      secondIndex < sorted.length;
      secondIndex += 1
    ) {
      const second = sorted[secondIndex];

      if (second.dayOfWeek !== first.dayOfWeek) {
        break;
      }

      if (
        !intervalsOverlap(
          first.startMinute,
          first.endMinute,
          second.startMinute,
          second.endMinute,
        )
      ) {
        continue;
      }

      if (first.teacher.id === second.teacher.id) {
        pairs.push({ type: "teacher", first, second });
      }

      if (first.batch.id === second.batch.id) {
        pairs.push({ type: "batch", first, second });
      }

      if (first.room.id === second.room.id) {
        pairs.push({ type: "room", first, second });
      }
    }
  }

  return pairs;
}

export type UpcomingTimetableEntry<T> = {
  entry: T;
  daysAhead: number;
  inProgress: boolean;
};

/**
 * Selects the next class for a recurring weekly timetable. Classes that have
 * already ended today are skipped, so the result wraps to the following week.
 */
export function findUpcomingTimetableEntry<
  T extends {
    dayOfWeek: TimetableDay;
    startMinute: number;
    endMinute: number;
  },
>(
  entries: T[],
  todayDay: TimetableDay,
  nowMinutes: number,
): UpcomingTimetableEntry<T> | null {
  let best: UpcomingTimetableEntry<T> | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  const todayIndex = dayIndex(todayDay);

  for (const entry of entries) {
    const daysAhead = (dayIndex(entry.dayOfWeek) - todayIndex + 7) % 7;

    if (daysAhead === 0 && entry.endMinute <= nowMinutes) {
      continue;
    }

    const inProgress =
      daysAhead === 0 &&
      entry.startMinute <= nowMinutes &&
      entry.endMinute > nowMinutes;
    const score = daysAhead * 24 * 60 + entry.startMinute;

    if (score < bestScore) {
      best = { entry, daysAhead, inProgress };
      bestScore = score;
    }
  }

  return best;
}

export function describeUpcomingEntry(
  upcoming: UpcomingTimetableEntry<{
    dayOfWeek: TimetableDay;
    startMinute: number;
    endMinute: number;
  }>,
): string {
  const time = formatTimeRange(
    upcoming.entry.startMinute,
    upcoming.entry.endMinute,
  );

  if (upcoming.inProgress) {
    return `In progress · ${time}`;
  }

  if (upcoming.daysAhead === 0) {
    return `Today · ${time}`;
  }

  if (upcoming.daysAhead === 1) {
    return `Tomorrow · ${time}`;
  }

  return `${DAY_LABELS[upcoming.entry.dayOfWeek]} · ${time}`;
}
