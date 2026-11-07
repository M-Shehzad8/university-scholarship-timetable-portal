import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "@/lib/generated/prisma/client";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("timetable database rules", () => {
  let db: PrismaClient;
  let findTimetableConflicts: typeof import("@/lib/timetable/queries")["findTimetableConflicts"];
  let findFreeRoom: typeof import("@/lib/timetable/queries")["findFreeRoom"];

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const departmentCode = `IT${suffix}`.slice(0, 20).toUpperCase();

  let departmentId = "";
  let courseId = "";
  let teacherId = "";
  let otherTeacherId = "";
  let batchId = "";
  let otherBatchId = "";
  let room101Id = "";
  let room102Id = "";
  let room103Id = "";
  let entryId = "";

  beforeAll(async () => {
    ({ prisma: db } = await import("@/lib/db/prisma"));
    ({ findTimetableConflicts, findFreeRoom } = await import(
      "@/lib/timetable/queries"
    ));

    const department = await db.department.create({
      data: {
        name: `Integration Test ${suffix}`,
        code: departmentCode,
      },
    });
    departmentId = department.id;

    const [course, teacher, otherTeacher, batch, otherBatch, room101, room102, room103] =
      await Promise.all([
        db.course.create({
          data: {
            code: `IT-${suffix}`,
            title: "Integration Testing",
            departmentId,
          },
        }),
        db.teacher.create({
          data: {
            name: "Integration Teacher",
            email: `teacher-${suffix}@example.edu`,
            departmentId,
          },
        }),
        db.teacher.create({
          data: {
            name: "Other Teacher",
            email: `other-${suffix}@example.edu`,
            departmentId,
          },
        }),
        db.batch.create({
          data: { name: `ITB-${suffix}`, section: "A", departmentId },
        }),
        db.batch.create({
          data: { name: `ITB-${suffix}`, section: "B", departmentId },
        }),
        db.room.create({
          data: { roomNumber: "101", building: "Test", departmentId },
        }),
        db.room.create({
          data: { roomNumber: "102", building: "Test", departmentId },
        }),
        db.room.create({
          data: { roomNumber: "103", building: "Test", departmentId },
        }),
      ]);

    courseId = course.id;
    teacherId = teacher.id;
    otherTeacherId = otherTeacher.id;
    batchId = batch.id;
    otherBatchId = otherBatch.id;
    room101Id = room101.id;
    room102Id = room102.id;
    room103Id = room103.id;

    const entry = await db.timetableEntry.create({
      data: {
        courseId,
        batchId,
        teacherId,
        roomId: room101Id,
        dayOfWeek: "MONDAY",
        startMinute: 9 * 60,
        endMinute: 10 * 60,
      },
    });
    entryId = entry.id;
  });

  afterAll(async () => {
    if (!db) {
      return;
    }

    // Delete in dependency order so the shared database stays unchanged.
    await db.timetableEntry.deleteMany({ where: { course: { departmentId } } });
    await db.room.deleteMany({ where: { departmentId } });
    await db.batch.deleteMany({ where: { departmentId } });
    await db.teacher.deleteMany({ where: { departmentId } });
    await db.course.deleteMany({ where: { departmentId } });
    await db.department.deleteMany({ where: { id: departmentId } });
    await db.$disconnect();
  });

  it("detects teacher, batch, and room conflicts for a real interval", async () => {
    const conflicts = await findTimetableConflicts({
      dayOfWeek: "MONDAY",
      startMinute: 9 * 60 + 30,
      endMinute: 10 * 60 + 30,
      teacherId,
      batchId,
      roomId: room101Id,
    });

    expect(conflicts.map((conflict) => conflict.type).sort()).toEqual([
      "batch",
      "room",
      "teacher",
    ]);
    expect(conflicts.every((conflict) => conflict.entry.id === entryId)).toBe(
      true,
    );
  });

  it("does not treat touching intervals as a conflict", async () => {
    const conflicts = await findTimetableConflicts({
      dayOfWeek: "MONDAY",
      startMinute: 10 * 60,
      endMinute: 11 * 60,
      teacherId,
      batchId,
      roomId: room101Id,
    });

    expect(conflicts).toEqual([]);
  });

  it("ignores entries on another day or for unrelated resources", async () => {
    const otherDay = await findTimetableConflicts({
      dayOfWeek: "TUESDAY",
      startMinute: 9 * 60,
      endMinute: 10 * 60,
      teacherId,
      batchId,
      roomId: room101Id,
    });
    const unrelated = await findTimetableConflicts({
      dayOfWeek: "MONDAY",
      startMinute: 9 * 60 + 30,
      endMinute: 10 * 60 + 30,
      teacherId: otherTeacherId,
      batchId: otherBatchId,
      roomId: room102Id,
    });

    expect(otherDay).toEqual([]);
    expect(unrelated).toEqual([]);
  });

  it("excludes the entry being edited", async () => {
    const conflicts = await findTimetableConflicts({
      dayOfWeek: "MONDAY",
      startMinute: 9 * 60,
      endMinute: 10 * 60,
      teacherId,
      batchId,
      roomId: room101Id,
      excludeEntryId: entryId,
    });

    expect(conflicts).toEqual([]);
  });

  it("assigns the first free room in room-number order", async () => {
    const free = await findFreeRoom({
      departmentId,
      dayOfWeek: "MONDAY",
      startMinute: 9 * 60 + 30,
      endMinute: 10 * 60 + 30,
    });

    expect(free?.id).toBe(room102Id);
  });

  it("returns the occupied room when it is excluded from the check", async () => {
    const free = await findFreeRoom({
      departmentId,
      dayOfWeek: "MONDAY",
      startMinute: 9 * 60 + 30,
      endMinute: 10 * 60 + 30,
      excludeEntryId: entryId,
    });

    expect(free?.id).toBe(room101Id);
  });

  it("returns null when every department room is occupied", async () => {
    const otherEntries = [
      await db.timetableEntry.create({
        data: {
          courseId,
          batchId: otherBatchId,
          teacherId: otherTeacherId,
          roomId: room102Id,
          dayOfWeek: "MONDAY",
          startMinute: 9 * 60,
          endMinute: 10 * 60,
        },
      }),
      await db.timetableEntry.create({
        data: {
          courseId,
          batchId: otherBatchId,
          teacherId: otherTeacherId,
          roomId: room103Id,
          dayOfWeek: "MONDAY",
          startMinute: 9 * 60,
          endMinute: 10 * 60,
        },
      }),
    ];

    try {
      const free = await findFreeRoom({
        departmentId,
        dayOfWeek: "MONDAY",
        startMinute: 9 * 60 + 15,
        endMinute: 9 * 60 + 45,
      });

      expect(free).toBeNull();
    } finally {
      await db.timetableEntry.deleteMany({
        where: { id: { in: otherEntries.map((entry) => entry.id) } },
      });
    }
  });
});
