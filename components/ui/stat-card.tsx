import Link from "next/link";

import { cn } from "@/lib/utils/cn";

const statTones = {
  emerald: "bg-emerald-600 dark:bg-emerald-400",
  sky: "bg-sky-600 dark:bg-sky-400",
  amber: "bg-amber-500 dark:bg-amber-400",
  zinc: "bg-zinc-400 dark:bg-zinc-500",
};

export type StatTone = keyof typeof statTones;

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: StatTone;
  href?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  detail,
  tone = "emerald",
  href,
  className,
}: StatCardProps) {
  const classes = cn(
    "relative block overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm",
    href &&
      "transition-colors hover:border-emerald-300 hover:bg-emerald-50/30 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20",
    "dark:border-zinc-800 dark:bg-zinc-900",
    className,
  );

  const content = (
    <>
      <span
        aria-hidden="true"
        className={cn("absolute inset-x-0 top-0 h-1", statTones[tone])}
      />
      <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {detail}
      </p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
