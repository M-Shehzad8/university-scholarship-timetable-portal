// Portal-wide calendar and display helpers. Keeping one fixed time zone makes
// "today" and "now" deterministic regardless of where the server process runs.

export const PORTAL_TIME_ZONE = "Asia/Karachi";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the portal's current calendar date as a UTC-midnight Date.
 */
export function todayDateOnly(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PORTAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day));
}

export function addDaysDateOnly(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function daysBetweenDateOnly(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

/** Converts a `@db.Date` value (or a UTC-midnight Date) to `YYYY-MM-DD`. */
export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Parses a `YYYY-MM-DD` form value into a UTC-midnight Date.
 * Returns null for impossible dates such as 2026-02-31.
 */
export function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function formatDateOnly(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PORTAL_TIME_ZONE,
  }).format(date);
}
