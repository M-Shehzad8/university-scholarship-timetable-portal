import { describe, expect, it } from "vitest";

import {
  createUserSchema,
  emailSchema,
  loginSchema,
  passwordPolicySchema,
  roleSchema,
  setUserActiveSchema,
  updateUserRoleSchema,
} from "@/lib/validation/auth";
import {
  bookmarkSchema,
  sanitizeScholarshipReturnPath,
  scholarshipFormSchema,
  scholarshipStatusActionSchema,
  staffScholarshipFilterSchema,
  studentCatalogueFilterSchema,
} from "@/lib/validation/scholarship";
import {
  batchFormSchema,
  courseFormSchema,
  deleteReferenceSchema,
  roomFormSchema,
  sanitizeTimetableReturnPath,
  teacherFormSchema,
  timetableEntryFormSchema,
  timetableFilterSchema,
} from "@/lib/validation/timetable";
import {
  notificationFilterSchema,
  notificationIdSchema,
} from "@/lib/validation/notifications";

describe("authentication validation", () => {
  it("normalises email addresses", () => {
    expect(emailSchema.parse("  Student@University.EDU ")).toBe(
      "student@university.edu",
    );
  });

  it("rejects malformed email addresses", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    expect(emailSchema.safeParse("").success).toBe(false);
  });

  it("enforces the password policy", () => {
    expect(passwordPolicySchema.safeParse("PortalDemo2026!").success).toBe(true);
    expect(passwordPolicySchema.safeParse("short1").success).toBe(false);
    expect(passwordPolicySchema.safeParse("allletterslong").success).toBe(false);
    expect(passwordPolicySchema.safeParse("123456789012").success).toBe(false);
  });

  it("accepts only known roles", () => {
    expect(roleSchema.parse("STAFF")).toBe("STAFF");
    expect(roleSchema.safeParse("ADMIN").success).toBe(false);
    expect(roleSchema.safeParse("student").success).toBe(false);
  });

  it("validates login input without applying the password policy", () => {
    expect(
      loginSchema.parse({ email: "A@B.COM", password: "x" }),
    ).toEqual({ email: "a@b.com", password: "x" });
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(
      false,
    );
  });

  it("validates user creation and role updates", () => {
    expect(
      createUserSchema.parse({
        name: "  Portal User  ",
        email: " USER@UNIVERSITY.EDU ",
        password: "PortalDemo2026!",
        role: "STUDENT",
      }),
    ).toMatchObject({
      name: "Portal User",
      email: "user@university.edu",
      role: "STUDENT",
    });

    expect(
      createUserSchema.safeParse({
        name: "P",
        email: "user@university.edu",
        password: "weak",
        role: "STUDENT",
      }).success,
    ).toBe(false);

    expect(
      updateUserRoleSchema.parse({ userId: "user-1", role: "STAFF" }),
    ).toEqual({ userId: "user-1", role: "STAFF" });
    expect(
      setUserActiveSchema.parse({ userId: "user-1", isActive: "false" }),
    ).toEqual({ userId: "user-1", isActive: "false" });
  });
});

describe("scholarship validation", () => {
  const validScholarship = {
    title: "Merit Scholarship",
    provider: "University Foundation",
    category: "Merit",
    description:
      "Awarded to students with an outstanding academic record each year.",
    eligibility: "Open to full-time undergraduate students.",
    benefits: "Full tuition fee waiver.",
    requiredDocuments: "Transcript and CNIC copy.",
    deadline: "2026-12-21",
    applicationUrl: "https://example.edu/scholarships/merit",
  };

  it("accepts a complete, valid scholarship", () => {
    expect(scholarshipFormSchema.parse(validScholarship)).toMatchObject(
      validScholarship,
    );
  });

  it("defaults the optional category to an empty string", () => {
    const withoutCategory: Record<string, unknown> = { ...validScholarship };
    delete withoutCategory.category;

    expect(scholarshipFormSchema.parse(withoutCategory).category).toBe("");
  });

  it("rejects impossible deadlines and unsupported URLs", () => {
    expect(
      scholarshipFormSchema.safeParse({
        ...validScholarship,
        deadline: "2026-02-31",
      }).success,
    ).toBe(false);
    expect(
      scholarshipFormSchema.safeParse({
        ...validScholarship,
        applicationUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    expect(
      scholarshipFormSchema.safeParse({
        ...validScholarship,
        applicationUrl: "example.edu/form",
      }).success,
    ).toBe(false);
  });

  it("rejects text that is too short for its field", () => {
    expect(
      scholarshipFormSchema.safeParse({
        ...validScholarship,
        description: "Too short",
        eligibility: "Short",
        benefits: "Cash",
        requiredDocuments: "ID",
      }).success,
    ).toBe(false);
  });

  it("validates bookmark and status actions", () => {
    expect(
      bookmarkSchema.parse({ scholarshipId: "sch-1", intent: "save" }),
    ).toMatchObject({ scholarshipId: "sch-1", intent: "save", returnTo: "" });
    expect(
      bookmarkSchema.safeParse({ scholarshipId: "sch-1", intent: "delete" })
        .success,
    ).toBe(false);
    expect(
      scholarshipStatusActionSchema.safeParse({ scholarshipId: "" }).success,
    ).toBe(false);
  });

  it("falls back to safe filter values instead of failing the page", () => {
    expect(
      staffScholarshipFilterSchema.parse({
        q: "merit",
        category: "",
        status: "unknown",
      }).status,
    ).toBe("all");
    expect(
      studentCatalogueFilterSchema.parse({
        q: "",
        category: "",
        deadline: "later",
        view: "saved",
      }),
    ).toMatchObject({ deadline: undefined, view: "saved" });
  });

  it("allows only same-origin scholarship return paths", () => {
    expect(sanitizeScholarshipReturnPath("/scholarships?q=merit")).toBe(
      "/scholarships?q=merit",
    );
    expect(sanitizeScholarshipReturnPath("/scholarships/sch-1")).toBe(
      "/scholarships/sch-1",
    );
    expect(sanitizeScholarshipReturnPath("/timetable")).toBe("/scholarships");
    expect(
      sanitizeScholarshipReturnPath("https://evil.example/scholarships"),
    ).toBe("/scholarships");
    expect(sanitizeScholarshipReturnPath("//evil.example/scholarships")).toBe(
      "/scholarships",
    );
    expect(sanitizeScholarshipReturnPath(null)).toBe("/scholarships");
  });
});

describe("timetable validation", () => {
  it("normalises course codes and room numbers", () => {
    expect(
      courseFormSchema.parse({ code: " cs-101 ", title: "Intro to CS" }),
    ).toEqual({ code: "CS-101", title: "Intro to CS" });
    expect(
      roomFormSchema.parse({ roomNumber: " a-12 ", building: "Main" }),
    ).toEqual({ roomNumber: "A-12", building: "Main" });
  });

  it("rejects malformed course codes and empty reference data", () => {
    expect(
      courseFormSchema.safeParse({ code: "CS@101", title: "Intro" }).success,
    ).toBe(false);
    expect(
      batchFormSchema.safeParse({ name: "", section: "7A" }).success,
    ).toBe(false);
    expect(
      teacherFormSchema.safeParse({ name: "A", email: "" }).success,
    ).toBe(false);
  });

  it("treats a teacher email as optional but validates it when present", () => {
    expect(teacherFormSchema.parse({ name: "Teacher One" }).email).toBe("");
    expect(
      teacherFormSchema.safeParse({
        name: "Teacher One",
        email: "not-an-email",
      }).success,
    ).toBe(false);
  });

  it("accepts a valid timetable entry", () => {
    expect(
      timetableEntryFormSchema.parse({
        courseId: "course-1",
        batchId: "batch-1",
        teacherId: "teacher-1",
        dayOfWeek: "MONDAY",
        startTime: "09:00",
        endTime: "10:00",
        roomId: "room-1",
      }),
    ).toMatchObject({ dayOfWeek: "MONDAY", returnTo: "" });
  });

  it("rejects an invalid day, clock value, or missing room", () => {
    const base = {
      courseId: "course-1",
      batchId: "batch-1",
      teacherId: "teacher-1",
      dayOfWeek: "MONDAY",
      startTime: "09:00",
      endTime: "10:00",
      roomId: "room-1",
    };

    expect(
      timetableEntryFormSchema.safeParse({ ...base, dayOfWeek: "FUNDAY" })
        .success,
    ).toBe(false);
    expect(
      timetableEntryFormSchema.safeParse({ ...base, startTime: "9:00" }).success,
    ).toBe(false);
    expect(
      timetableEntryFormSchema.safeParse({ ...base, endTime: "24:01" }).success,
    ).toBe(false);
    expect(
      timetableEntryFormSchema.safeParse({ ...base, roomId: "" }).success,
    ).toBe(false);
  });

  it("validates filter and delete payloads", () => {
    expect(timetableFilterSchema.parse({ batch: "  " })).toEqual({
      batch: "",
      teacher: "",
      day: "",
      q: "",
    });
    expect(deleteReferenceSchema.parse({ id: "room-1" }).returnTo).toBe("");
  });

  it("allows only timetable and room return paths", () => {
    expect(sanitizeTimetableReturnPath("/timetable?day=MONDAY")).toBe(
      "/timetable?day=MONDAY",
    );
    expect(sanitizeTimetableReturnPath("/rooms")).toBe("/rooms");
    expect(sanitizeTimetableReturnPath("/rooms/room-1")).toBe("/rooms/room-1");
    expect(sanitizeTimetableReturnPath("/users")).toBe("/timetable");
    expect(sanitizeTimetableReturnPath("https://evil.example/timetable")).toBe(
      "/timetable",
    );
    expect(sanitizeTimetableReturnPath("")).toBe("/timetable");
  });
});

describe("notification validation", () => {
  it("defaults the notification filter to all", () => {
    expect(notificationFilterSchema.parse({})).toEqual({ view: "all" });
    expect(notificationFilterSchema.parse({ view: "unread" })).toEqual({
      view: "unread",
    });
  });

  it("rejects an unknown notification view", () => {
    expect(notificationFilterSchema.safeParse({ view: "archived" }).success).toBe(
      false,
    );
  });

  it("requires a non-empty notification id", () => {
    expect(notificationIdSchema.parse({ notificationId: " note-1 " })).toEqual({
      notificationId: "note-1",
    });
    expect(
      notificationIdSchema.safeParse({ notificationId: "   " }).success,
    ).toBe(false);
  });
});
