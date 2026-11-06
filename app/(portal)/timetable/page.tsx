import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Timetable",
};

export const instant = false;

const assignmentSteps = [
  "Load the rooms that belong to the selected batch's department.",
  "Remove rooms with an overlapping class in the selected interval.",
  "Choose the first remaining room in ascending room-number order.",
  "Return the selected room, or a clear no-room-available result.",
];

export default async function TimetablePage() {
  await requireUser();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Academic module"
        title="Timetable"
        description="A table-oriented schedule for staff, with teacher, batch, and room conflict checks and a deterministic automatic room-assignment step."
        actions={<Badge tone="info">Phase 4 implementation</Badge>}
      />

      <Alert title="The schedule is intentionally empty until Phase 4.">
        The data model, conflict rule, room-assignment rule, and interface
        structure are finalised. Course, teacher, batch, and room management
        plus the editable timetable arrive in Phase 4.
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Schedule preview</CardTitle>
              <CardDescription>
                Staff will enter and edit rows in a compact table rather than a
                complex scheduling workflow.
              </CardDescription>
            </div>
            <Badge tone="neutral">Weekly view</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Room</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <tr>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    title="No timetable entries yet"
                    description="The first saved class will appear here after staff create courses, batches, teachers, and rooms."
                    className="py-10"
                  />
                </TableCell>
              </tr>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Conflict checks</CardTitle>
              <Badge tone="success">Before every save</Badge>
            </div>
            <CardDescription>
              The same rule is applied to the teacher, the batch, and the room.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              A new class is rejected when an existing class on the same day has
              an interval that overlaps the requested interval.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-100">
              <code>{`existingStart < newEnd
AND
existingEnd > newStart`}</code>
            </pre>
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Times are stored as minutes from midnight, so the rule is a simple
              integer comparison with no time-zone ambiguity.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Automatic room assignment</CardTitle>
              <Badge tone="warning">Deterministic</Badge>
            </div>
            <CardDescription>
              No optimisation, scoring, or AI scheduling is used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {assignmentSteps.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Batch view</CardTitle>
            <CardDescription>
              Students and staff can review a full section timetable.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Teacher view</CardTitle>
            <CardDescription>
              Staff can inspect a teacher&apos;s weekly load and catch clashes.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Today view</CardTitle>
            <CardDescription>
              The dashboard and timetable provide a focused view of today&apos;s
              classes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
