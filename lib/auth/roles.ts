import type { Role } from "@/lib/generated/prisma/enums";

import type { AuthenticatedUser } from "./types";

export const ALL_ROLES = [
  "STUDENT",
  "STAFF",
  "COORDINATOR",
] as const satisfies readonly Role[];

export const STAFF_ROLES = [
  "STAFF",
  "COORDINATOR",
] as const satisfies readonly Role[];

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Student",
  STAFF: "Staff",
  COORDINATOR: "Coordinator",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  STUDENT:
    "Browse scholarships, keep bookmarks, and view the timetable for the linked batch.",
  STAFF:
    "Maintain scholarship records and academic timetable data for the department.",
  COORDINATOR:
    "Manage user accounts and roles, and view department-wide oversight.",
};

export function roleBadgeTone(role: Role): "success" | "info" | "warning" {
  if (role === "COORDINATOR") {
    return "warning";
  }

  if (role === "STAFF") {
    return "info";
  }

  return "success";
}

export function canManageUsers(role: Role): boolean {
  return role === "COORDINATOR";
}

export function canViewOperations(role: Role): boolean {
  return role === "STAFF" || role === "COORDINATOR";
}

export function getUserScopeLabel(
  user: Pick<AuthenticatedUser, "role" | "batch" | "department">,
): string {
  if (user.role === "STUDENT") {
    return user.batch
      ? `Batch ${user.batch.name}-${user.batch.section}`
      : "No batch assigned";
  }

  return user.department
    ? `${user.department.name} (${user.department.code})`
    : "No department assigned";
}
