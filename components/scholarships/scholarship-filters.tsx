import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  StaffScholarshipFilters,
  StudentCatalogueFilters,
} from "@/lib/scholarships/queries";
import { buildStudentCatalogueHref } from "@/lib/scholarships/urls";
import { cn } from "@/lib/utils/cn";

function FilterActions({ clearHref }: { clearHref: string }) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <button type="submit" className={buttonStyles({ size: "md" })}>
        Apply filters
      </button>
      <Link
        href={clearHref}
        className={buttonStyles({ variant: "secondary", size: "md" })}
      >
        Clear
      </Link>
    </div>
  );
}

export function StudentScholarshipFilters({
  filters,
  categories,
}: {
  filters: StudentCatalogueFilters;
  categories: string[];
}) {
  const isSavedView = filters.view === "saved";
  const allHref = buildStudentCatalogueHref({
    ...filters,
    view: "all",
    deadline: filters.deadline === "all" ? "active" : filters.deadline,
  });
  const savedHref = buildStudentCatalogueHref({
    ...filters,
    view: "saved",
    deadline: "all",
  });
  const clearHref = isSavedView ? "/scholarships?view=saved" : "/scholarships";

  return (
    <div className="space-y-5">
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Catalogue view"
      >
        <Link
          href={allHref}
          role="tab"
          aria-selected={!isSavedView}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            !isSavedView
              ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
          )}
        >
          All opportunities
        </Link>
        <Link
          href={savedHref}
          role="tab"
          aria-selected={isSavedView}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            isSavedView
              ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
          )}
        >
          Saved
        </Link>
      </div>

      <form method="get" className="grid gap-4 lg:grid-cols-4">
        {isSavedView ? <input type="hidden" name="view" value="saved" /> : null}

        <Field label="Search" htmlFor="student-search">
          <Input
            id="student-search"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Title, provider, or keyword"
            maxLength={100}
          />
        </Field>

        <Field label="Category" htmlFor="student-category">
          <Select
            id="student-category"
            name="category"
            defaultValue={filters.category}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Deadline" htmlFor="student-deadline">
          <Select
            id="student-deadline"
            name="deadline"
            defaultValue={filters.deadline}
          >
            {isSavedView ? (
              <option value="all">Any saved deadline</option>
            ) : null}
            <option value="active">Currently open</option>
            <option value="soon">Closing within 14 days</option>
            <option value="expired">Expired</option>
          </Select>
        </Field>

        <FilterActions clearHref={clearHref} />
      </form>
    </div>
  );
}

export function StaffScholarshipFiltersForm({
  filters,
  categories,
}: {
  filters: StaffScholarshipFilters;
  categories: string[];
}) {
  return (
    <form method="get" className="grid gap-4 lg:grid-cols-4">
      <Field label="Search" htmlFor="staff-search">
        <Input
          id="staff-search"
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Title, provider, or keyword"
          maxLength={100}
        />
      </Field>

      <Field label="Category" htmlFor="staff-category">
        <Select
          id="staff-category"
          name="category"
          defaultValue={filters.category}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="State" htmlFor="staff-status">
        <Select id="staff-status" name="status" defaultValue={filters.status}>
          <option value="all">All records</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="archived">Archived</option>
        </Select>
      </Field>

      <FilterActions clearHref="/scholarships" />
    </form>
  );
}
