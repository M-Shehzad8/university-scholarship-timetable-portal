const modules = [
  {
    name: "Scholarships",
    summary:
      "Browse scholarship opportunities maintained by authorised staff, review eligibility and required documents, and keep track of application deadlines.",
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

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
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
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            Foundation release
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Scholarship and academic timetable portal
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            Two essential academic services, in one place.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            A focused portal where students can discover scholarship
            opportunities and follow their class schedules, while authorised
            staff maintain accurate information for both.
          </p>
        </div>

        <section aria-labelledby="modules-heading" className="mt-14">
          <h2 id="modules-heading" className="sr-only">
            Portal modules
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {modules.map((module) => (
              <article
                key={module.name}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {module.name}
                </h3>
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
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 px-6 py-6 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:text-zinc-400">
          <p>University Scholarship and Academic Timetable Portal</p>
          <p>Foundation release · Phase 0</p>
        </div>
      </footer>
    </div>
  );
}
