import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookmarkButton } from "@/components/scholarships/bookmark-button";
import {
  DeleteScholarshipForm,
  ScholarshipManagementActions,
} from "@/components/scholarships/scholarship-management-actions";
import { ScholarshipStatusBadge } from "@/components/scholarships/scholarship-status-badge";
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
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/dal";
import { getScholarshipDetail } from "@/lib/scholarships/queries";
import {
  deriveEffectiveState,
  describeDeadline,
  formatDateOnly,
  formatDateTime,
  isActiveState,
  SCHOLARSHIP_STATUS_LABELS,
} from "@/lib/scholarships/rules";

export const metadata: Metadata = {
  title: "Scholarship details",
};

export const instant = false;

const studentNotices: Record<string, string> = {
  saved: "Scholarship saved. You can find it under Saved.",
  removed: "Bookmark removed from your saved list.",
};

const staffNotices: Record<string, string> = {
  created: "Draft created. Review the details and publish when ready.",
  updated: "Scholarship details saved. The last-updated time is new.",
  published: "Scholarship published. Active students can now see it.",
  archived: "Scholarship archived and hidden from student listings.",
  expired: "Scholarship marked expired. Students who saved it were notified.",
  unchanged: "No status change was needed.",
};

const problems: Record<string, string> = {
  "save-unavailable":
    "That scholarship is no longer open, so it cannot be newly saved. Expired records remain readable.",
  missing: "That scholarship no longer exists.",
  invalid: "The request was not valid. Please try again.",
  "deadline-passed":
    "The deadline has passed. Update the deadline before publishing.",
  "update-failed": "The change could not be saved. Please try again.",
};

export default async function ScholarshipDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const raw = await searchParams;
  const scholarship = await getScholarshipDetail(id, user);

  if (!scholarship) {
    notFound();
  }

  const readParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const notice = readParam(raw.notice);
  const problem = readParam(raw.problem);
  const state = deriveEffectiveState(scholarship.status, scholarship.deadline);
  const isStudent = user.role === "STUDENT";
  const isOpen = isActiveState(state);
  const returnTo = `/scholarships/${scholarship.id}`;
  const noticeMessage = notice
    ? isStudent
      ? studentNotices[notice]
      : staffNotices[notice]
    : undefined;
  const problemMessage = problem ? problems[problem] : undefined;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/scholarships"
          className={buttonStyles({ variant: "ghost", size: "sm" })}
        >
          ← {isStudent ? "Back to scholarships" : "Back to management"}
        </Link>
      </div>

      <PageHeader
        eyebrow={isStudent ? "Scholarship details" : "Scholarship record"}
        title={scholarship.title}
        description={`${scholarship.provider}${
          scholarship.category ? ` · ${scholarship.category}` : ""
        }`}
        actions={<ScholarshipStatusBadge state={state} />}
      />

      {noticeMessage ? (
        <Alert tone="success" title="Change saved">
          {noticeMessage}
        </Alert>
      ) : null}

      {problemMessage ? (
        <Alert tone="error" title="Action not completed">
          {problemMessage}
        </Alert>
      ) : null}

      {state === "EXPIRED" ? (
        <Alert tone="warning" title="The deadline has passed.">
          This record is a read-only reference. It cannot be newly saved, and
          the official provider may no longer accept applications.
        </Alert>
      ) : null}

      {!isStudent && (state === "DRAFT" || state === "ARCHIVED") ? (
        <Alert tone="info" title="This record is hidden from students.">
          {state === "DRAFT"
            ? "Publish it from the record controls when the information is complete."
            : "Archived records remain available to staff for reference."}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About this opportunity</CardTitle>
              <CardDescription>{scholarship.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <section aria-labelledby="eligibility-heading">
                <h2
                  id="eligibility-heading"
                  className="text-sm font-semibold tracking-wide text-zinc-900 uppercase dark:text-zinc-100"
                >
                  Eligibility
                </h2>
                <p className="mt-2 text-sm leading-7 whitespace-pre-line text-zinc-700 dark:text-zinc-300">
                  {scholarship.eligibility}
                </p>
              </section>

              <section aria-labelledby="benefits-heading">
                <h2
                  id="benefits-heading"
                  className="text-sm font-semibold tracking-wide text-zinc-900 uppercase dark:text-zinc-100"
                >
                  Benefits
                </h2>
                <p className="mt-2 text-sm leading-7 whitespace-pre-line text-zinc-700 dark:text-zinc-300">
                  {scholarship.benefits}
                </p>
              </section>

              <section aria-labelledby="documents-heading">
                <h2
                  id="documents-heading"
                  className="text-sm font-semibold tracking-wide text-zinc-900 uppercase dark:text-zinc-100"
                >
                  Required documents
                </h2>
                <p className="mt-2 text-sm leading-7 whitespace-pre-line text-zinc-700 dark:text-zinc-300">
                  {scholarship.requiredDocuments}
                </p>
              </section>
            </CardContent>
          </Card>

          {!isStudent ? (
            <Card>
              <CardHeader>
                <CardTitle>Record controls</CardTitle>
                <CardDescription>
                  Status changes take effect immediately for student listings
                  and dashboards.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ScholarshipManagementActions
                  scholarshipId={scholarship.id}
                  state={state}
                  deadline={scholarship.deadline}
                  returnTo={returnTo}
                />
                <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <Link
                    href={`/scholarships/${scholarship.id}/edit`}
                    className={buttonStyles({
                      variant: "secondary",
                      size: "sm",
                    })}
                  >
                    Edit details
                  </Link>
                </div>
                <DeleteScholarshipForm
                  scholarshipId={scholarship.id}
                  returnTo="/scholarships"
                />
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Key information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                    Deadline
                  </dt>
                  <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                    {formatDateOnly(scholarship.deadline)}
                  </dd>
                  <dd className="mt-1 text-zinc-600 dark:text-zinc-400">
                    {describeDeadline(scholarship.deadline)}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                    Category
                  </dt>
                  <dd className="mt-1">
                    {scholarship.category ? (
                      <Badge tone="neutral">{scholarship.category}</Badge>
                    ) : (
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Uncategorised
                      </span>
                    )}
                  </dd>
                </div>

                {!isStudent ? (
                  <>
                    <div>
                      <dt className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                        Stored status
                      </dt>
                      <dd className="mt-1 text-zinc-700 dark:text-zinc-300">
                        {SCHOLARSHIP_STATUS_LABELS[scholarship.status]}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                        Saved by students
                      </dt>
                      <dd className="mt-1 text-zinc-700 dark:text-zinc-300">
                        {scholarship._count.savedBy}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                        Last updated
                      </dt>
                      <dd className="mt-1 text-zinc-700 dark:text-zinc-300">
                        {formatDateTime(scholarship.updatedAt)}
                      </dd>
                    </div>
                  </>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Official application</CardTitle>
              <CardDescription>
                The portal never submits an application. Use the provider&apos;s
                official page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <a
                href={scholarship.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({
                  variant: isOpen ? "primary" : "secondary",
                  size: "md",
                  className: "w-full",
                })}
              >
                {isOpen ? "Open official page" : "View official page (closed)"}
              </a>
              <p className="text-xs break-all text-zinc-500 dark:text-zinc-400">
                {scholarship.applicationUrl}
              </p>

              {isStudent ? (
                <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <BookmarkButton
                    scholarshipId={scholarship.id}
                    isSaved={scholarship.isSaved}
                    canSave={isOpen}
                    returnTo={returnTo}
                    size="md"
                  />
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {scholarship.isSaved
                      ? "Saved to your list."
                      : isOpen
                        ? "Save this opportunity for later."
                        : "Expired records cannot be newly saved."}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
