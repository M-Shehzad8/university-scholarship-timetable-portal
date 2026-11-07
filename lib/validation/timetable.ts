import { z } from "zod";

import { parseTimeInput, TIMETABLE_DAYS } from "@/lib/timetable/rules";

export const COURSE_FORM_FIELDS = ["code", "title"] as const;
export const TEACHER_FORM_FIELDS = ["name", "email"] as const;
export const BATCH_FORM_FIELDS = ["name", "section"] as const;
export const ROOM_FORM_FIELDS = ["roomNumber", "building"] as const;
export const TIMETABLE_ENTRY_FORM_FIELDS = [
  "courseId",
  "batchId",
  "teacherId",
  "dayOfWeek",
  "startTime",
  "endTime",
  "roomId",
] as const;

export type TimetableEntryFormField =
  (typeof TIMETABLE_ENTRY_FORM_FIELDS)[number];

const referenceIdSchema = z
  .string()
  .trim()
  .min(1, "Choose a record.")
  .max(100, "The selected record is not valid.");

const requiredText = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `Enter the ${label}.`)
    .max(max, `${label[0]?.toUpperCase()}${label.slice(1)} is too long.`);

export const courseFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Enter the course code.")
    .max(20, "Course code is too long.")
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9 -]*$/,
      "Use letters, numbers, spaces, or hyphens.",
    )
    .transform((value) => value.toUpperCase()),
  title: requiredText("course title", 2, 120),
});

export const teacherFormSchema = z.object({
  name: requiredText("teacher name", 2, 120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Email address is too long.")
    .optional()
    .default("")
    .refine(
      (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Enter a valid email address.",
    ),
});

export const batchFormSchema = z.object({
  name: requiredText("programme or batch name", 1, 40),
  section: requiredText("section", 1, 20),
});

export const roomFormSchema = z.object({
  roomNumber: z
    .string()
    .trim()
    .min(1, "Enter the room number.")
    .max(20, "Room number is too long.")
    .transform((value) => value.toUpperCase()),
  building: z
    .string()
    .trim()
    .max(80, "Building name is too long.")
    .optional()
    .default(""),
});

export const timetableEntryFormSchema = z.object({
  courseId: referenceIdSchema,
  batchId: referenceIdSchema,
  teacherId: referenceIdSchema,
  dayOfWeek: z.enum(TIMETABLE_DAYS, {
    error: "Choose a valid day.",
  }),
  startTime: z
    .string()
    .trim()
    .min(1, "Choose a start time.")
    .refine((value) => parseTimeInput(value) !== null, {
      message: "Choose a valid start time.",
    }),
  endTime: z
    .string()
    .trim()
    .min(1, "Choose an end time.")
    .refine((value) => parseTimeInput(value) !== null, {
      message: "Choose a valid end time.",
    }),
  roomId: z
    .string()
    .trim()
    .min(1, "Choose a room or automatic assignment.")
    .max(100, "The selected room is not valid."),
  returnTo: z.string().max(500).optional().default(""),
});

export const updateCourseSchema = courseFormSchema.extend({
  courseId: z.string().trim().min(1).max(100),
});

export const updateTeacherSchema = teacherFormSchema.extend({
  teacherId: z.string().trim().min(1).max(100),
});

export const updateBatchSchema = batchFormSchema.extend({
  batchId: z.string().trim().min(1).max(100),
});

export const updateRoomSchema = roomFormSchema.extend({
  roomId: z.string().trim().min(1).max(100),
});

export const updateTimetableEntrySchema = timetableEntryFormSchema.extend({
  entryId: z.string().trim().min(1).max(100),
});

export const timetableFilterSchema = z.object({
  batch: z.string().trim().max(100).catch(""),
  teacher: z.string().trim().max(100).catch(""),
  day: z.string().trim().max(20).catch(""),
  q: z.string().trim().max(100).catch(""),
});

export const deleteReferenceSchema = z.object({
  id: z.string().trim().min(1).max(100),
  returnTo: z.string().max(500).optional().default(""),
});

export const deleteTimetableEntrySchema = z.object({
  entryId: z.string().trim().min(1).max(100),
  returnTo: z.string().max(500).optional().default(""),
});

/**
 * Return targets are limited to the timetable and room screens so the
 * `returnTo` field can never become an open redirect.
 */
export function sanitizeTimetableReturnPath(value: string | null): string {
  const fallback = "/timetable";

  if (!value) {
    return fallback;
  }

  try {
    const url = new URL(value, "http://portal.local");

    if (url.origin !== "http://portal.local") {
      return fallback;
    }

    const allowed =
      url.pathname === "/timetable" ||
      url.pathname.startsWith("/timetable/") ||
      url.pathname === "/rooms" ||
      url.pathname.startsWith("/rooms/");

    if (!allowed) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
