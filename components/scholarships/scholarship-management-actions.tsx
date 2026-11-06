import { Button } from "@/components/ui/button";
import {
  archiveScholarshipAction,
  deleteScholarshipAction,
  expireScholarshipAction,
  publishScholarshipAction,
} from "@/lib/scholarships/actions";
import {
  isActiveState,
  isDeadlinePassed,
  type ScholarshipEffectiveState,
} from "@/lib/scholarships/rules";

function HiddenFields({
  scholarshipId,
  returnTo,
}: {
  scholarshipId: string;
  returnTo: string;
}) {
  return (
    <>
      <input type="hidden" name="scholarshipId" value={scholarshipId} />
      <input type="hidden" name="returnTo" value={returnTo} />
    </>
  );
}

export function ScholarshipQuickAction({
  scholarshipId,
  state,
  deadline,
  returnTo,
}: {
  scholarshipId: string;
  state: ScholarshipEffectiveState;
  deadline: Date;
  returnTo: string;
}) {
  if (state === "DRAFT") {
    return (
      <form action={publishScholarshipAction}>
        <HiddenFields scholarshipId={scholarshipId} returnTo={returnTo} />
        <Button type="submit" size="sm">
          Publish
        </Button>
      </form>
    );
  }

  if (isActiveState(state)) {
    return (
      <form action={archiveScholarshipAction}>
        <HiddenFields scholarshipId={scholarshipId} returnTo={returnTo} />
        <Button type="submit" size="sm" variant="secondary">
          Archive
        </Button>
      </form>
    );
  }

  if (state === "ARCHIVED" && !isDeadlinePassed(deadline)) {
    return (
      <form action={publishScholarshipAction}>
        <HiddenFields scholarshipId={scholarshipId} returnTo={returnTo} />
        <Button type="submit" size="sm">
          Republish
        </Button>
      </form>
    );
  }

  return null;
}

export function ScholarshipManagementActions({
  scholarshipId,
  state,
  deadline,
  returnTo,
}: {
  scholarshipId: string;
  state: ScholarshipEffectiveState;
  deadline: Date;
  returnTo: string;
}) {
  const canPublish = !isActiveState(state) && !isDeadlinePassed(deadline);
  const canArchive = state !== "ARCHIVED";
  const canExpire = state !== "EXPIRED" && state !== "ARCHIVED";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canPublish ? (
        <form action={publishScholarshipAction}>
          <HiddenFields scholarshipId={scholarshipId} returnTo={returnTo} />
          <Button type="submit" size="sm">
            {state === "DRAFT" ? "Publish to students" : "Publish again"}
          </Button>
        </form>
      ) : null}

      {canArchive ? (
        <form action={archiveScholarshipAction}>
          <HiddenFields scholarshipId={scholarshipId} returnTo={returnTo} />
          <Button type="submit" size="sm" variant="secondary">
            Archive
          </Button>
        </form>
      ) : null}

      {canExpire ? (
        <form action={expireScholarshipAction}>
          <HiddenFields scholarshipId={scholarshipId} returnTo={returnTo} />
          <Button type="submit" size="sm" variant="danger">
            Mark expired
          </Button>
        </form>
      ) : null}

      {!canPublish && !canArchive && !canExpire ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No status change is available for this record.
        </p>
      ) : null}
    </div>
  );
}

export function DeleteScholarshipForm({
  scholarshipId,
  returnTo,
}: {
  scholarshipId: string;
  returnTo: string;
}) {
  return (
    <details className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/20">
      <summary className="cursor-pointer text-sm font-semibold text-red-800 dark:text-red-300">
        Delete this scholarship
      </summary>
      <div className="mt-3 space-y-3">
        <p className="text-sm leading-6 text-red-900 dark:text-red-200">
          Deleting a record permanently removes it and every student bookmark
          attached to it. This cannot be undone.
        </p>
        <form action={deleteScholarshipAction}>
          <HiddenFields scholarshipId={scholarshipId} returnTo={returnTo} />
          <Button type="submit" size="sm" variant="danger">
            Delete permanently
          </Button>
        </form>
      </div>
    </details>
  );
}
