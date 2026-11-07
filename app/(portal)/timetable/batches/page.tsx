import type { Metadata } from "next";
import Link from "next/link";

import { DeleteReferenceForm } from "@/components/timetable/delete-reference-form";
import { NoDepartmentNotice } from "@/components/timetable/no-department-notice";
import { ReferenceAlerts } from "@/components/timetable/reference-alerts";
import { ReferenceManager } from "@/components/timetable/reference-manager";
import {
  ReferenceForm,
  type ReferenceFormField,
} from "@/components/timetable/reference-form";
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
import { TableCell, TableRow } from "@/components/ui/table";
import { requireStaffOrCoordinator } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/time/portal";
import {
  createBatchAction,
  deleteBatchAction,
  updateBatchAction,
} from "@/lib/timetable/actions";
import { getBatches } from "@/lib/timetable/queries";

export const metadata: Metadata = {
  title: "Batches",
};

export const instant = false;

const batchFields: ReferenceFormField[] = [
  {
    name: "name",
    label: "Programme / batch",
    defaultValue: "",
    placeholder: "BCS",
    maxLength: 40,
  },
  {
    name: "section",
    label: "Section",
    defaultValue: "",
    placeholder: "7A",
    maxLength: 20,
  },
];

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; notice?: string; problem?: string }>;
}) {
  const user = await requireStaffOrCoordinator();
  const params = await searchParams;
  const canManage = user.role === "STAFF";

  const header = (
    <PageHeader
      eyebrow="Timetable reference data"
      title="Batches and sections"
      description="Programme sections that attend classes. A batch name and section pair is unique within the department."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/timetable"
            className={buttonStyles({ variant: "secondary", size: "md" })}
          >
            Back to timetable
          </Link>
          <Badge tone={canManage ? "info" : "warning"}>
            {canManage ? "Staff editor" : "Read-only"}
          </Badge>
        </div>
      }
    />
  );

  if (!user.department) {
    return (
      <div className="space-y-8">
        {header}
        <NoDepartmentNotice />
      </div>
    );
  }

  const batches = await getBatches(user.department.id);
  const editing = params.edit
    ? batches.find((batch) => batch.id === params.edit)
    : undefined;

  const editPanel = editing ? (
    <Card id="edit-record" key={editing.id}>
      <CardHeader>
        <CardTitle>Edit batch</CardTitle>
        <CardDescription>
          {editing.name}-{editing.section} has {editing._count.students}{" "}
          {editing._count.students === 1 ? "student" : "students"} and{" "}
          {editing._count.entries}{" "}
          {editing._count.entries === 1 ? "class" : "classes"}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReferenceForm
          action={updateBatchAction}
          mode="edit"
          entityLabel="batch"
          fields={batchFields.map((field) => ({
            ...field,
            defaultValue:
              field.name === "name" ? editing.name : editing.section,
          }))}
          idField="batchId"
          idValue={editing.id}
          cancelHref="/timetable/batches"
        />
      </CardContent>
    </Card>
  ) : params.edit ? (
    <Alert tone="warning" title="Batch not found">
      That batch no longer exists in your department. Choose another row to
      edit.
    </Alert>
  ) : undefined;

  const columnCount = canManage ? 6 : 5;

  return (
    <div className="space-y-8">
      {header}
      <ReferenceAlerts notice={params.notice} problem={params.problem} />

      <ReferenceManager
        tableTitle="Department batches"
        tableDescription="Students are linked to one batch, so a batch timetable is their timetable."
        columns={["Batch", "Section", "Students", "Classes", "Updated"]}
        count={batches.length}
        canManage={canManage}
        createAction={createBatchAction}
        createFields={batchFields}
        entityLabel="batch"
        editPanel={editPanel}
      >
        {batches.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columnCount} className="p-0">
              <EmptyState
                title="No batches yet"
                description="Add the first batch and section to make it available when scheduling classes."
                className="py-10"
              />
            </TableCell>
          </TableRow>
        ) : (
          batches.map((batch) => (
            <TableRow key={batch.id}>
              <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                {batch.name}
              </TableCell>
              <TableCell>
                <Badge tone="neutral">{batch.section}</Badge>
              </TableCell>
              <TableCell>{batch._count.students}</TableCell>
              <TableCell>{batch._count.entries}</TableCell>
              <TableCell className="text-xs whitespace-nowrap">
                {formatDateTime(batch.updatedAt)}
              </TableCell>
              {canManage ? (
                <TableCell>
                  <div className="flex flex-col items-start gap-2">
                    <Link
                      href={`/timetable/batches?edit=${batch.id}#edit-record`}
                      className={buttonStyles({
                        variant: "secondary",
                        size: "sm",
                      })}
                    >
                      Edit
                    </Link>
                    <DeleteReferenceForm
                      action={deleteBatchAction}
                      id={batch.id}
                      returnTo="/timetable/batches"
                      label="Delete batch"
                      description={`Delete ${batch.name}-${batch.section}? Batches with classes or students cannot be deleted.`}
                    />
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          ))
        )}
      </ReferenceManager>
    </div>
  );
}
