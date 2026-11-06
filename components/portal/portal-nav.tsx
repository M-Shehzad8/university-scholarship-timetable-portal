"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { portalNavigation } from "@/lib/portal/navigation";
import { cn } from "@/lib/utils/cn";

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Portal sections"
      className="w-full overflow-x-auto lg:overflow-visible"
    >
      <div className="flex gap-1 lg:flex-col lg:gap-6">
        {portalNavigation.map((group) => (
          <div
            key={group.label}
            className="flex shrink-0 gap-1 lg:flex-col lg:gap-1"
          >
            <p className="hidden px-3 pb-1 text-xs font-semibold tracking-wider text-zinc-400 uppercase lg:block dark:text-zinc-500">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.description}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
