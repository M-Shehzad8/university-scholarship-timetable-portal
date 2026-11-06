import type { Metadata } from "next";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, type StatTone } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/auth/dal";
import {
  getUserScopeLabel,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  roleBadgeTone,
} from "@/lib/auth/roles";
import type { Role } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const instant = false;

const studentMetrics: Array<{ label: string; detail: string; tone: StatTone }> =
  [
    {
      label: "Active scholarships",
      detail: "Published opportunities whose deadline has not passed",
      tone: "emerald",
    },
    {
      label: "Deadlines soon",
      detail: "Active scholarships closing within the next 14 days",
      tone: "amber",
    },
    {
      label: "Saved scholarships",
      detail: "Opportunities bookmarked by your account",
      tone: "sky",
    },
    {
      label: "Today's classes",
      detail: "Classes scheduled for your batch or section",
      tone: "zinc",
    },
    {
      label: "Next class",
      detail: "The next upcoming class and its assigned room",
      tone: "emerald",
    },
  ];

const staffMetrics: Array<{ label: string; detail: string; tone: StatTone }> = [
  {
    label: "Active scholarships",
    detail: "Currently published opportunities",
    tone: "emerald",
  },
  {
    label: "Expiring soon",
    detail: "Published scholarships closing within 14 days",
    tone: "amber",
  },
  {
    label: "Total rooms",
    detail: "Department rooms available for scheduling",
    tone: "sky",
  },
  {
    label: "Classes scheduled",
    detail: "Timetable entries across all batches",
    tone: "zinc",
  },
  {
    label: "Free rooms today",
    detail: "Rooms with no class in the current time slot",
    tone: "emerald",
  },
  {
    label: "Timetable conflicts",
    detail: "Overlaps requiring staff attention",
    tone: "amber",
  },
];

type Shortcut = {
  href: string;
  title: string;
  description: string;
  action: string;
};

const shortcuts: Record<Role, Shortcut[]> = {
  STUDENT: [
    {
      href: "/scholarships",
      title: "Scholarships",
      description:
        "Browse published opportunities, check deadlines, and save records for later.",
      action: "Open scholarships",
    },
    {
      href: "/timetable",
      title: "Timetable",
      description:
        "Review the weekly class schedule for your batch and section.",
      action: "Open timetable",
    },
  ],
  STAFF: [
    {
      href: "/scholarships",
      title: "Scholarships",
      description: "Create and maintain scholarship records for publication.",
      action: "Manage scholarships",
    },
    {
      href: "/timetable",
      title: "Timetable",
      description:
        "Prepare course, teacher, batch, room, and timetable records.",
      action: "Open timetable",
    },
    {
      href: "/reports",
      title: "Reports",
      description:
        "Review the operational summaries planned for staff and coordinators.",
      action: "Open reports",
    },
  ],
  COORDINATOR: [
    {
      href: "/users",
      title: "People",
      description:
        "Create accounts, assign one of the three roles, and deactivate access.",
      action: "Manage people",
    },
    {
      href: "/reports",
      title: "Reports",
      description:
        "Review department-wide scholarship and timetable oversight.",
      action: "Open reports",
    },
    {
      href: "/timetable",
      title: "Timetable",
      description:
        "Inspect schedules, conflicts, and room assignment across the department.",
      action: "Open timetable",
    },
  ],
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const isStudent = user.role === "STUDENT";
  const metrics = isStudent ? studentMetrics : staffMetrics;
  const roleShortcuts = shortcuts[user.role];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Portal overview"
        title={`Welcome back, ${user.name}`}
        description={`This is the ${ROLE_LABELS[user.role].toLowerCase()} view. ${
          isStudent
            ? "It focuses on opportunities, deadlines, and your own class schedule."
            : "It focuses on the information your role maintains and monitors."
        }`}
        actions={
          <Badge tone={roleBadgeTone(user.role)}>
            {ROLE_LABELS[user.role]}
          </Badge>
        }
      />

      {params.error === "forbidden" ? (
        <Alert tone="error" title="You do not have access to that page.">
          The portal blocked the request on the server. Use the navigation items
          available to your role.
        </Alert>
      ) : null}

      <Alert title="Authentication is live; module values arrive in later phases.">
        Your identity, role, and access are enforced now. Scholarship figures
        arrive with Phase 3, timetable figures with Phase 4, and final dashboard
        integration with Phase 5. The cards below show the agreed structure
        without pretending live data exists.
      </Alert>

      <section
        aria-labelledby="dashboard-metrics-heading"
        className="space-y-4"
      >
        <div>
          <h2
            id="dashboard-metrics-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {isStudent ? "Your student summary" : "Your operational summary"}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {isStudent
              ? "Only information that helps you act on opportunities and attend classes."
              : "Management signals stay practical: what is published, what is scheduled, and what needs attention."}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <StatCard
              key={metric.label}
              label={metric.label}
              value="—"
              detail={metric.detail}
              tone={metric.tone}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="shortcuts-heading" className="space-y-4">
        <h2
          id="shortcuts-heading"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Where to go next
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roleShortcuts.map((shortcut) => (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50/30 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20"
            >
              <CardTitle>{shortcut.title}</CardTitle>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {shortcut.description}
              </p>
              <p className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {shortcut.action}{" "}
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

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Your access</CardTitle>
              <Badge tone={roleBadgeTone(user.role)}>
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
            <CardDescription>{ROLE_DESCRIPTIONS[user.role]}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Account</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {user.email}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Scope</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {getUserScopeLabel(user)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Status</dt>
                <dd className="font-medium text-emerald-700 dark:text-emerald-400">
                  Active
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How access is enforced</CardTitle>
            <CardDescription>
              Navigation filtering is only a usability measure. Every protected
              page and server action checks the session and role again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600"
                />
                Unauthenticated requests are redirected to the login page.
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600"
                />
                Role checks run on the server before restricted data or actions.
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600"
                />
                Signing out deletes the session record and the HTTP-only cookie.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
