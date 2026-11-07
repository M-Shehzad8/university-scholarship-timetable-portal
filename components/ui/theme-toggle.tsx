"use client";

import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const STORAGE_KEY = "theme";

export function ThemeToggle({ className }: { className?: string }) {
  function toggleTheme() {
    const root = document.documentElement;
    const nextDark = !root.classList.contains("dark");

    root.classList.toggle("dark", nextDark);
    root.style.colorScheme = nextDark ? "dark" : "light";

    try {
      window.localStorage.setItem(STORAGE_KEY, nextDark ? "dark" : "light");
    } catch {
      // Storage can be unavailable in restricted browsing modes. The toggle
      // still works for the current page in that case.
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      title="Toggle color theme"
      className={buttonStyles({
        variant: "ghost",
        size: "sm",
        className: cn("w-9 px-0", className),
      })}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hidden h-4 w-4 dark:block"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 dark:hidden"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
      </svg>
    </button>
  );
}
