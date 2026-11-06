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

export const metadata: Metadata = {
  title: "Dashboard",
};

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
      detail: "Opportunities bookmarked by the signed-in student",
      tone: "sky",
    },
    {
      label: "Today's classes",
      detail: "Classes scheduled for the student's batch or section",
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

const shortcuts = [
  {
    href: "/scholarships",
    title: "Scholarships",
    description:
      "Browse the student catalogue or prepare scholarship records for publication.",
    action: "Open scholarships",
  },
  {
    href: "/timetable",
    title: "Timetable",
    description:
      "Review the scheduling structure, conflict rules, and room-assignment flow.",
    action: "Open timetable",
  },
  {
    href: "/reports",
    title: "Reports",
    description:
      "See the focused operational summaries planned for staff and coordinators.",
    action: "Open reports",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Portal overview"
        title="Dashboard"
        description="A single place for students to track opportunities and classes, and for staff to monitor the academic information they maintain."
        actions={<Badge tone="warning">Phase 1 preview</Badge>}
      />

      <Alert title="Dashboard structure is ready; live values arrive with their modules.">
        Authentication and role-based dashboards are Phase 2. Scholarship data
        is Phase 3, timetable data is Phase 4, and final dashboard integration
        is Phase 5. Placeholder values below show the agreed information
        hierarchy without pretending the data exists.
      </Alert>

      <section
        aria-labelledby="student-dashboard-heading"
        className="space-y-4"
      >
        <div>
          <h2
            id="student-dashboard-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Student dashboard
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Only information that helps a student act: open opportunities,
            deadlines, saved records, and today&apos;s classes.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {studentMetrics.map((metric) => (
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

      <section aria-labelledby="staff-dashboard-heading" className="space-y-4">
        <div>
          <h2
            id="staff-dashboard-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Staff and coordinator dashboard
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Management signals stay practical: what is published, what is
            expiring, what is scheduled, and what needs attention.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {staffMetrics.map((metric) => (
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
        <div className="grid gap-4 md:grid-cols-3">
          {shortcuts.map((shortcut) => (
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

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Foundation notes</CardTitle>
              <CardDescription>
                What is intentionally true at the end of Phase 1.
              </CardDescription>
            </div>
            <Badge tone="info">Design baseline</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 text-sm leading-6 text-zinc-700 sm:grid-cols-3 dark:text-zinc-300">
            <li className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              Requirements, use cases, and role boundaries are documented and
              stable enough for implementation.
            </li>
            <li className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              The PostgreSQL schema, constraints, indexes, and migration are
              defined without adding live business logic early.
            </li>
            <li className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              Shared UI, navigation, and dashboard placeholders establish
              consistent patterns for later phases.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
