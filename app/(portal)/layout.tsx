import type { ReactNode } from "react";

import { PortalShell } from "@/components/portal/portal-shell";
import { requireUser } from "@/lib/auth/dal";

export const instant = false;

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();

  return <PortalShell user={user}>{children}</PortalShell>;
}
