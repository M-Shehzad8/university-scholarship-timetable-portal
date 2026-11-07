import type { Metadata } from "next";
import Link from "next/link";

import { NotificationList } from "@/components/notifications/notification-list";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, type StatTone } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/auth/dal";
import {
  getUserScopeLabel,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  roleBadgeTone,
} from "@/lib/auth/roles";
import {
  getOperationalDashboardData,
  getStudentDashboardData,
} from "@/lib/dashboard/queries";
import type { Role } from "@/lib/generated/prisma/enums";
import {
  describeDeadline,
  formatDateOnly,
} from "@/lib/scholarships/rules";
import {
  DAY_LABELS,
  describeUpcomingEntry,
  formatEntrySlot,
  formatTimeRange,
  getPortalDayOfWeek,
  getPortalMinutes,
} from "@/lib/timetable/rules";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const instant = false;

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
    {
      href: "/notifications",
      title: "Notifications",
      description:
        "Read scholarship updates and timetable changes for your account.",
      action: "Open notifications",
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
        "Review live scholarship, timetable, room, and conflict summaries.",
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

type Metric = {
  label: string;
  value: string;
  detail: string;
  tone: StatTone;
  href?: string;
};

function conflictTypeLabel(type: "teacher" | "batch" | "room"): string {
  if (type === "teacher") {
    return "Teacher overlap";
  }

  if (type === "batch") {
    return "Batch overlap";
  }

  return "Room overlap";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const now = new Date();
  const todayDay = getPortalDayOfWeek(now);
  const nowMinutes = getPortalMinutes(now);
  const isStudent = user.role === "STUDENT";
  const roleShortcuts = shortcuts[user.role];

  const studentData = isStudent
    ? await getStudentDashboardData({
        userId: user.id,
        batchId: user.batch?.id ?? null,
        todayDay,
        nowMinutes,
      })
    : null;

  const operationalData =
    !isStudent && user.department
      ? await getOperationalDashboardData({
          userId: user.id,
          departmentId: user.department.id,
          todayDay,
          nowMinutes,
        })
      : null;

  const metrics: Metric[] = studentData
    ? [
        {
          label: "Active scholarships",
          value: String(studentData.scholarshipStats.active),
          detail: "Published opportunities with an open deadline",
          tone: "emerald",
          href: "/scholarships",
        },
        {
          label: "Deadlines soon",
          value: String(studentData.scholarshipStats.closingSoon),
          detail: "Closing within the next 14 days",
          tone: "amber",
          href: "/scholarships?deadline=soon",
        },
        {
          label: "Saved scholarships",
          value: String(studentData.scholarshipStats.saved),
          detail: "Bookmarks on your account",
          tone: "sky",
          href: "/scholarships?view=saved",
        },
        {
          label: "Today's classes",
          value: String(studentData.todayEntries.length),
          detail: user.batch
            ? `${DAY_LABELS[todayDay]} for ${user.batch.name}-${user.batch.section}`
            : "Link a batch to see your schedule",
          tone: "zinc",
          href: "/timetable",
        },
        {
          label: "Next class",
          value: studentData.upcoming
            ? studentData.upcoming.entry.course.code
            : "—",
          detail: studentData.upcoming
            ? `${describeUpcomingEntry(studentData.upcoming)} · Room ${studentData.upcoming.entry.room.roomNumber}`
            : "No class is currently scheduled",
          tone: "emerald",
          href: "/timetable",
        },
      ]
    : operationalData
      ? [
          {
            label: "Active scholarships",
            value: String(operationalData.scholarshipStats.active),
            detail: "Published opportunities with an open deadline",
            tone: "emerald",
            href: "/scholarships",
          },
          {
            label: "Expiring soon",
            value: String(operationalData.scholarshipStats.closingSoon),
            detail: "Closing within the next 14 days",
            tone: "amber",
            href: "/scholarships?status=active",
          },
          {
            label: "Classes scheduled",
            value: String(operationalData.timetableStats.totalClasses),
            detail: "Timetable rows across all department batches",
            tone: "sky",
            href: "/timetable",
          },
          {
            label: "Today's classes",
            value: String(operationalData.timetableStats.todayClasses),
            detail: `${DAY_LABELS[todayDay]} across the department`,
            tone: "zinc",
            href: `/timetable?day=today`,
          },
          {
            label: "Free rooms now",
            value: String(operationalData.freeRooms.length),
            detail: `Of ${operationalData.timetableStats.totalRooms} department rooms`,
            tone: "emerald",
            href: "/rooms",
          },
          {
            label: "Timetable conflicts",
            value: String(operationalData.conflicts.length),
            detail:
              operationalData.conflicts.length === 0
                ? "No overlapping teacher, batch, or room assignments"
                : "Overlaps requiring staff attention",
            tone: operationalData.conflicts.length === 0 ? "emerald" : "amber",
            href: "/reports",
          },
          ...(user.role === "COORDINATOR"
            ? [
                {
                  label: "Active accounts",
                  value: String(operationalData.activeAccounts),
                  detail: "Signed-in users with active portal access",
                  tone: "zinc" as const,
                  href: "/users",
                },
              ]
            : []),
        ]
      : [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Portal overview"
        title={`Welcome back, ${user.name}`}
        description={`This is the ${ROLE_LABELS[user.role].toLowerCase()} view. ${
          isStudent
            ? "It connects scholarship deadlines with your own class schedule."
            : "It connects scholarship activity with timetable, room, and conflict signals."
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

      {!isStudent && !user.department ? (
        <Alert
          tone="warning"
          title="No department is linked to this account."
        >
          Scholarship figures are still available, but timetable, room, and
          conflict summaries need a department scope. Ask the coordinator to
          update your account.
        </Alert>
      ) : null}

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
              ? "Live values only cover opportunities and classes relevant to you."
              : "Live values cover the scholarship catalogue and the department timetable."}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <StatCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              detail={metric.detail}
              tone={metric.tone}
              href={metric.href}
            />
          ))}
        </div>
      </section>

      {studentData ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Next class</CardTitle>
                <Badge tone="info">{DAY_LABELS[todayDay]}</Badge>
              </div>
              <CardDescription>
                The next scheduled class for your linked batch, including its
                assigned room.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentData.upcoming ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="success">
                      {describeUpcomingEntry(studentData.upcoming)}
                    </Badge>
                    <Badge tone="neutral">
                      {studentData.upcoming.entry.batch.name}-
                      {studentData.upcoming.entry.batch.section}
                    </Badge>
                  </div>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {studentData.upcoming.entry.course.code} ·{" "}
                    {studentData.upcoming.entry.course.title}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {studentData.upcoming.entry.teacher.name} · Room{" "}
                    {studentData.upcoming.entry.room.roomNumber}
                    {studentData.upcoming.entry.room.building
                      ? ` (${studentData.upcoming.entry.room.building})`
                      : ""}
                  </p>
                  <Link
                    href="/timetable"
                    className="inline-block text-sm font-medium text-emerald-700 dark:text-emerald-400"
                  >
                    Open full timetable →
                  </Link>
                </div>
              ) : (
                <EmptyState
                  title="No upcoming class"
                  description={
                    user.batch
                      ? "Staff have not scheduled a class for your batch yet."
                      : "Ask the coordinator to link your account to a batch."
                  }
                  className="py-8"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Closing soon</CardTitle>
                <Badge
                  tone={
                    studentData.deadlines.length > 0 ? "warning" : "success"
                  }
                >
                  {studentData.deadlines.length} upcoming
                </Badge>
              </div>
              <CardDescription>
                Published scholarships closing within 14 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentData.deadlines.length === 0 ? (
                <EmptyState
                  title="No immediate deadlines"
                  description="No published scholarship closes in the next 14 days. Browse the full catalogue for later opportunities."
                  className="py-8"
                />
              ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {studentData.deadlines.map((deadline) => (
                    <li
                      key={deadline.id}
                      className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0"
                    >
                      <Link
                        href={`/scholarships/${deadline.id}`}
                        className="text-sm font-medium text-zinc-900 hover:text-emerald-700 dark:text-zinc-100 dark:hover:text-emerald-400"
                      >
                        {deadline.title}
                      </Link>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {deadline.provider} · {formatDateOnly(deadline.deadline)}{" "}
                        · {describeDeadline(deadline.deadline)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {operationalData ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Today at a glance</CardTitle>
                <Badge tone="info">{DAY_LABELS[todayDay]}</Badge>
              </div>
              <CardDescription>
                {operationalData.todayEntries.length} class
                {operationalData.todayEntries.length === 1 ? "" : "es"}{" "}
                scheduled for today.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {operationalData.todayEntries.length === 0 ? (
                <EmptyState
                  title="No classes today"
                  description="There are no timetable rows for the current portal weekday."
                  className="py-8"
                />
              ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {operationalData.todayEntries.slice(0, 6).map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {entry.course.code} · {entry.course.title}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {entry.batch.name}-{entry.batch.section} ·{" "}
                          {entry.teacher.name} · Room {entry.room.roomNumber}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {formatTimeRange(entry.startMinute, entry.endMinute)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Rooms right now</CardTitle>
                <Badge
                  tone={
                    operationalData.freeRooms.length > 0 ? "success" : "warning"
                  }
                >
                  {operationalData.freeRooms.length} free
                </Badge>
              </div>
              <CardDescription>
                Based on the current portal time, not a chosen slot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  Free rooms
                </p>
                {operationalData.freeRooms.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Every department room is in use right now.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {operationalData.freeRooms.map((room) => (
                      <Badge key={room.id} tone="success">
                        {room.roomNumber}
                        {room.building ? ` · ${room.building}` : ""}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  In use
                </p>
                {operationalData.busyRooms.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    No room is occupied in the current time slot.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {operationalData.busyRooms.map((room) => (
                      <Badge key={room.id} tone="warning">
                        {room.roomNumber}
                        {room.building ? ` · ${room.building}` : ""}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Link
                href="/rooms"
                className="inline-block text-sm font-medium text-emerald-700 dark:text-emerald-400"
              >
                Review room schedules →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Conflict watch</CardTitle>
                <Badge
                  tone={
                    operationalData.conflicts.length === 0 ? "success" : "danger"
                  }
                >
                  {operationalData.conflicts.length} issue
                  {operationalData.conflicts.length === 1 ? "" : "s"}
                </Badge>
              </div>
              <CardDescription>
                Teacher, batch, and room overlaps in the department timetable.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {operationalData.conflicts.length === 0 ? (
                <EmptyState
                  title="No conflicts detected"
                  description="Every class currently has a distinct teacher, batch, and room in its time slot."
                  className="py-8"
                />
              ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {operationalData.conflicts.slice(0, 5).map((conflict) => (
                    <li
                      key={`${conflict.type}-${conflict.first.id}-${conflict.second.id}`}
                      className="space-y-1 py-3 first:pt-0 last:pb-0"
                    >
                      <Badge tone="danger">
                        {conflictTypeLabel(conflict.type)}
                      </Badge>
                      <p className="text-sm text-zinc-900 dark:text-zinc-100">
                        {conflict.first.course.code} and{" "}
                        {conflict.second.course.code}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatEntrySlot(
                          conflict.first.dayOfWeek,
                          conflict.first.startMinute,
                          conflict.first.endMinute,
                        )}{" "}
                        · {conflict.first.batch.name}-
                        {conflict.first.batch.section} and{" "}
                        {conflict.second.batch.name}-
                        {conflict.second.batch.section}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/reports"
                className="mt-4 inline-block text-sm font-medium text-emerald-700 dark:text-emerald-400"
              >
                Open conflict summary →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Recent notifications</CardTitle>
                <Link
                  href="/notifications"
                  className="text-xs font-medium text-emerald-700 dark:text-emerald-400"
                >
                  View all
                </Link>
              </div>
              <CardDescription>
                Your latest account updates across both modules.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <NotificationList
                notifications={operationalData.recentNotifications}
                emptyTitle="No notifications"
                emptyDescription="Scholarship publications and timetable changes will appear here."
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {studentData ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Recent notifications</CardTitle>
                <Link
                  href="/notifications"
                  className="text-xs font-medium text-emerald-700 dark:text-emerald-400"
                >
                  View all
                </Link>
              </div>
              <CardDescription>
                Scholarship deadlines and timetable changes for your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <NotificationList
                notifications={studentData.recentNotifications}
                emptyTitle="No notifications"
                emptyDescription="Updates about scholarships and your timetable will appear here."
              />
            </CardContent>
          </Card>

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
        </div>
      ) : null}

      {operationalData ? (
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
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Account</dt>
                <dd className="mt-1 font-medium break-all text-zinc-900 dark:text-zinc-100">
                  {user.email}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Scope</dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                  {getUserScopeLabel(user)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Enforcement</dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                  Server-side session and role checks
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ) : null}

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
    </div>
  );
}
