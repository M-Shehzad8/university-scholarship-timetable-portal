import { describe, expect, it } from "vitest";

import {
  addDaysDateOnly,
  CLOSING_SOON_DAYS,
  describeDeadline,
  deriveEffectiveState,
  isActiveState,
  isDeadlinePassed,
  todayDateOnly,
  toDateInputValue,
} from "@/lib/scholarships/rules";

const now = new Date("2026-11-07T12:00:00Z");
const today = todayDateOnly(now);

describe("scholarship effective state", () => {
  it("keeps non-published statuses as their stored state", () => {
    expect(deriveEffectiveState("DRAFT", addDaysDateOnly(today, 30), now)).toBe(
      "DRAFT",
    );
    expect(
      deriveEffectiveState("ARCHIVED", addDaysDateOnly(today, 30), now),
    ).toBe("ARCHIVED");
    expect(
      deriveEffectiveState("EXPIRED", addDaysDateOnly(today, 30), now),
    ).toBe("EXPIRED");
  });

  it("treats a published record as active when the deadline is far away", () => {
    expect(
      deriveEffectiveState(
        "PUBLISHED",
        addDaysDateOnly(today, CLOSING_SOON_DAYS + 1),
        now,
      ),
    ).toBe("ACTIVE");
  });

  it("treats the closing-soon boundary as inclusive", () => {
    expect(
      deriveEffectiveState(
        "PUBLISHED",
        addDaysDateOnly(today, CLOSING_SOON_DAYS),
        now,
      ),
    ).toBe("CLOSING_SOON");
    expect(
      deriveEffectiveState("PUBLISHED", addDaysDateOnly(today, 0), now),
    ).toBe("CLOSING_SOON");
  });

  it("treats a passed deadline as expired without changing stored status", () => {
    expect(
      deriveEffectiveState("PUBLISHED", addDaysDateOnly(today, -1), now),
    ).toBe("EXPIRED");
  });

  it("defines active states consistently", () => {
    expect(isActiveState("ACTIVE")).toBe(true);
    expect(isActiveState("CLOSING_SOON")).toBe(true);
    expect(isActiveState("EXPIRED")).toBe(false);
    expect(isActiveState("ARCHIVED")).toBe(false);
    expect(isActiveState("DRAFT")).toBe(false);
  });
});

describe("deadline helpers", () => {
  it("detects whether a deadline has passed", () => {
    expect(isDeadlinePassed(addDaysDateOnly(today, -1), now)).toBe(true);
    expect(isDeadlinePassed(today, now)).toBe(false);
    expect(isDeadlinePassed(addDaysDateOnly(today, 1), now)).toBe(false);
  });

  it("describes past, today, and future deadlines", () => {
    expect(describeDeadline(addDaysDateOnly(today, -2), now)).toBe(
      "Closed 2 days ago",
    );
    expect(describeDeadline(addDaysDateOnly(today, -1), now)).toBe(
      "Closed 1 day ago",
    );
    expect(describeDeadline(today, now)).toBe("Closes today");
    expect(describeDeadline(addDaysDateOnly(today, 1), now)).toBe(
      "1 day remaining",
    );
    expect(describeDeadline(addDaysDateOnly(today, 5), now)).toBe(
      "5 days remaining",
    );
  });

  it("round-trips a date-only value for form fields", () => {
    expect(toDateInputValue(today)).toBe("2026-11-07");
  });
});
