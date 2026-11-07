import type { Metadata } from "next";
import Link from "next/link";

import { NoDepartmentNotice } from "@/components/timetable/no-department-notice";
import { ReferenceAlerts } from "@/components/timetable/reference-alerts";
import { ReferenceManager } from "@/components/timetable/reference-manager";
import {
  ReferenceForm,
  type ReferenceFormField,
} from "@/components/timetable/reference-form";
import { DeleteReferenceForm } from "@/components/timetable/delete-reference-form";
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
import {
  createCourseAction,
  deleteCourseAction,
  updateCourseAction,
} from "@/lib/timetable/actions";
import { getCourses } from "@/lib/timetable/queries";
import { formatDateTime } from "@/lib/time/portal";

export const metadata: Metadata = {
  title: "Courses",
};

export const instant = false;

const courseFields: ReferenceFormField[] = [
  {
    name: "code",
    label: "Course code",
    defaultValue: "",
    placeholder: "CS-301",
    maxLength: 20,
  },
  {
    name: "title",
    label: "Course title",
    defaultValue: "",
    placeholder: "Design and Analysis of Algorithms",
    maxLength: 120,
  },
];

export default async function CoursesPage({
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
      title="Courses"
      description="Course codes and titles used by timetable rows. Codes are unique within a department."
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

  const courses = await getCourses(user.department.id);
  const editing = params.edit
    ? courses.find((course) => course.id === params.edit)
    : undefined;

  const editPanel = editing ? (
    <Card id="edit-record" key={editing.id}>
      <CardHeader>
        <CardTitle>Edit course</CardTitle>
        <CardDescription>
          {editing.code} is used by {editing._count.entries}{" "}
          {editing._count.entries === 1 ? "class" : "classes"}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReferenceForm
          action={updateCourseAction}
          mode="edit"
          entityLabel="course"
          fields={courseFields.map((field) => ({
            ...field,
            defaultValue: field.name === "code" ? editing.code : editing.title,
          }))}
          idField="courseId"
          idValue={editing.id}
          cancelHref="/timetable/courses"
        />
      </CardContent>
    </Card>
  ) : params.edit ? (
    <Alert tone="warning" title="Course not found">
      That course no longer exists in your department. Choose another row to
      edit.
    </Alert>
  ) : undefined;

  const columnCount = canManage ? 5 : 4;

  return (
    <div className="space-y-8">
      {header}
      <ReferenceAlerts notice={params.notice} problem={params.problem} />

      <ReferenceManager
        tableTitle="Department courses"
        tableDescription="A course can be reused by many timetable rows."
        columns={["Code", "Title", "Classes", "Updated"]}
        count={courses.length}
        canManage={canManage}
        createAction={createCourseAction}
        createFields={courseFields}
        entityLabel="course"
        editPanel={editPanel}
      >
        {courses.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columnCount} className="p-0">
              <EmptyState
                title="No courses yet"
                description="Add the first course to make it available when scheduling classes."
                className="py-10"
              />
            </TableCell>
          </TableRow>
        ) : (
          courses.map((course) => (
            <TableRow key={course.id}>
              <TableCell className="font-medium whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                {course.code}
              </TableCell>
              <TableCell>{course.title}</TableCell>
              <TableCell>
                <Badge tone="neutral">{course._count.entries}</Badge>
              </TableCell>
              <TableCell className="text-xs whitespace-nowrap">
                {formatDateTime(course.updatedAt)}
              </TableCell>
              {canManage ? (
                <TableCell>
                  <div className="flex flex-col items-start gap-2">
                    <Link
                      href={`/timetable/courses?edit=${course.id}#edit-record`}
                      className={buttonStyles({
                        variant: "secondary",
                        size: "sm",
                      })}
                    >
                      Edit
                    </Link>
                    <DeleteReferenceForm
                      action={deleteCourseAction}
                      id={course.id}
                      returnTo="/timetable/courses"
                      label="Delete course"
                      description={`Delete ${course.code}? Courses used by a class cannot be deleted.`}
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
