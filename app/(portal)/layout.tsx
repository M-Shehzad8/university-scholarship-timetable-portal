import type { ReactNode } from "react";

import { PortalShell } from "@/components/portal/portal-shell";
import { requireUser } from "@/lib/auth/dal";
import { getUnreadNotificationCount } from "@/lib/notifications/queries";

export const instant = false;

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const unreadCount = await getUnreadNotificationCount(user.id);

  return (
    <PortalShell user={user} unreadCount={unreadCount}>
      {children}
    </PortalShell>
  );
}
