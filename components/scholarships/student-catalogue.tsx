import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import type {
  StudentCatalogueFilters,
  getStudentCatalogue,
  getStudentScholarshipStats,
} from "@/lib/scholarships/queries";
import { buildStudentCatalogueHref } from "@/lib/scholarships/urls";

import { ScholarshipCard } from "./scholarship-card";
import { StudentScholarshipFilters } from "./scholarship-filters";

type CatalogueRecord = Awaited<ReturnType<typeof getStudentCatalogue>>[number];
type StudentStats = Awaited<ReturnType<typeof getStudentScholarshipStats>>;

export function StudentCatalogue({
  scholarships,
  stats,
  filters,
  categories,
  statusMessage,
  errorMessage,
}: {
  scholarships: CatalogueRecord[];
  stats: StudentStats;
  filters: StudentCatalogueFilters;
  categories: string[];
  statusMessage?: string;
  errorMessage?: string;
}) {
  const returnTo = buildStudentCatalogueHref(filters);
  const isSavedView = filters.view === "saved";
  const hasFilters = Boolean(
    filters.q || filters.category || filters.deadline !== "active",
  );
  const clearHref = isSavedView ? "/scholarships?view=saved" : "/scholarships";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Scholarship catalogue"
        title="Find support for your studies"
        description="Browse open opportunities maintained by university staff, check eligibility and required documents, then apply through the official provider."
        actions={
          <Link
            href="/scholarships?view=saved"
            className={buttonStyles({ variant: "secondary", size: "md" })}
          >
            Saved ({stats.saved})
          </Link>
        }
      />

      {statusMessage ? (
        <Alert tone="success" title="Saved list updated">
          {statusMessage}
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert tone="error" title="Action not completed">
          {errorMessage}
        </Alert>
      ) : null}

      <section
        aria-label="Scholarship summary"
        className="grid gap-4 sm:grid-cols-3"
      >
        <StatCard
          label="Open opportunities"
          value={String(stats.active)}
          detail="Published records whose deadline has not passed"
          tone="emerald"
        />
        <StatCard
          label="Closing soon"
          value={String(stats.closingSoon)}
          detail="Open records closing within 14 days"
          tone="amber"
        />
        <StatCard
          label="Saved"
          value={String(stats.saved)}
          detail="Opportunities bookmarked by your account"
          tone="sky"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Search and filter</CardTitle>
          <CardDescription>
            Search by title, provider, or keyword. Expired records remain
            readable but cannot be newly saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentScholarshipFilters
            filters={filters}
            categories={categories}
          />
        </CardContent>
      </Card>

      <section aria-labelledby="results-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="results-heading"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {isSavedView ? "Saved opportunities" : "Opportunities"}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {isSavedView
                ? "Your saved open and expired records. Expired items stay readable as a reference."
                : "Only published opportunities whose deadline has not passed appear by default."}
            </p>
          </div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {scholarships.length} result{scholarships.length === 1 ? "" : "s"}
          </span>
        </div>

        {scholarships.length === 0 ? (
          <Card>
            <EmptyState
              title={
                isSavedView
                  ? "No saved scholarships match this view"
                  : "No scholarships match these filters"
              }
              description={
                isSavedView
                  ? "Save an open opportunity from the catalogue, or clear the filters to see everything you have saved."
                  : "Try a different keyword or category, or clear the filters to see all currently open opportunities."
              }
              action={
                <Link
                  href={clearHref}
                  className={buttonStyles({ variant: "secondary", size: "md" })}
                >
                  {hasFilters ? "Clear filters" : "Browse all opportunities"}
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {scholarships.map((scholarship) => (
              <ScholarshipCard
                key={scholarship.id}
                scholarship={scholarship}
                returnTo={returnTo}
              />
            ))}
          </div>
        )}
      </section>

      {!isSavedView ? (
        <Alert title="Archived records are hidden">
          Students can open expired records by direct reference, but archived
          and draft records stay out of the student catalogue.
        </Alert>
      ) : null}
    </div>
  );
}
