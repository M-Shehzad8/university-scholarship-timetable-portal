import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  deriveEffectiveState,
  describeDeadline,
  formatDateOnly,
  isActiveState,
} from "@/lib/scholarships/rules";
import type { getStudentCatalogue } from "@/lib/scholarships/queries";

import { BookmarkButton } from "./bookmark-button";
import { ScholarshipStatusBadge } from "./scholarship-status-badge";

type CatalogueRecord = Awaited<ReturnType<typeof getStudentCatalogue>>[number];

export function ScholarshipCard({
  scholarship,
  returnTo,
}: {
  scholarship: CatalogueRecord;
  returnTo: string;
}) {
  const state = deriveEffectiveState(scholarship.status, scholarship.deadline);
  const isSaved = scholarship.savedBy.length > 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>
              <Link
                href={`/scholarships/${scholarship.id}`}
                className="hover:text-emerald-700 dark:hover:text-emerald-400"
              >
                {scholarship.title}
              </Link>
            </CardTitle>
            <CardDescription className="mt-1">
              {scholarship.provider}
            </CardDescription>
          </div>
          <ScholarshipStatusBadge state={state} className="shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {scholarship.category ? (
            <Badge tone="neutral">{scholarship.category}</Badge>
          ) : null}
          {isSaved ? <Badge tone="info">Saved</Badge> : null}
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {scholarship.description}
        </p>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Deadline
            </dt>
            <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
              {formatDateOnly(scholarship.deadline)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Timing
            </dt>
            <dd className="mt-1 text-zinc-700 dark:text-zinc-300">
              {describeDeadline(scholarship.deadline)}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Link
            href={`/scholarships/${scholarship.id}`}
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            View details
          </Link>
          <BookmarkButton
            scholarshipId={scholarship.id}
            isSaved={isSaved}
            canSave={isActiveState(state)}
            returnTo={returnTo}
          />
        </div>
      </CardContent>
    </Card>
  );
}
