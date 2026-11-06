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
import { requireStaffOrCoordinator } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Rooms",
};

export const instant = false;

export default async function RoomsPage() {
  await requireStaffOrCoordinator();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Rooms"
        description="Department teaching spaces used by the timetable. Coordinators review the room list; staff use it when scheduling and when requesting automatic assignment."
        actions={<Badge tone="warning">Phase 4 implementation</Badge>}
      />

      <Alert title="No rooms are stored yet.">
        Room records are development data added in Phase 4. Automatic assignment
        searches only rooms that belong to the selected batch&apos;s department
        and sorts them deterministically by room number.
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Department room list</CardTitle>
              <CardDescription>
                Capacity-based suitability and room scoring are intentionally
                out of scope.
              </CardDescription>
            </div>
            <Badge tone="neutral">Read-only preview</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <tr>
                <TableCell colSpan={4} className="p-0">
                  <EmptyState
                    title="No room records yet"
                    description="Rooms will be created from the timetable management area in Phase 4."
                    className="py-10"
                  />
                </TableCell>
              </tr>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Department ownership</CardTitle>
            <CardDescription>
              Every room belongs to one department, and automatic assignment
              uses the batch&apos;s department.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Time-aware availability</CardTitle>
            <CardDescription>
              A room is free only when no timetable entry overlaps the requested
              day and time interval.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Stable choice</CardTitle>
            <CardDescription>
              The first free room in ascending room-number order is selected, so
              the same input always produces the same result.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
