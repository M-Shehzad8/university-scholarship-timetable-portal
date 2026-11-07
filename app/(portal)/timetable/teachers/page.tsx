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
  createTeacherAction,
  deleteTeacherAction,
  updateTeacherAction,
} from "@/lib/timetable/actions";
import { getTeachers } from "@/lib/timetable/queries";

export const metadata: Metadata = {
  title: "Teachers",
};

export const instant = false;

const teacherFields: ReferenceFormField[] = [
  {
    name: "name",
    label: "Teacher name",
    defaultValue: "",
    placeholder: "Dr. Imran Sheikh",
    maxLength: 120,
  },
  {
    name: "email",
    label: "Email",
    defaultValue: "",
    placeholder: "imran.sheikh@university.edu",
    hint: "Optional. Must be unique within the department.",
    maxLength: 254,
    required: false,
    type: "email",
  },
];

export default async function TeachersPage({
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
      title="Teachers"
      description="Teaching staff assigned to timetable rows. Email addresses are optional but must be unique when provided."
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

  const teachers = await getTeachers(user.department.id);
  const editing = params.edit
    ? teachers.find((teacher) => teacher.id === params.edit)
    : undefined;

  const editPanel = editing ? (
    <Card id="edit-record" key={editing.id}>
      <CardHeader>
        <CardTitle>Edit teacher</CardTitle>
        <CardDescription>
          {editing.name} is assigned to {editing._count.entries}{" "}
          {editing._count.entries === 1 ? "class" : "classes"}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReferenceForm
          action={updateTeacherAction}
          mode="edit"
          entityLabel="teacher"
          fields={teacherFields.map((field) => ({
            ...field,
            defaultValue:
              field.name === "name" ? editing.name : (editing.email ?? ""),
          }))}
          idField="teacherId"
          idValue={editing.id}
          cancelHref="/timetable/teachers"
        />
      </CardContent>
    </Card>
  ) : params.edit ? (
    <Alert tone="warning" title="Teacher not found">
      That teacher no longer exists in your department. Choose another row to
      edit.
    </Alert>
  ) : undefined;

  const columnCount = canManage ? 5 : 4;

  return (
    <div className="space-y-8">
      {header}
      <ReferenceAlerts notice={params.notice} problem={params.problem} />

      <ReferenceManager
        tableTitle="Department teachers"
        tableDescription="A teacher can be assigned to many timetable rows."
        columns={["Name", "Email", "Classes", "Updated"]}
        count={teachers.length}
        canManage={canManage}
        createAction={createTeacherAction}
        createFields={teacherFields}
        entityLabel="teacher"
        editPanel={editPanel}
      >
        {teachers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columnCount} className="p-0">
              <EmptyState
                title="No teachers yet"
                description="Add the first teacher to make them available when scheduling classes."
                className="py-10"
              />
            </TableCell>
          </TableRow>
        ) : (
          teachers.map((teacher) => (
            <TableRow key={teacher.id}>
              <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                {teacher.name}
              </TableCell>
              <TableCell className="text-xs">{teacher.email ?? "—"}</TableCell>
              <TableCell>
                <Badge tone="neutral">{teacher._count.entries}</Badge>
              </TableCell>
              <TableCell className="text-xs whitespace-nowrap">
                {formatDateTime(teacher.updatedAt)}
              </TableCell>
              {canManage ? (
                <TableCell>
                  <div className="flex flex-col items-start gap-2">
                    <Link
                      href={`/timetable/teachers?edit=${teacher.id}#edit-record`}
                      className={buttonStyles({
                        variant: "secondary",
                        size: "sm",
                      })}
                    >
                      Edit
                    </Link>
                    <DeleteReferenceForm
                      action={deleteTeacherAction}
                      id={teacher.id}
                      returnTo="/timetable/teachers"
                      label="Delete teacher"
                      description={`Delete ${teacher.name}? Teachers assigned to a class cannot be deleted.`}
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
