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
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "People",
};

const permissions = [
  {
    area: "Browse, search, and save scholarships",
    student: true,
    staff: false,
    coordinator: false,
  },
  {
    area: "View the timetable for their batch",
    student: true,
    staff: false,
    coordinator: false,
  },
  {
    area: "Maintain scholarship records",
    student: false,
    staff: true,
    coordinator: false,
  },
  {
    area: "Maintain courses, teachers, batches, rooms, and entries",
    student: false,
    staff: true,
    coordinator: false,
  },
  {
    area: "Manage users and role assignments",
    student: false,
    staff: false,
    coordinator: true,
  },
  {
    area: "View department-wide scholarship and timetable reports",
    student: false,
    staff: false,
    coordinator: true,
  },
];

function PermissionCell({ allowed }: { allowed: boolean }) {
  return (
    <TableCell>
      {allowed ? (
        <Badge tone="success">Allowed</Badge>
      ) : (
        <span className="text-zinc-400 dark:text-zinc-600">—</span>
      )}
    </TableCell>
  );
}

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="People and roles"
        description="The portal has exactly three roles. Students consume academic information; staff maintain it; the coordinator manages access and oversight."
        actions={<Badge tone="info">Phase 2 implementation</Badge>}
      />

      <Alert title="Authentication and account management are not implemented yet.">
        Phase 2 adds login, logout, password handling, sessions, protected
        routes, and server-side role checks. This page documents the role
        boundary now so later implementation has one source of truth.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Role matrix</CardTitle>
          <CardDescription>
            Authorization is always enforced on the server. Hiding a navigation
            item is a usability measure, not a security control.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capability</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Coordinator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.area}>
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    {permission.area}
                  </TableCell>
                  <PermissionCell allowed={permission.student} />
                  <PermissionCell allowed={permission.staff} />
                  <PermissionCell allowed={permission.coordinator} />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Student</CardTitle>
            <CardDescription>
              A batch-linked account focused on opportunities and its own class
              schedule.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Authorised staff</CardTitle>
            <CardDescription>
              A department-linked account that maintains scholarship and
              timetable records.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Coordinator</CardTitle>
            <CardDescription>
              The management account for users, roles, department records, and
              oversight reports.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
