// Scholarship deadline rules are intentionally dependency-free so the same
// helpers can be reused by the app, server actions, and the seed script.

export const PORTAL_TIME_ZONE = "Asia/Karachi";
export const CLOSING_SOON_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ScholarshipStatusValue =
  "DRAFT" | "PUBLISHED" | "ARCHIVED" | "EXPIRED";

export type ScholarshipEffectiveState =
  "DRAFT" | "ACTIVE" | "CLOSING_SOON" | "EXPIRED" | "ARCHIVED";

/**
 * Returns the portal's current calendar date as a UTC-midnight Date.
 * A fixed time zone keeps "today" deterministic regardless of where the
 * server process happens to run.
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

/**
 * A stored status and a calendar deadline together determine what a user can
 * actually do. A published record whose deadline has passed is effectively
 * expired without rewriting its stored status.
 */
export function deriveEffectiveState(
  status: ScholarshipStatusValue,
  deadline: Date,
  now: Date = new Date(),
): ScholarshipEffectiveState {
  if (status === "DRAFT") {
    return "DRAFT";
  }

  if (status === "ARCHIVED") {
    return "ARCHIVED";
  }

  if (status === "EXPIRED") {
    return "EXPIRED";
  }

  const daysRemaining = daysBetweenDateOnly(todayDateOnly(now), deadline);

  if (daysRemaining < 0) {
    return "EXPIRED";
  }

  if (daysRemaining <= CLOSING_SOON_DAYS) {
    return "CLOSING_SOON";
  }

  return "ACTIVE";
}

export function isActiveState(state: ScholarshipEffectiveState): boolean {
  return state === "ACTIVE" || state === "CLOSING_SOON";
}

export function isDeadlinePassed(
  deadline: Date,
  now: Date = new Date(),
): boolean {
  return daysBetweenDateOnly(todayDateOnly(now), deadline) < 0;
}

export function describeDeadline(
  deadline: Date,
  now: Date = new Date(),
): string {
  const daysRemaining = daysBetweenDateOnly(todayDateOnly(now), deadline);

  if (daysRemaining < 0) {
    return `Closed ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? "" : "s"} ago`;
  }

  if (daysRemaining === 0) {
    return "Closes today";
  }

  return `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`;
}

export const SCHOLARSHIP_STATE_LABELS: Record<
  ScholarshipEffectiveState,
  string
> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  CLOSING_SOON: "Closing soon",
  EXPIRED: "Expired",
  ARCHIVED: "Archived",
};

export const SCHOLARSHIP_STATUS_LABELS: Record<ScholarshipStatusValue, string> =
  {
    DRAFT: "Draft",
    PUBLISHED: "Published",
    ARCHIVED: "Archived",
    EXPIRED: "Expired",
  };
