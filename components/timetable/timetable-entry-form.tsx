"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button, buttonStyles } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  createTimetableEntryAction,
  updateTimetableEntryAction,
  type TimetableFormState,
  type TimetableFormValues,
} from "@/lib/timetable/actions";
import { DAY_LABELS, TIMETABLE_DAYS } from "@/lib/timetable/rules";
import type { TimetableEntryFormField } from "@/lib/validation/timetable";

export type SelectOption = {
  value: string;
  label: string;
};

export function TimetableEntryForm({
  mode,
  entryId,
  values,
  courses,
  batches,
  teachers,
  rooms,
  cancelHref,
}: {
  mode: "create" | "edit";
  entryId?: string;
  values: TimetableFormValues;
  courses: SelectOption[];
  batches: SelectOption[];
  teachers: SelectOption[];
  rooms: SelectOption[];
  cancelHref: string;
}) {
  const action =
    mode === "edit" ? updateTimetableEntryAction : createTimetableEntryAction;
  const [state, formAction, pending] = useActionState<
    TimetableFormState,
    FormData
  >(action, undefined);
  const current = { ...values, ...state?.values };

  const fieldError = (field: TimetableEntryFormField) =>
    state?.fieldErrors?.[field];

  return (
    <form action={formAction} className="space-y-6">
      {entryId ? <input type="hidden" name="entryId" value={entryId} /> : null}
      <input type="hidden" name="returnTo" value={current.returnTo} />

      {state?.error ? (
        <Alert tone="error" title="Could not save the class">
          <p>{state.error}</p>
          {state.conflicts && state.conflicts.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {state.conflicts.map((conflict) => (
                <li key={conflict}>{conflict}</li>
              ))}
            </ul>
          ) : null}
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Field
          label="Course"
          htmlFor="entry-course"
          error={fieldError("courseId")}
          className="lg:col-span-2"
        >
          <Select
            id="entry-course"
            name="courseId"
            defaultValue={current.courseId}
            required
            aria-invalid={fieldError("courseId") ? true : undefined}
          >
            <option value="">Choose a course</option>
            {courses.map((course) => (
              <option key={course.value} value={course.value}>
                {course.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Batch / section"
          htmlFor="entry-batch"
          error={fieldError("batchId")}
        >
          <Select
            id="entry-batch"
            name="batchId"
            defaultValue={current.batchId}
            required
            aria-invalid={fieldError("batchId") ? true : undefined}
          >
            <option value="">Choose a batch</option>
            {batches.map((batch) => (
              <option key={batch.value} value={batch.value}>
                {batch.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Teacher"
          htmlFor="entry-teacher"
          error={fieldError("teacherId")}
        >
          <Select
            id="entry-teacher"
            name="teacherId"
            defaultValue={current.teacherId}
            required
            aria-invalid={fieldError("teacherId") ? true : undefined}
          >
            <option value="">Choose a teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.value} value={teacher.value}>
                {teacher.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Day" htmlFor="entry-day" error={fieldError("dayOfWeek")}>
          <Select
            id="entry-day"
            name="dayOfWeek"
            defaultValue={current.dayOfWeek}
            required
            aria-invalid={fieldError("dayOfWeek") ? true : undefined}
          >
            {TIMETABLE_DAYS.map((day) => (
              <option key={day} value={day}>
                {DAY_LABELS[day]}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Start time"
            htmlFor="entry-start"
            error={fieldError("startTime")}
          >
            <Input
              id="entry-start"
              name="startTime"
              type="time"
              defaultValue={current.startTime}
              required
              aria-invalid={fieldError("startTime") ? true : undefined}
            />
          </Field>

          <Field
            label="End time"
            htmlFor="entry-end"
            hint="Exclusive."
            error={fieldError("endTime")}
          >
            <Input
              id="entry-end"
              name="endTime"
              type="time"
              defaultValue={current.endTime}
              required
              aria-invalid={fieldError("endTime") ? true : undefined}
            />
          </Field>
        </div>

        <Field
          label="Room"
          htmlFor="entry-room"
          hint="Automatic assignment uses the first free room in ascending room-number order."
          error={fieldError("roomId")}
          className="lg:col-span-2"
        >
          <Select
            id="entry-room"
            name="roomId"
            defaultValue={current.roomId}
            required
            aria-invalid={fieldError("roomId") ? true : undefined}
          >
            <option value="auto">Auto assign a free department room</option>
            {rooms.map((room) => (
              <option key={room.value} value={room.value}>
                {room.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Checking timetable…"
            : mode === "edit"
              ? "Save changes"
              : "Create class"}
        </Button>
        <Link
          href={cancelHref}
          className={buttonStyles({ variant: "secondary", size: "md" })}
        >
          Cancel
        </Link>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Teacher, batch, and room clashes are rejected by the server before
          saving.
        </p>
      </div>
    </form>
  );
}
