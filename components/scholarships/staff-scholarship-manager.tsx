import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deriveEffectiveState,
  formatDateOnly,
  formatDateTime,
  isActiveState,
  SCHOLARSHIP_STATUS_LABELS,
} from "@/lib/scholarships/rules";
import type {
  StaffScholarshipFilters,
  getStaffScholarships,
  getStaffScholarshipStats,
} from "@/lib/scholarships/queries";
import { buildStaffCatalogueHref } from "@/lib/scholarships/urls";

import { ScholarshipQuickAction } from "./scholarship-management-actions";
import { ScholarshipStatusBadge } from "./scholarship-status-badge";
import { StaffScholarshipFiltersForm } from "./scholarship-filters";

type StaffRecord = Awaited<ReturnType<typeof getStaffScholarships>>[number];
type StaffStats = Awaited<ReturnType<typeof getStaffScholarshipStats>>;

export function StaffScholarshipManager({
  scholarships,
  stats,
  filters,
  categories,
  statusMessage,
  errorMessage,
}: {
  scholarships: StaffRecord[];
  stats: StaffStats;
  filters: StaffScholarshipFilters;
  categories: string[];
  statusMessage?: string;
  errorMessage?: string;
}) {
  const returnTo = buildStaffCatalogueHref(filters);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Scholarship management"
        title="Maintain the scholarship catalogue"
        description="Create drafts, publish verified opportunities, and keep deadlines, eligibility, documents, and official links accurate. Students only see active records."
        actions={
          <Link
            href="/scholarships/new"
            className={buttonStyles({ size: "md" })}
          >
            New scholarship
          </Link>
        }
      />

      {statusMessage ? (
        <Alert tone="success" title="Catalogue updated">
          {statusMessage}
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert tone="error" title="Action not completed">
          {errorMessage}
        </Alert>
      ) : null}

      <section
        aria-label="Scholarship management summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <StatCard
          label="Total records"
          value={String(stats.total)}
          detail="Every draft, published, expired, and archived record"
          tone="zinc"
        />
        <StatCard
          label="Draft"
          value={String(stats.draft)}
          detail="Hidden from students until published"
          tone="sky"
        />
        <StatCard
          label="Active"
          value={String(stats.active)}
          detail="Published with a deadline that has not passed"
          tone="emerald"
        />
        <StatCard
          label="Closing soon"
          value={String(stats.closingSoon)}
          detail="Active records closing within 14 days"
          tone="amber"
        />
        <StatCard
          label="Expired"
          value={String(stats.expired)}
          detail="Explicitly expired or published past the deadline"
          tone="zinc"
        />
        <StatCard
          label="Archived"
          value={String(stats.archived)}
          detail="Hidden from students but kept for reference"
          tone="zinc"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Search and filter records</CardTitle>
          <CardDescription>
            Expired includes published records whose deadline has passed, even
            when their stored status is still Published.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffScholarshipFiltersForm
            filters={filters}
            categories={categories}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>All scholarship records</CardTitle>
              <CardDescription>
                The last-updated timestamp changes whenever staff save fields or
                change status.
              </CardDescription>
            </div>
            <Badge tone="neutral">
              {scholarships.length} result
              {scholarships.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scholarship</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Saved</TableHead>
                <TableHead>Last updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scholarships.length === 0 ? (
                <tr>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      title="No scholarship records match this view"
                      description="Clear the filters or create the first draft record."
                      action={
                        <Link
                          href="/scholarships/new"
                          className={buttonStyles({ size: "md" })}
                        >
                          New scholarship
                        </Link>
                      }
                      className="py-10"
                    />
                  </TableCell>
                </tr>
              ) : (
                scholarships.map((scholarship) => {
                  const state = deriveEffectiveState(
                    scholarship.status,
                    scholarship.deadline,
                  );
                  const storedStatusDiffers =
                    (state === "EXPIRED" &&
                      scholarship.status === "PUBLISHED") ||
                    (isActiveState(state) &&
                      scholarship.status !== "PUBLISHED");

                  return (
                    <TableRow key={scholarship.id}>
                      <TableCell className="min-w-56">
                        <Link
                          href={`/scholarships/${scholarship.id}`}
                          className="font-medium text-zinc-900 hover:text-emerald-700 dark:text-zinc-100 dark:hover:text-emerald-400"
                        >
                          {scholarship.title}
                        </Link>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {scholarship.provider}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs">
                        {scholarship.category ?? "Uncategorised"}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDateOnly(scholarship.deadline)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <ScholarshipStatusBadge state={state} />
                          {storedStatusDiffers ? (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              Stored:{" "}
                              {
                                SCHOLARSHIP_STATUS_LABELS[
                                  scholarship.status as keyof typeof SCHOLARSHIP_STATUS_LABELS
                                ]
                              }
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {scholarship._count.savedBy}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDateTime(scholarship.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/scholarships/${scholarship.id}`}
                            className={buttonStyles({
                              variant: "ghost",
                              size: "sm",
                            })}
                          >
                            View
                          </Link>
                          <Link
                            href={`/scholarships/${scholarship.id}/edit`}
                            className={buttonStyles({
                              variant: "secondary",
                              size: "sm",
                            })}
                          >
                            Edit
                          </Link>
                          <ScholarshipQuickAction
                            scholarshipId={scholarship.id}
                            state={state}
                            deadline={scholarship.deadline}
                            returnTo={returnTo}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
