"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ZodError } from "zod";

import { requireRole } from "@/lib/auth/dal";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import {
  BATCH_FORM_FIELDS,
  COURSE_FORM_FIELDS,
  ROOM_FORM_FIELDS,
  TEACHER_FORM_FIELDS,
  TIMETABLE_ENTRY_FORM_FIELDS,
  batchFormSchema,
  courseFormSchema,
  deleteReferenceSchema,
  deleteTimetableEntrySchema,
  roomFormSchema,
  sanitizeTimetableReturnPath,
  teacherFormSchema,
  timetableEntryFormSchema,
  updateBatchSchema,
  updateCourseSchema,
  updateRoomSchema,
  updateTeacherSchema,
  updateTimetableEntrySchema,
  type TimetableEntryFormField,
} from "@/lib/validation/timetable";

import {
  findFreeRoom,
  findTimetableConflicts,
  getBatchInDepartment,
  getCourseInDepartment,
  getRoomInDepartment,
  getTeacherInDepartment,
  getTimetableEntryById,
} from "./queries";
import {
  DAY_LABELS,
  formatEntrySlot,
  formatTimeRange,
  parseTimeInput,
  type TimetableDay,
} from "./rules";

export type ReferenceFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
    }
  | undefined;

export type TimetableFormValues = {
  courseId: string;
  batchId: string;
  teacherId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomId: string;
  returnTo: string;
};

export type TimetableFormState =
  | {
      error?: string;
      fieldErrors?: Partial<Record<TimetableEntryFormField, string>>;
      conflicts?: string[];
      values?: TimetableFormValues;
    }
  | undefined;

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getFieldErrors(
  error: ZodError,
  fields: readonly string[],
): Record<string, string> {
  const flattened = error.flatten().fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const fieldErrors: Record<string, string> = {};

  for (const field of fields) {
    const message = flattened[field]?.[0];

    if (message) {
      fieldErrors[field] = message;
    }
  }

  return fieldErrors;
}

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === code
  );
}

function withQuery(path: string, params: Record<string, string>): string {
  const url = new URL(path, "http://portal.local");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function revalidateTimetableSurfaces() {
  revalidatePath("/timetable");
  revalidatePath("/rooms");
  revalidatePath("/dashboard");
}

function requireDepartment(user: AuthenticatedUser, fallback: string): string {
  if (!user.department) {
    redirect(`${fallback}?problem=no-department`);
  }

  return user.department.id;
}

function readEntryValues(formData: FormData): TimetableFormValues {
  return {
    courseId: formValue(formData, "courseId"),
    batchId: formValue(formData, "batchId"),
    teacherId: formValue(formData, "teacherId"),
    dayOfWeek: formValue(formData, "dayOfWeek"),
    startTime: formValue(formData, "startTime"),
    endTime: formValue(formData, "endTime"),
    roomId: formValue(formData, "roomId"),
    returnTo: formValue(formData, "returnTo"),
  };
}

function describeConflict(
  conflict: Awaited<ReturnType<typeof findTimetableConflicts>>[number],
): string {
  const entry = conflict.entry;
  const slot = formatEntrySlot(
    entry.dayOfWeek as TimetableDay,
    entry.startMinute,
    entry.endMinute,
  );

  if (conflict.type === "teacher") {
    return `${entry.teacher.name} already teaches ${entry.course.code} for ${entry.batch.name}-${entry.batch.section} on ${slot}.`;
  }

  if (conflict.type === "batch") {
    return `${entry.batch.name}-${entry.batch.section} already has ${entry.course.code} with ${entry.teacher.name} on ${slot}.`;
  }

  return `Room ${entry.room.roomNumber} is already used by ${entry.course.code} on ${slot}.`;
}

/* -------------------------------------------------------------------------- */
/* Course, teacher, batch, and room reference data                            */
/* -------------------------------------------------------------------------- */

export async function createCourseAction(
  _previousState: ReferenceFormState,
  formData: FormData,
): Promise<ReferenceFormState> {
  const user = await requireRole(["STAFF"]);
  const departmentId = requireDepartment(user, "/timetable/courses");
  const parsed = courseFormSchema.safeParse({
    code: formValue(formData, "code"),
    title: formValue(formData, "title"),
  });

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: getFieldErrors(parsed.error, COURSE_FORM_FIELDS),
    };
  }

  try {
    await prisma.course.create({
      data: { ...parsed.data, departmentId },
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return {
        error: "That course code already exists in your department.",
        fieldErrors: { code: "This course code is already used." },
      };
    }

    console.error("Course creation failed", error);
    return { error: "The course could not be saved. Please try again." };
  }

  revalidateTimetableSurfaces();
  redirect("/timetable/courses?notice=created");
}

export async function updateCourseAction(
  _previousState: ReferenceFormState,
  formData: FormData,
): Promise<ReferenceFormState> {
  const user = await requireRole(["STAFF"]);
  const departmentId = requireDepartment(user, "/timetable/courses");
  const parsed = updateCourseSchema.safeParse({
    code: formValue(formData, "code"),
    title: formValue(formData, "title"),
    courseId: formValue(formData, "courseId"),
  });

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: getFieldErrors(parsed.error, COURSE_FORM_FIELDS),
    };
  }

  let updated = false;

  try {
    const result = await prisma.course.updateMany({
      where: { id: parsed.data.courseId, departmentId },
      data: { code: parsed.data.code, title: parsed.data.title },
    });
    updated = result.count > 0;
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return {
        error: "That course code already exists in your department.",
        fieldErrors: { code: "This course code is already used." },
      };
    }

    console.error("Course update failed", error);
    return { error: "The changes could not be saved. Please try again." };
  }

  if (!updated) {
    redirect("/timetable/courses?problem=missing");
  }
  revalidateTimetableSurfaces();
  redirect("/timetable/courses?notice=updated");
}

export async function deleteCourseAction(formData: FormData): Promise<void> {
  const user = await requireRole(["STAFF"]);
  const departmentId = requireDepartment(user, "/timetable/courses");
  const parsed = deleteReferenceSchema.safeParse({
    id: formValue(formData, "id"),
    returnTo: formValue(formData, "returnTo"),
  });
  const returnPath = sanitizeTimetableReturnPath(
    formValue(formData, "returnTo"),
  );

  if (!parsed.success) {
    redirect(withQuery(returnPath, { problem: "invalid" }));
  }

  let deleted = false;

  try {
    const result = await prisma.course.deleteMany({
      where: { id: parsed.data.id, departmentId },
    });
    deleted = result.count > 0;
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      redirect(withQuery(returnPath, { problem: "in-use" }));
    }

    console.error("Course deletion failed", error);
    redirect(withQuery(returnPath, { problem: "delete-failed" }));
  }

  if (!deleted) {
    redirect(withQuery(returnPath, { problem: "missing" }));
  }

  revalidateTimetableSurfaces();
  redirect(withQuery(returnPath, { notice: "deleted" }));
}

export async function createTeacherAction(
  _previousState: ReferenceFormState,
  formData: FormData,
): Promise<ReferenceFormState> {
  const user = await requireRole(["STAFF"]);
  const departmentId = requireDepartment(user, "/timetable/teachers");
  const parsed = teacherFormSchema.safeParse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
  });

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: getFieldErrors(parsed.error, TEACHER_FORM_FIELDS),
    };
  }

  try {
    await prisma.teacher.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email || null,
        departmentId,
      },
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return {
        error: "That teacher email already exists in your department.",
        fieldErrors: { email: "This email is already used by a teacher." },
      };
    }

    console.error("Teacher creation failed", error);
    return { error: "The teacher could not be saved. Please try again." };
  }

  revalidateTimetableSurfaces();
  redirect("/timetable/teachers?notice=created");
}

export async function updateTeacherAction(
  _previousState: ReferenceFormState,
  formData: FormData,
): Promise<ReferenceFormState> {
  const user = await requireRole(["STAFF"]);
  const departmentId = requireDepartment(user, "/timetable/teachers");
  const parsed = updateTeacherSchema.safeParse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
    teacherId: formValue(formData, "teacherId"),
  });

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: getFieldErrors(parsed.error, TEACHER_FORM_FIELDS),
    };
  }

  let updated = false;

  try {
    const result = await prisma.teacher.updateMany({
      where: { id: parsed.data.teacherId, departmentId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email || null,
      },
    });
    updated = result.count > 0;
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return {
        error: "That teacher email already exists in your department.",
        fieldErrors: { email: "This email is already used by a teacher." },
      };
    }

    console.error("Teacher update failed", error);
    return { error: "The changes could not be saved. Please try again." };
  }

  if (!updated) {
    redirect("/timetable/teachers?problem=missing");
  }

  revalidateTimetableSurfaces();
  redirect("/timetable/teachers?notice=updated");
}

export async function deleteTeacherAction(formData: FormData): Promise<void> {
  const user = await requireRole(["STAFF"]);
  const departmentId = requireDepartment(user, "/timetable/teachers");
  const parsed = deleteReferenceSchema.safeParse({
    id: formValue(formData, "id"),
    returnTo: formValue(formData, "returnTo"),
  });
  const returnPath = sanitizeTimetableReturnPath(
    formValue(formData, "returnTo"),
  );

  if (!parsed.success) {
    redirect(withQuery(returnPath, { problem: "invalid" }));
  }

  let deleted = false;

  try {
    const result = await prisma.teacher.deleteMany({
      where: { id: parsed.data.id, departmentId },
    });
    deleted = result.count > 0;
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      redirect(withQuery(returnPath, { problem: "in-use" }));
    }

    console.error("Teacher deletion failed", error);
    redirect(withQuery(returnPath, { problem: "delete-failed" }));
  }

  if (!deleted) {
    redirect(withQuery(returnPath, { problem: "missing" }));
  }

  revalidateTimetableSurfaces();
  redirect(withQuery(returnPath, { notice: "deleted" }));
}

export async function createBatchAction(
  _previousState: ReferenceFormState,
  formData: FormData,
): Promise<ReferenceFormState> {
  const user = await requireRole(["STAFF"]);
  const departmentId = requireDepartment(user, "/timetable/batches");
  const parsed = batchFormSchema.safeParse({
    name: formValue(formData, "name"),
    section: formValue(formData, "section"),
  });

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: getFieldErrors(parsed.error, BATCH_FORM_FIELDS),
    };
  }

  try {
    await prisma.batch.create({
      data: { ...parsed.data, departmentId },
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return {
        error: "That batch and section already exist in your department.",
        fieldErrors: { section: "This batch and section already exist." },
      };
    }

    console.error("Batch creation failed", error);
    return { error: "The batch could not be saved. Please try again." };
  }

  revalidateTimetableSurfaces();
  redirect("/timetable/batches?notice=created");
}

export async function updateBatchAction(
  _previousState: ReferenceFormState,
  formData: FormData,
): Promise<ReferenceFormState> {
  const user = await requireRole(["STAFF"]);
  const departmentId = requireDepartment(user, "/timetable/batches");
  const parsed = updateBatchSchema.safeParse({
    name: formValue(formData, "name"),
    section: formValue(formData, "section"),
    batchId: formValue(formData, "batchId"),
  });

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: getFieldErrors(parsed.error, BATCH_FORM_FIELDS),
    };
  }

  let updated = false;

  try {
    const result = await prisma.batch.updateMany({
      where: { id: parsed.data.batchId, departmentId },
      data: { name: parsed.data.name, section: parsed.data.section },
    });
    updated = result.count > 0;
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return {
        error: "That batch and section already exist in your department.",
        fieldErrors: { section: "This batch and section already exist." },
      };
    }

    console.error("Batch update failed", error);
    return { error: "The changes could not be saved. Please try again." };
  }

  if (!updated) {
    redirect("/timetable/batches?problem=missing");
  }

  revalidateTimetableSurfaces();
  redirect("/timetable/batches?notice=updated");
}

export async function deleteBatchAction(formData: FormData): Promise<void> {
  const user = await requireRole(["STAFF"]);
  const departmentId = requireDepartment(user, "/timetable/batches");
  const parsed = deleteReferenceSchema.safeParse({
    id: formValue(formData, "id"),
    returnTo: formValue(formData, "returnTo"),
  });
  const returnPath = sanitizeTimetableReturnPath(
    formValue(formData, "returnTo"),
  );

  if (!parsed.success) {
    redirect(withQuery(returnPath, { problem: "invalid" }));
  }

  let deleted = false;

  try {
    const result = await prisma.batch.deleteMany({
      where: { id: parsed.data.id, departmentId },
    });
    deleted = result.count > 0;
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      redirect(withQuery(returnPath, { problem: "in-use" }));
    }

    console.error("Batch deletion failed", error);
    redirect(withQuery(returnPath, { problem: "delete-failed" }));
  }

  if (!deleted) {
    redirect(withQuery(returnPath, { problem: "missing" }));
  }

  revalidateTimetableSurfaces();
  redirect(withQuery(returnPath, { notice: "deleted" }));
}

export async function createRoomAction(
  _previousState: ReferenceFormState,
  formData: FormData,
): Promise<ReferenceFormState> {
  const user = await requireRole(["STAFF"]);
  const departmentId = requireDepartment(user, "/rooms");
  const parsed = roomFormSchema.safeParse({
    roomNumber: formValue(formData, "roomNumber"),
    building: formValue(formData, "building"),
  });

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: getFieldErrors(parsed.error, ROOM_FORM_FIELDS),
    };
  }

  try {
    await prisma.room.create({
      data: {
        roomNumber: parsed.data.roomNumber,
        building: parsed.data.building || null,
        departmentId,
      },
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return {
        error: "That room number already exists in your department.",
        fieldErrors: { roomNumber: "This room number is already used." },
      };
    }

    console.error("Room creation failed", error);
    return { error: "The room could not be saved. Please try again." };
  }

  revalidateTimetableSurfaces();
  redirect("/rooms?notice=created");
}

export async function updateRoomAction(
  _previousState: ReferenceFormState,
  formData: FormData,
): Promise<ReferenceFormState> {
  const user = await requireRole(["STAFF"]);
  const departmentId = requireDepartment(user, "/rooms");
  const parsed = updateRoomSchema.safeParse({
    roomNumber: formValue(formData, "roomNumber"),
    building: formValue(formData, "building"),
    roomId: formValue(formData, "roomId"),
  });

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: getFieldErrors(parsed.error, ROOM_FORM_FIELDS),
    };
  }

  let updated = false;

  try {
    const result = await prisma.room.updateMany({
      where: { id: parsed.data.roomId, departmentId },
      data: {
        roomNumber: parsed.data.roomNumber,
        building: parsed.data.building || null,
      },
    });
    updated = result.count > 0;
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return {
        error: "That room number already exists in your department.",
        fieldErrors: { roomNumber: "This room number is already used." },
      };
    }

    console.error("Room update failed", error);
    return { error: "The changes could not be saved. Please try again." };
  }

  if (!updated) {
    redirect("/rooms?problem=missing");
  }

  revalidateTimetableSurfaces();
  redirect("/rooms?notice=updated");
}

export async function deleteRoomAction(formData: FormData): Promise<void> {
  const user = await requireRole(["STAFF"]);
  const departmentId = requireDepartment(user, "/rooms");
  const parsed = deleteReferenceSchema.safeParse({
    id: formValue(formData, "id"),
    returnTo: formValue(formData, "returnTo"),
  });
  const returnPath = sanitizeTimetableReturnPath(
    formValue(formData, "returnTo"),
  );

  if (!parsed.success) {
    redirect(withQuery(returnPath, { problem: "invalid" }));
  }

  let deleted = false;

  try {
    const result = await prisma.room.deleteMany({
      where: { id: parsed.data.id, departmentId },
    });
    deleted = result.count > 0;
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      redirect(withQuery(returnPath, { problem: "in-use" }));
    }

    console.error("Room deletion failed", error);
    redirect(withQuery(returnPath, { problem: "delete-failed" }));
  }

  if (!deleted) {
    redirect(withQuery(returnPath, { problem: "missing" }));
  }

  revalidateTimetableSurfaces();
  redirect(withQuery(returnPath, { notice: "deleted" }));
}

/* -------------------------------------------------------------------------- */
/* Timetable entries                                                          */
/* -------------------------------------------------------------------------- */

async function validateEntryReferences({
  departmentId,
  courseId,
  batchId,
  teacherId,
  roomId,
  dayOfWeek,
  startMinute,
  endMinute,
  excludeEntryId,
}: {
  departmentId: string;
  courseId: string;
  batchId: string;
  teacherId: string;
  roomId: string;
  dayOfWeek: TimetableDay;
  startMinute: number;
  endMinute: number;
  excludeEntryId?: string;
}): Promise<
  | {
      error: string;
      fieldErrors?: Partial<Record<TimetableEntryFormField, string>>;
      conflicts?: string[];
    }
  | {
      courseId: string;
      batchId: string;
      teacherId: string;
      roomId: string;
      roomNumber: string;
      autoAssigned: boolean;
    }
> {
  const [course, batch, teacher] = await Promise.all([
    getCourseInDepartment(courseId, departmentId),
    getBatchInDepartment(batchId, departmentId),
    getTeacherInDepartment(teacherId, departmentId),
  ]);

  if (!course || !batch || !teacher) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: {
        ...(!course ? { courseId: "Choose a course in your department." } : {}),
        ...(!batch ? { batchId: "Choose a batch in your department." } : {}),
        ...(!teacher
          ? { teacherId: "Choose a teacher in your department." }
          : {}),
      },
    };
  }

  let room: {
    id: string;
    roomNumber: string;
    building: string | null;
  } | null = null;
  let autoAssigned = false;

  if (roomId === "auto") {
    room = await findFreeRoom({
      departmentId,
      dayOfWeek,
      startMinute,
      endMinute,
      excludeEntryId,
    });
    autoAssigned = true;

    if (!room) {
      return {
        error: `No department room is free on ${DAY_LABELS[dayOfWeek]} between ${formatTimeRange(
          startMinute,
          endMinute,
        )}. Choose another time or free a room first.`,
      };
    }
  } else {
    room = await getRoomInDepartment(roomId, departmentId);

    if (!room) {
      return {
        error: "Check the highlighted fields.",
        fieldErrors: { roomId: "Choose a room in your department." },
      };
    }
  }

  const conflicts = await findTimetableConflicts({
    dayOfWeek,
    startMinute,
    endMinute,
    teacherId: teacher.id,
    batchId: batch.id,
    roomId: room.id,
    excludeEntryId,
  });

  if (conflicts.length > 0) {
    return {
      error: "This class conflicts with the existing timetable.",
      conflicts: conflicts.map(describeConflict),
    };
  }

  return {
    courseId: course.id,
    batchId: batch.id,
    teacherId: teacher.id,
    roomId: room.id,
    roomNumber: room.roomNumber,
    autoAssigned,
  };
}

export async function createTimetableEntryAction(
  _previousState: TimetableFormState,
  formData: FormData,
): Promise<TimetableFormState> {
  const user = await requireRole(["STAFF"]);
  const departmentId = requireDepartment(user, "/timetable");
  const values = readEntryValues(formData);
  const parsed = timetableEntryFormSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: getFieldErrors(
        parsed.error,
        TIMETABLE_ENTRY_FORM_FIELDS,
      ) as Partial<Record<TimetableEntryFormField, string>>,
      values,
    };
  }

  const startMinute = parseTimeInput(parsed.data.startTime);
  const endMinute = parseTimeInput(parsed.data.endTime);

  if (startMinute === null || endMinute === null) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: {
        startTime:
          startMinute === null ? "Choose a valid start time." : undefined,
        endTime: endMinute === null ? "Choose a valid end time." : undefined,
      },
      values,
    };
  }

  if (endMinute <= startMinute) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: { endTime: "The end time must be after the start time." },
      values,
    };
  }

  const reference = await validateEntryReferences({
    departmentId,
    courseId: parsed.data.courseId,
    batchId: parsed.data.batchId,
    teacherId: parsed.data.teacherId,
    roomId: parsed.data.roomId,
    dayOfWeek: parsed.data.dayOfWeek,
    startMinute,
    endMinute,
  });

  if ("error" in reference) {
    return {
      ...reference,
      values,
    };
  }

  try {
    await prisma.timetableEntry.create({
      data: {
        courseId: reference.courseId,
        batchId: reference.batchId,
        teacherId: reference.teacherId,
        roomId: reference.roomId,
        dayOfWeek: parsed.data.dayOfWeek,
        startMinute,
        endMinute,
      },
    });
  } catch (error) {
    console.error("Timetable entry creation failed", error);
    return {
      error: "The class could not be saved. Please try again.",
      values,
    };
  }

  revalidateTimetableSurfaces();
  const returnPath = sanitizeTimetableReturnPath(parsed.data.returnTo);
  redirect(
    withQuery(returnPath, {
      notice: "created",
      room: reference.roomNumber,
      ...(reference.autoAssigned ? { assigned: "auto" } : {}),
    }),
  );
}

export async function updateTimetableEntryAction(
  _previousState: TimetableFormState,
  formData: FormData,
): Promise<TimetableFormState> {
  const user = await requireRole(["STAFF"]);
  const departmentId = requireDepartment(user, "/timetable");
  const values = readEntryValues(formData);
  const parsed = updateTimetableEntrySchema.safeParse({
    ...values,
    entryId: formValue(formData, "entryId"),
  });

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: getFieldErrors(
        parsed.error,
        TIMETABLE_ENTRY_FORM_FIELDS,
      ) as Partial<Record<TimetableEntryFormField, string>>,
      values,
    };
  }

  const existing = await getTimetableEntryById(
    parsed.data.entryId,
    departmentId,
  );

  if (!existing) {
    return {
      error:
        "This class no longer exists. Return to the timetable and try again.",
      values,
    };
  }

  const startMinute = parseTimeInput(parsed.data.startTime);
  const endMinute = parseTimeInput(parsed.data.endTime);

  if (startMinute === null || endMinute === null) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: {
        startTime:
          startMinute === null ? "Choose a valid start time." : undefined,
        endTime: endMinute === null ? "Choose a valid end time." : undefined,
      },
      values,
    };
  }

  if (endMinute <= startMinute) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: { endTime: "The end time must be after the start time." },
      values,
    };
  }

  const reference = await validateEntryReferences({
    departmentId,
    courseId: parsed.data.courseId,
    batchId: parsed.data.batchId,
    teacherId: parsed.data.teacherId,
    roomId: parsed.data.roomId,
    dayOfWeek: parsed.data.dayOfWeek,
    startMinute,
    endMinute,
    excludeEntryId: existing.id,
  });

  if ("error" in reference) {
    return {
      ...reference,
      values,
    };
  }

  try {
    await prisma.timetableEntry.update({
      where: { id: existing.id },
      data: {
        courseId: reference.courseId,
        batchId: reference.batchId,
        teacherId: reference.teacherId,
        roomId: reference.roomId,
        dayOfWeek: parsed.data.dayOfWeek,
        startMinute,
        endMinute,
      },
    });
  } catch (error) {
    console.error("Timetable entry update failed", error);
    return {
      error: "The changes could not be saved. Please try again.",
      values,
    };
  }

  revalidateTimetableSurfaces();
  const returnPath = sanitizeTimetableReturnPath(parsed.data.returnTo);
  redirect(
    withQuery(returnPath, {
      notice: "updated",
      room: reference.roomNumber,
      ...(reference.autoAssigned ? { assigned: "auto" } : {}),
    }),
  );
}

export async function deleteTimetableEntryAction(
  formData: FormData,
): Promise<void> {
  const user = await requireRole(["STAFF"]);
  const departmentId = requireDepartment(user, "/timetable");
  const parsed = deleteTimetableEntrySchema.safeParse({
    entryId: formValue(formData, "entryId"),
    returnTo: formValue(formData, "returnTo"),
  });
  const returnPath = sanitizeTimetableReturnPath(
    formValue(formData, "returnTo"),
  );

  if (!parsed.success) {
    redirect(withQuery(returnPath, { problem: "invalid" }));
  }

  let deleted = false;

  try {
    const result = await prisma.timetableEntry.deleteMany({
      where: {
        id: parsed.data.entryId,
        course: { departmentId },
      },
    });
    deleted = result.count > 0;
  } catch (error) {
    console.error("Timetable entry deletion failed", error);
    redirect(withQuery(returnPath, { problem: "delete-failed" }));
  }

  if (!deleted) {
    redirect(withQuery(returnPath, { problem: "missing" }));
  }

  revalidateTimetableSurfaces();
  redirect(withQuery(returnPath, { notice: "deleted" }));
}
