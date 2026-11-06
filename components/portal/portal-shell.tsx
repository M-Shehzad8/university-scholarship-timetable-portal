import Link from "next/link";
import type { ReactNode } from "react";

import { PortalNav } from "@/components/portal/portal-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";
import {
  getUserScopeLabel,
  ROLE_LABELS,
  roleBadgeTone,
} from "@/lib/auth/roles";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { filterNavigationByRole } from "@/lib/portal/navigation";

export function PortalShell({
  user,
  children,
}: {
  user: AuthenticatedUser;
  children: ReactNode;
}) {
  const navigation = filterNavigationByRole(user.role);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-zinc-900 focus:shadow-lg dark:focus:bg-zinc-900 dark:focus:text-zinc-50"
      >
        Skip to content
      </a>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-zinc-200 bg-white lg:w-72 lg:border-r lg:border-b-0 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex h-full flex-col gap-5 p-4 lg:sticky lg:top-0 lg:h-screen lg:p-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-sm font-semibold text-white"
              >
                UP
              </span>
              <span>
                <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  University Portal
                </span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  Academic services
                </span>
              </span>
            </Link>

            <PortalNav groups={navigation} />

            <div className="mt-auto hidden rounded-xl border border-zinc-200 bg-zinc-50 p-4 lg:block dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {user.name}
                </p>
                <Badge tone={roleBadgeTone(user.role)}>
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
              <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                {user.email}
              </p>
              <p className="mt-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                {getUserScopeLabel(user)}
              </p>
              <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-500">
                Secure database session · 7 days
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Signed in as {user.name}
                </p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-500">
                  {ROLE_LABELS[user.role]} · {getUserScopeLabel(user)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href="/"
                  className="hidden text-xs font-medium text-zinc-600 transition-colors hover:text-emerald-700 sm:inline dark:text-zinc-400 dark:hover:text-emerald-400"
                >
                  Public overview
                </Link>
                <form action={logout}>
                  <Button type="submit" variant="ghost" size="sm">
                    Sign out
                  </Button>
                </form>
              </div>
            </div>
          </header>

          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 outline-none sm:px-6 lg:px-8 lg:py-10"
          >
            {children}
          </main>

          <footer className="border-t border-zinc-200 px-4 py-4 text-xs text-zinc-500 sm:px-6 lg:px-8 dark:border-zinc-800 dark:text-zinc-400">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p>University Scholarship and Academic Timetable Portal</p>
              <p>Phase 2 · Authentication and roles</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
