import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteTimetableEntryAction } from "@/lib/timetable/actions";
import type { TimetableEntryRow } from "@/lib/timetable/queries";
import {
  DAY_LABELS,
  DAY_SHORT_LABELS,
  formatTimeRange,
} from "@/lib/timetable/rules";

import { DeleteReferenceForm } from "./delete-reference-form";

export function TimetableTable({
  entries,
  returnTo,
  canManage,
  emptyTitle,
  emptyDescription,
}: {
  entries: TimetableEntryRow[];
  returnTo: string;
  canManage: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const columnCount = canManage ? 7 : 6;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Day</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Course</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead>Teacher</TableHead>
          <TableHead>Room</TableHead>
          {canManage ? <TableHead>Actions</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.length === 0 ? (
          <tr>
            <TableCell colSpan={columnCount} className="p-0">
              <EmptyState
                title={emptyTitle}
                description={emptyDescription}
                className="py-10"
              />
            </TableCell>
          </tr>
        ) : (
          entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                <span className="sm:hidden">
                  <Badge tone="neutral">
                    {DAY_SHORT_LABELS[entry.dayOfWeek]}
                  </Badge>
                </span>
                <span className="hidden sm:inline">
                  <Badge tone="neutral">{DAY_LABELS[entry.dayOfWeek]}</Badge>
                </span>
              </TableCell>
              <TableCell className="font-mono text-xs whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                {formatTimeRange(entry.startMinute, entry.endMinute)}
              </TableCell>
              <TableCell>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {entry.course.code}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {entry.course.title}
                </p>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {entry.batch.name}-{entry.batch.section}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {entry.teacher.name}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {entry.room.roomNumber}
                </p>
                {entry.room.building ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {entry.room.building}
                  </p>
                ) : null}
              </TableCell>
              {canManage ? (
                <TableCell>
                  <div className="flex flex-col items-start gap-2">
                    <Link
                      href={`/timetable/${entry.id}/edit?returnTo=${encodeURIComponent(returnTo)}`}
                      className={buttonStyles({
                        variant: "secondary",
                        size: "sm",
                      })}
                    >
                      Edit
                    </Link>
                    <DeleteReferenceForm
                      action={deleteTimetableEntryAction}
                      id={entry.id}
                      idField="entryId"
                      returnTo={returnTo}
                      label="Delete class"
                      description={`Delete ${entry.course.code} for ${entry.batch.name}-${entry.batch.section}? This cannot be undone.`}
                    />
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
