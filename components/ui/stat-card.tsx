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
  className?: string;
};

export function StatCard({
  label,
  value,
  detail,
  tone = "emerald",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
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
      <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        {detail}
      </p>
    </div>
  );
}
