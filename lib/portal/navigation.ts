import type { Role } from "@/lib/generated/prisma/enums";

export type PortalNavItem = {
  href: string;
  label: string;
  description: string;
  roles: readonly Role[];
};

export type PortalNavGroup = {
  label: string;
  items: PortalNavItem[];
};

const ALL_ROLES = [
  "STUDENT",
  "STAFF",
  "COORDINATOR",
] as const satisfies readonly Role[];

const STAFF_ROLES = ["STAFF", "COORDINATOR"] as const satisfies readonly Role[];

export const portalNavigation: PortalNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        description: "Role-based summaries and shortcuts",
        roles: ALL_ROLES,
      },
      {
        href: "/notifications",
        label: "Notifications",
        description: "Scholarship and timetable updates for your account",
        roles: ALL_ROLES,
      },
    ],
  },
  {
    label: "Academic",
    items: [
      {
        href: "/scholarships",
        label: "Scholarships",
        description: "Browse, search, and maintain opportunities",
        roles: ALL_ROLES,
      },
      {
        href: "/timetable",
        label: "Timetable",
        description: "Schedules, conflict checks, and room assignment",
        roles: ALL_ROLES,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        href: "/rooms",
        label: "Rooms",
        description: "Department rooms and availability",
        roles: STAFF_ROLES,
      },
      {
        href: "/reports",
        label: "Reports",
        description: "Live operational summaries",
        roles: STAFF_ROLES,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        href: "/users",
        label: "People",
        description: "Users, roles, and staff access",
        roles: ["COORDINATOR"],
      },
    ],
  },
];

export function filterNavigationByRole(role: Role | null): PortalNavGroup[] {
  if (!role) {
    return [];
  }

  return portalNavigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}
