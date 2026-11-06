export type PortalNavItem = {
  href: string;
  label: string;
  description: string;
};

export type PortalNavGroup = {
  label: string;
  items: PortalNavItem[];
};

export const portalNavigation: PortalNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        description: "Role-based summaries and shortcuts",
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
      },
      {
        href: "/timetable",
        label: "Timetable",
        description: "Schedules, conflict checks, and room assignment",
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
      },
      {
        href: "/reports",
        label: "Reports",
        description: "Focused operational summaries",
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
      },
    ],
  },
];
