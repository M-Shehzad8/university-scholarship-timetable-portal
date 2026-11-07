import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/auth/session", () => ({
  getSessionUser: vi.fn(),
}));

import { getSessionUser } from "@/lib/auth/session";
import {
  requireCoordinator,
  requireRole,
  requireStaffOrCoordinator,
  requireUser,
} from "@/lib/auth/dal";
import {
  ALL_ROLES,
  canManageUsers,
  canViewOperations,
  getUserScopeLabel,
  roleBadgeTone,
  ROLE_LABELS,
  STAFF_ROLES,
} from "@/lib/auth/roles";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { filterNavigationByRole } from "@/lib/portal/navigation";

const getSessionUserMock = vi.mocked(getSessionUser);

function user(
  role: AuthenticatedUser["role"],
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    id: `user-${role.toLowerCase()}`,
    name: "Portal User",
    email: `${role.toLowerCase()}@university.edu`,
    role,
    isActive: true,
    batch: null,
    department: null,
    ...overrides,
  };
}

beforeEach(() => {
  getSessionUserMock.mockReset();
});

describe("session guards", () => {
  it("returns the signed-in user for any role", async () => {
    const student = user("STUDENT");
    getSessionUserMock.mockResolvedValue(student);

    await expect(requireUser()).resolves.toEqual(student);
  });

  it("redirects anonymous visitors to the login screen", async () => {
    getSessionUserMock.mockResolvedValue(null);

    await expect(requireUser()).rejects.toThrow("REDIRECT:/login");
  });

  it("allows a user whose role is on the allow-list", async () => {
    const staff = user("STAFF");
    getSessionUserMock.mockResolvedValue(staff);

    await expect(requireRole(STAFF_ROLES)).resolves.toEqual(staff);
    await expect(requireStaffOrCoordinator()).resolves.toEqual(staff);
  });

  it("blocks a role that is not on the allow-list", async () => {
    getSessionUserMock.mockResolvedValue(user("STUDENT"));

    await expect(requireStaffOrCoordinator()).rejects.toThrow(
      "REDIRECT:/dashboard?error=forbidden",
    );
    await expect(requireCoordinator()).rejects.toThrow(
      "REDIRECT:/dashboard?error=forbidden",
    );
  });

  it("allows the coordinator through the coordinator guard", async () => {
    const coordinator = user("COORDINATOR");
    getSessionUserMock.mockResolvedValue(coordinator);

    await expect(requireCoordinator()).resolves.toEqual(coordinator);
    await expect(requireStaffOrCoordinator()).resolves.toEqual(coordinator);
  });

  it("checks authentication before checking the role", async () => {
    getSessionUserMock.mockResolvedValue(null);

    await expect(requireRole(ALL_ROLES)).rejects.toThrow("REDIRECT:/login");
  });
});

describe("role predicates and labels", () => {
  it("exposes the expected role sets", () => {
    expect(ALL_ROLES).toEqual(["STUDENT", "STAFF", "COORDINATOR"]);
    expect(STAFF_ROLES).toEqual(["STAFF", "COORDINATOR"]);
  });

  it("only allows the coordinator to manage users", () => {
    expect(canManageUsers("COORDINATOR")).toBe(true);
    expect(canManageUsers("STAFF")).toBe(false);
    expect(canManageUsers("STUDENT")).toBe(false);
  });

  it("allows staff and coordinators to view operations", () => {
    expect(canViewOperations("COORDINATOR")).toBe(true);
    expect(canViewOperations("STAFF")).toBe(true);
    expect(canViewOperations("STUDENT")).toBe(false);
  });

  it("maps roles to their badge tone and label", () => {
    expect(roleBadgeTone("COORDINATOR")).toBe("warning");
    expect(roleBadgeTone("STAFF")).toBe("info");
    expect(roleBadgeTone("STUDENT")).toBe("success");
    expect(ROLE_LABELS).toEqual({
      STUDENT: "Student",
      STAFF: "Staff",
      COORDINATOR: "Coordinator",
    });
  });

  it("describes a student's batch scope and a staff department scope", () => {
    expect(
      getUserScopeLabel(
        user("STUDENT", {
          batch: { id: "batch-1", name: "BCS", section: "7A" },
        }),
      ),
    ).toBe("Batch BCS-7A");

    expect(getUserScopeLabel(user("STUDENT"))).toBe("No batch assigned");

    expect(
      getUserScopeLabel(
        user("STAFF", {
          department: { id: "dept-1", name: "Computer Science", code: "CS" },
        }),
      ),
    ).toBe("Computer Science (CS)");

    expect(getUserScopeLabel(user("COORDINATOR"))).toBe(
      "No department assigned",
    );
  });
});

describe("role-based navigation", () => {
  const hrefs = (role: Parameters<typeof filterNavigationByRole>[0]) =>
    filterNavigationByRole(role).flatMap((group) =>
      group.items.map((item) => item.href),
    );

  it("returns nothing for an anonymous visitor", () => {
    expect(filterNavigationByRole(null)).toEqual([]);
  });

  it("shows only shared pages to students", () => {
    expect(hrefs("STUDENT")).toEqual([
      "/dashboard",
      "/notifications",
      "/scholarships",
      "/timetable",
    ]);
  });

  it("adds rooms and reports for staff", () => {
    expect(hrefs("STAFF")).toEqual([
      "/dashboard",
      "/notifications",
      "/scholarships",
      "/timetable",
      "/rooms",
      "/reports",
    ]);
  });

  it("adds administration for coordinators", () => {
    expect(hrefs("COORDINATOR")).toEqual([
      "/dashboard",
      "/notifications",
      "/scholarships",
      "/timetable",
      "/rooms",
      "/reports",
      "/users",
    ]);
  });

  it("drops groups whose items are all hidden", () => {
    const studentGroups = filterNavigationByRole("STUDENT");
    expect(studentGroups.map((group) => group.label)).toEqual([
      "Overview",
      "Academic",
    ]);
  });
});
