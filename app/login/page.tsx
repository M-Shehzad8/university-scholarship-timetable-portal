import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/dal";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export const instant = false;

const demoAccounts = [
  { role: "Coordinator", email: "coordinator@university.edu" },
  { role: "Staff", email: "staff@university.edu" },
  { role: "Student", email: "student@university.edu" },
  { role: "Inactive student", email: "inactive@university.edu" },
];

const modules = [
  {
    title: "Scholarship catalogue",
    description:
      "Students find opportunities; authorised staff maintain accurate records.",
  },
  {
    title: "Academic timetable",
    description:
      "Students follow their batch schedule; staff manage conflict-free entries.",
  },
];

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
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
          <Link
            href="/"
            className="text-xs font-medium text-zinc-600 transition-colors hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-400"
          >
            Public overview
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_430px] lg:items-center lg:py-16">
        <section className="max-w-xl">
          <Badge tone="success">Phase 2 · Secure access</Badge>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Sign in to your academic portal.
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
            One account gives you the dashboard, scholarship opportunities, and
            timetable information that match your role.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {modules.map((module) => (
              <div
                key={module.title}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {module.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  {module.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            <p className="font-semibold">Security at a glance</p>
            <p className="mt-1 opacity-90">
              Passwords are stored as bcrypt hashes. The browser receives only a
              random session token, and the server keeps the session record.
            </p>
          </div>
        </section>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>
                Use the email address and password issued by your coordinator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>

          {process.env.NODE_ENV !== "production" ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Development demo accounts</CardTitle>
                  <Badge tone="neutral">Local only</Badge>
                </div>
                <CardDescription>
                  Available after running <code>npm run db:seed</code>. Use the
                  password configured through <code>SEED_PASSWORD</code>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs">
                  {demoAccounts.map((account) => (
                    <li
                      key={account.email}
                      className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                    >
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {account.role}
                      </span>
                      <span className="font-mono text-zinc-900 dark:text-zinc-100">
                        {account.email}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>

      <footer className="border-t border-zinc-200 px-4 py-5 text-xs text-zinc-500 sm:px-6 dark:border-zinc-800 dark:text-zinc-400">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p>University Scholarship and Academic Timetable Portal</p>
          <p>Phase 2 · Authentication and roles</p>
        </div>
      </footer>
    </div>
  );
}
