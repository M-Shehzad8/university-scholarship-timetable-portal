import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { markNotificationReadAction } from "@/lib/notifications/actions";
import { NOTIFICATION_PRESENTATION } from "@/lib/notifications/labels";
import type { NotificationRow } from "@/lib/notifications/queries";
import { formatDateTime } from "@/lib/time/portal";
import { cn } from "@/lib/utils/cn";

export function NotificationList({
  notifications,
  showMarkRead = false,
  emptyTitle = "No notifications",
  emptyDescription = "Scholarship and timetable updates for your account will appear here.",
  className,
}: {
  notifications: NotificationRow[];
  showMarkRead?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className={cn("py-10", className)}
      />
    );
  }

  return (
    <ul className={cn("divide-y divide-zinc-200 dark:divide-zinc-800", className)}>
      {notifications.map((notification) => {
        const presentation = NOTIFICATION_PRESENTATION[notification.type];

        return (
          <li
            key={notification.id}
            className={cn(
              "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between",
              !notification.isRead && "bg-emerald-50/40 dark:bg-emerald-950/10",
            )}
          >
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {!notification.isRead ? (
                  <span
                    aria-label="Unread"
                    className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400"
                  />
                ) : null}
                <Badge tone={presentation.tone}>{presentation.label}</Badge>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDateTime(notification.createdAt)}
                </span>
              </div>
              <p
                className={cn(
                  "text-sm text-zinc-900 dark:text-zinc-100",
                  !notification.isRead && "font-semibold",
                )}
              >
                {notification.title}
              </p>
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {notification.message}
              </p>
            </div>

            {showMarkRead && !notification.isRead ? (
              <form action={markNotificationReadAction} className="shrink-0">
                <input
                  type="hidden"
                  name="notificationId"
                  value={notification.id}
                />
                <Button type="submit" variant="secondary" size="sm">
                  Mark as read
                </Button>
              </form>
            ) : (
              <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                {notification.isRead ? "Read" : "Unread"}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
