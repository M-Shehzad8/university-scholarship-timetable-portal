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
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireCoordinator } from "@/lib/auth/dal";
import {
  ALL_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  roleBadgeTone,
} from "@/lib/auth/roles";
import {
  setUserActiveAction,
  updateUserRoleAction,
} from "@/lib/auth/user-actions";
import { getUserManagementData } from "@/lib/auth/user-queries";

import { CreateUserForm } from "./create-user-form";

export const metadata: Metadata = {
  title: "People",
};

export const instant = false;

const statusMessages: Record<string, string> = {
  "role-updated": "Role updated. The change applies immediately.",
  activated: "Account activated. The user can sign in again.",
  deactivated: "Account deactivated and all sessions revoked.",
};

const errorMessages: Record<string, string> = {
  "self-role": "You cannot remove your own coordinator role.",
  "self-deactivate": "You cannot deactivate your own account.",
  "last-coordinator": "At least one active coordinator must remain.",
  "invalid-role": "Choose a valid role.",
  "invalid-state": "Choose a valid account state.",
  "missing-user": "That account no longer exists.",
  "update-failed": "The change could not be saved. Please try again.",
};

function formatScope(user: {
  role: string;
  batch: { name: string; section: string } | null;
  department: { name: string; code: string } | null;
}): string {
  if (user.role === "STUDENT") {
    return user.batch ? `${user.batch.name}-${user.batch.section}` : "No batch";
  }

  return user.department
    ? `${user.department.name} (${user.department.code})`
    : "No department";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const coordinator = await requireCoordinator();
  const { users, departments, batches } = await getUserManagementData();
  const params = await searchParams;

  const activeUsers = users.filter((user) => user.isActive).length;
  const staffUsers = users.filter((user) => user.role === "STAFF").length;
  const coordinatorUsers = users.filter(
    (user) => user.role === "COORDINATOR",
  ).length;

  const statusMessage = params.status
    ? statusMessages[params.status]
    : undefined;
  const errorMessage = params.error ? errorMessages[params.error] : undefined;

  const departmentOptions = departments.map((department) => ({
    id: department.id,
    label: `${department.name} (${department.code})`,
  }));

  const batchOptions = batches.map((batch) => ({
    id: batch.id,
    label: `${batch.name}-${batch.section} · ${batch.department.code}`,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="People and roles"
        description="Create accounts, assign one of the three supported roles, and deactivate access. Every change is validated and authorized on the server."
        actions={<Badge tone="warning">Coordinator only</Badge>}
      />

      {statusMessage ? (
        <Alert tone="success" title="Change saved">
          {statusMessage}
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert tone="error" title="Change blocked">
          {errorMessage}
        </Alert>
      ) : null}

      <section
        aria-label="Account summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Total accounts"
          value={String(users.length)}
          detail="All student, staff, and coordinator accounts"
        />
        <StatCard
          label="Active accounts"
          value={String(activeUsers)}
          detail="Accounts allowed to sign in"
          tone="emerald"
        />
        <StatCard
          label="Staff accounts"
          value={String(staffUsers)}
          detail="Accounts that maintain academic data"
          tone="sky"
        />
        <StatCard
          label="Coordinators"
          value={String(coordinatorUsers)}
          detail="Accounts with user-management access"
          tone="amber"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            The password is hashed with bcrypt before it is stored. Share the
            temporary password with the user through a safe channel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm
            departments={departmentOptions}
            batches={batchOptions}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>All accounts</CardTitle>
              <CardDescription>
                Deactivating an account immediately revokes its sessions. The
                last active coordinator cannot be removed or deactivated.
              </CardDescription>
            </div>
            <Badge tone="neutral">{users.length} total</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Access</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <tr>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      title="No accounts yet"
                      description="Create the first account with the form above."
                      className="py-10"
                    />
                  </TableCell>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = user.id === coordinator.id;

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {user.name}
                          {isSelf ? (
                            <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                              (you)
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {user.email}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge tone={roleBadgeTone(user.role)}>
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatScope(user)}
                      </TableCell>
                      <TableCell>
                        <Badge tone={user.isActive ? "success" : "danger"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        {isSelf ? (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Protected account
                          </p>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <form
                              action={updateUserRoleAction}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="hidden"
                                name="userId"
                                value={user.id}
                              />
                              <Select
                                name="role"
                                defaultValue={user.role}
                                aria-label={`Role for ${user.name}`}
                                className="h-8 w-32 text-xs"
                              >
                                {ALL_ROLES.map((role) => (
                                  <option key={role} value={role}>
                                    {ROLE_LABELS[role]}
                                  </option>
                                ))}
                              </Select>
                              <Button
                                type="submit"
                                size="sm"
                                variant="secondary"
                              >
                                Save
                              </Button>
                            </form>

                            <form action={setUserActiveAction}>
                              <input
                                type="hidden"
                                name="userId"
                                value={user.id}
                              />
                              <input
                                type="hidden"
                                name="isActive"
                                value={user.isActive ? "false" : "true"}
                              />
                              <Button
                                type="submit"
                                size="sm"
                                variant={user.isActive ? "danger" : "primary"}
                              >
                                {user.isActive ? "Deactivate" : "Activate"}
                              </Button>
                            </form>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <section aria-labelledby="role-rules-heading" className="space-y-4">
        <h2
          id="role-rules-heading"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          What each role can do
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {ALL_ROLES.map((role) => (
            <Card key={role}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{ROLE_LABELS[role]}</CardTitle>
                  <Badge tone={roleBadgeTone(role)}>{ROLE_LABELS[role]}</Badge>
                </div>
                <CardDescription>{ROLE_DESCRIPTIONS[role]}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
