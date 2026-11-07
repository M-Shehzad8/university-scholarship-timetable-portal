import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const modules = [
  {
    name: "Scholarships",
    summary:
      "Browse opportunities maintained by authorised staff, review eligibility and required documents, and keep track of application deadlines.",
    points: [
      "Search and category filters",
      "Deadlines and official application links",
      "Saved scholarships for later review",
    ],
  },
  {
    name: "Timetable",
    summary:
      "View class schedules for a batch or section, with built-in checks that keep teachers, batches, and rooms free from overlapping classes.",
    points: [
      "Batch, teacher, and daily views",
      "Teacher, batch, and room conflict checks",
      "Automatic assignment of a free room",
    ],
  },
];

const boundaries = [
  "No scholarship scraping or automatic applications",
  "No automatic generation of the complete timetable",
  "No attendance, fees, hostel, or full ERP features",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-sm font-semibold text-white"
            >
              UP
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                University Portal
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Academic services
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-14 sm:py-20">
        <section className="max-w-3xl">
          <Badge tone="success">Secure access</Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            Two essential academic services, in one place.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            A focused portal where students can discover scholarship
            opportunities and follow their class schedules, while authorised
            staff maintain accurate information for both.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/login" className={buttonStyles({ size: "lg" })}>
              Sign in to the portal
            </Link>
            <Link
              href="/login"
              className={buttonStyles({ variant: "secondary", size: "lg" })}
            >
              Explore the modules
            </Link>
          </div>
        </section>

        <section aria-labelledby="modules-heading" className="mt-16">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="modules-heading"
                className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
              >
                The two modules
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Shared authentication, dashboards, and data foundation; distinct
                academic workflows.
              </p>
            </div>
            <Badge tone="neutral">Scope locked</Badge>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {modules.map((module) => (
              <article
                key={module.name}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {module.name}
                  </h3>
                  <Badge tone="info">Preview</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {module.summary}
                </p>
                <ul className="mt-5 space-y-2">
                  {module.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                    >
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-emerald-600"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="mt-5 inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  Sign in to open {module.name.toLowerCase()}{" "}
                  <span aria-hidden="true" className="ml-1">
                    →
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="boundaries-heading"
          className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2
            id="boundaries-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            A deliberately focused project
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            The portal is a student academic services application, not a
            university ERP. Keeping the boundaries clear makes the system
            reliable and explainable.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {boundaries.map((boundary) => (
              <li
                key={boundary}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300"
              >
                {boundary}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-zinc-200 px-6 py-6 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:text-zinc-400">
          <p>University Scholarship and Academic Timetable Portal</p>
          <p>Secure access</p>
        </div>
      </footer>
    </div>
  );
}
