import type { Metadata } from "next";
import Link from "next/link";

import { NotificationList } from "@/components/notifications/notification-list";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/auth/dal";
import { markAllNotificationsReadAction } from "@/lib/notifications/actions";
import {
  getNotificationSummary,
  getNotifications,
} from "@/lib/notifications/queries";
import { notificationFilterSchema } from "@/lib/validation/notifications";

export const metadata: Metadata = {
  title: "Notifications",
};

export const instant = false;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const raw = await searchParams;
  const parsed = notificationFilterSchema.safeParse({
    view: first(raw.view),
  });
  const view = parsed.success ? parsed.data.view : "all";

  const [notifications, summary] = await Promise.all([
    getNotifications(user.id, view),
    getNotificationSummary(user.id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account"
        title="Notifications"
        description="Scholarship publications, deadline reminders, and timetable changes for your account. Only your own notifications are visible."
        actions={
          <Badge tone={summary.unread > 0 ? "warning" : "success"}>
            {summary.unread > 0
              ? `${summary.unread} unread`
              : "All caught up"}
          </Badge>
        }
      />

      <section
        aria-label="Notification summary"
        className="grid gap-4 sm:grid-cols-3"
      >
        <StatCard
          label="All notifications"
          value={String(summary.total)}
          detail="Messages stored for your account"
          tone="sky"
        />
        <StatCard
          label="Unread"
          value={String(summary.unread)}
          detail="Updates you have not opened yet"
          tone="amber"
        />
        <StatCard
          label="Read"
          value={String(summary.read)}
          detail="Updates already acknowledged"
          tone="emerald"
        />
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>
                {view === "unread" ? "Unread notifications" : "All notifications"}
              </CardTitle>
              <CardDescription>
                Newest first. Mark individual messages read, or acknowledge
                everything at once.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/notifications"
                className={buttonStyles({
                  variant: view === "all" ? "primary" : "secondary",
                  size: "sm",
                })}
              >
                All ({summary.total})
              </Link>
              <Link
                href="/notifications?view=unread"
                className={buttonStyles({
                  variant: view === "unread" ? "primary" : "secondary",
                  size: "sm",
                })}
              >
                Unread ({summary.unread})
              </Link>
              {summary.unread > 0 ? (
                <form action={markAllNotificationsReadAction}>
                  <Button type="submit" variant="secondary" size="sm">
                    Mark all read
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <NotificationList
            notifications={notifications}
            showMarkRead
            emptyTitle={
              view === "unread"
                ? "No unread notifications"
                : "No notifications yet"
            }
            emptyDescription={
              view === "unread"
                ? "You have read every message. Switch to All to review earlier updates."
                : "When scholarships are published or your timetable changes, the update will appear here."
            }
          />
        </CardContent>
      </Card>

      <Alert title="How notifications stay safe">
        Each message is linked to a user account in the database. Read actions
        check the signed-in session and update only rows owned by that account.
      </Alert>
    </div>
  );
}
