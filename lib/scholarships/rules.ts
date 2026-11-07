// Scholarship deadline rules are intentionally dependency-free so the same
// helpers can be reused by the app, server actions, and the seed script.

import { daysBetweenDateOnly, todayDateOnly } from "../time/portal";

export {
  addDaysDateOnly,
  daysBetweenDateOnly,
  formatDateOnly,
  formatDateTime,
  parseDateInput,
  PORTAL_TIME_ZONE,
  toDateInputValue,
  todayDateOnly,
} from "../time/portal";

export const CLOSING_SOON_DAYS = 14;

export type ScholarshipStatusValue =
  "DRAFT" | "PUBLISHED" | "ARCHIVED" | "EXPIRED";

export type ScholarshipEffectiveState =
  "DRAFT" | "ACTIVE" | "CLOSING_SOON" | "EXPIRED" | "ARCHIVED";

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
