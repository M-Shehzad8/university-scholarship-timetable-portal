import { describe, expect, it } from "vitest";

import {
  describeUpcomingEntry,
  findTimetableConflictPairs,
  findUpcomingTimetableEntry,
  formatEntrySlot,
  formatMinutes,
  formatTimeRange,
  getPortalDayOfWeek,
  getPortalMinutes,
  intervalsOverlap,
  parseTimeInput,
  sortTimetableEntries,
  type ConflictEntryShape,
  type TimetableDay,
} from "@/lib/timetable/rules";
import { selectFirstFreeRoom } from "@/lib/timetable/room-assignment";

function entry(
  overrides: Partial<ConflictEntryShape> & { id: string },
): ConflictEntryShape {
  return {
    dayOfWeek: "MONDAY",
    startMinute: 9 * 60,
    endMinute: 10 * 60,
    course: { code: "CS-101", title: "Intro" },
    teacher: { id: "teacher-1", name: "Teacher One" },
    batch: { id: "batch-1", name: "BCS", section: "7A" },
    room: { id: "room-1", roomNumber: "101" },
    ...overrides,
  };
}

function slot(
  id: string,
  dayOfWeek: TimetableDay,
  startMinute: number,
  endMinute: number,
) {
  return { id, dayOfWeek, startMinute, endMinute };
}

describe("time helpers", () => {
  it("parses valid clock values and the exclusive end of day", () => {
    expect(parseTimeInput("00:00")).toBe(0);
    expect(parseTimeInput("09:30")).toBe(570);
    expect(parseTimeInput("23:59")).toBe(1_439);
    expect(parseTimeInput("24:00")).toBe(1_440);
  });

  it("rejects malformed and impossible clock values", () => {
    expect(parseTimeInput("24:01")).toBeNull();
    expect(parseTimeInput("9:00")).toBeNull();
    expect(parseTimeInput("12:60")).toBeNull();
    expect(parseTimeInput("noon")).toBeNull();
    expect(parseTimeInput("")).toBeNull();
  });

  it("formats minutes and ranges consistently", () => {
    expect(formatMinutes(0)).toBe("00:00");
    expect(formatMinutes(570)).toBe("09:30");
    expect(formatMinutes(1_439)).toBe("23:59");
    expect(formatTimeRange(540, 600)).toBe("09:00–10:00");
    expect(formatEntrySlot("MONDAY", 540, 600)).toBe("Monday 09:00–10:00");
  });

  it("uses the portal time zone for the current weekday and minute", () => {
    expect(getPortalDayOfWeek(new Date("2026-11-07T20:00:00Z"))).toBe("SUNDAY");
    expect(getPortalMinutes(new Date("2026-11-07T20:00:00Z"))).toBe(60);
    expect(getPortalDayOfWeek(new Date("2026-11-07T18:59:00Z"))).toBe(
      "SATURDAY",
    );
    expect(getPortalMinutes(new Date("2026-11-07T18:59:00Z"))).toBe(1_439);
  });
});

describe("interval overlap", () => {
  it("treats touching boundaries as non-overlapping", () => {
    expect(intervalsOverlap(540, 600, 600, 660)).toBe(false);
    expect(intervalsOverlap(600, 660, 540, 600)).toBe(false);
  });

  it("detects real overlap regardless of argument order", () => {
    expect(intervalsOverlap(540, 600, 570, 630)).toBe(true);
    expect(intervalsOverlap(570, 630, 540, 600)).toBe(true);
    expect(intervalsOverlap(540, 660, 570, 600)).toBe(true);
  });

  it("does not overlap an interval with itself when it has zero length", () => {
    expect(intervalsOverlap(540, 540, 540, 540)).toBe(false);
  });
});

describe("timetable ordering and conflicts", () => {
  it("sorts by day, then start, then end", () => {
    const sorted = sortTimetableEntries([
      slot("c", "TUESDAY", 540, 600),
      slot("b", "MONDAY", 600, 660),
      slot("a", "MONDAY", 540, 600),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("reports teacher, batch, and room conflicts separately", () => {
    const first = entry({ id: "first" });
    const second = entry({
      id: "second",
      startMinute: 9 * 60 + 30,
      endMinute: 10 * 60 + 30,
    });

    const conflicts = findTimetableConflictPairs([first, second]);

    expect(conflicts.map((pair) => pair.type).sort()).toEqual([
      "batch",
      "room",
      "teacher",
    ]);
    expect(conflicts.every((pair) => pair.first.id === "first")).toBe(true);
    expect(conflicts.every((pair) => pair.second.id === "second")).toBe(true);
  });

  it("ignores entries on another day or without a shared resource", () => {
    const first = entry({ id: "first" });
    const otherDay = entry({ id: "other-day", dayOfWeek: "TUESDAY" });
    const separate = entry({
      id: "separate",
      teacher: { id: "teacher-2", name: "Teacher Two" },
      batch: { id: "batch-2", name: "BCS", section: "7B" },
      room: { id: "room-2", roomNumber: "102" },
    });

    expect(findTimetableConflictPairs([first, otherDay])).toEqual([]);
    expect(findTimetableConflictPairs([first, separate])).toEqual([]);
  });

  it("can report more than one conflict type for the same pair", () => {
    const first = entry({ id: "first" });
    const second = entry({ id: "second" });

    expect(findTimetableConflictPairs([first, second])).toHaveLength(3);
  });
});

describe("upcoming class", () => {
  it("chooses a later class today", () => {
    const upcoming = findUpcomingTimetableEntry(
      [slot("ended", "MONDAY", 480, 540), slot("later", "MONDAY", 600, 660)],
      "MONDAY",
      540,
    );

    expect(upcoming?.entry.id).toBe("later");
    expect(upcoming?.daysAhead).toBe(0);
    expect(upcoming?.inProgress).toBe(false);
  });

  it("marks a class that is currently running", () => {
    const upcoming = findUpcomingTimetableEntry(
      [slot("running", "MONDAY", 510, 570)],
      "MONDAY",
      540,
    );

    expect(upcoming?.entry.id).toBe("running");
    expect(upcoming?.inProgress).toBe(true);
    expect(describeUpcomingEntry(upcoming!)).toBe("In progress · 08:30–09:30");
  });

  it("wraps to the next week when all of today's classes have ended", () => {
    const upcoming = findUpcomingTimetableEntry(
      [slot("next-week", "MONDAY", 600, 660)],
      "MONDAY",
      700,
    );

    expect(upcoming?.entry.id).toBe("next-week");
    expect(upcoming?.daysAhead).toBe(7);
    expect(describeUpcomingEntry(upcoming!)).toBe("Monday · 10:00–11:00");
  });

  it("describes tomorrow and today", () => {
    const tomorrow = findUpcomingTimetableEntry(
      [slot("tomorrow", "TUESDAY", 540, 600)],
      "MONDAY",
      700,
    );
    const today = findUpcomingTimetableEntry(
      [slot("today", "MONDAY", 720, 780)],
      "MONDAY",
      700,
    );

    expect(describeUpcomingEntry(tomorrow!)).toBe("Tomorrow · 09:00–10:00");
    expect(describeUpcomingEntry(today!)).toBe("Today · 12:00–13:00");
  });

  it("returns null for an empty schedule", () => {
    expect(findUpcomingTimetableEntry([], "MONDAY", 540)).toBeNull();
  });
});

describe("automatic room selection", () => {
  const rooms = [
    { id: "room-101", roomNumber: "101" },
    { id: "room-102", roomNumber: "102" },
    { id: "room-103", roomNumber: "103" },
  ];

  it("returns the first free room in the supplied order", () => {
    expect(selectFirstFreeRoom(rooms, new Set(["room-101"]))).toEqual(
      rooms[1],
    );
  });

  it("returns null when every room is occupied", () => {
    expect(
      selectFirstFreeRoom(
        rooms,
        new Set(["room-101", "room-102", "room-103"]),
      ),
    ).toBeNull();
  });

  it("returns null when the department has no rooms", () => {
    expect(selectFirstFreeRoom([], new Set())).toBeNull();
  });
});
