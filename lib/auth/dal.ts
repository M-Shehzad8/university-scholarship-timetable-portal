import { cache } from "react";

import { redirect } from "next/navigation";

import type { Role } from "@/lib/generated/prisma/enums";

import { getSessionUser } from "./session";
import type { AuthenticatedUser } from "./types";

export const getCurrentUser = cache(
  async (): Promise<AuthenticatedUser | null> => {
    return getSessionUser();
  },
);

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(
  allowedRoles: readonly Role[],
): Promise<AuthenticatedUser> {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard?error=forbidden");
  }

  return user;
}

export async function requireStaffOrCoordinator(): Promise<AuthenticatedUser> {
  return requireRole(["STAFF", "COORDINATOR"]);
}

export async function requireCoordinator(): Promise<AuthenticatedUser> {
  return requireRole(["COORDINATOR"]);
}
