import { prisma } from "@/lib/db/prisma";
import type { Role } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";

import { addDaysDateOnly, CLOSING_SOON_DAYS, todayDateOnly } from "./rules";

export type StudentCatalogueFilters = {
  q: string;
  category: string;
  deadline: "active" | "soon" | "expired" | "all";
  view: "all" | "saved";
};

export type StaffScholarshipFilters = {
  q: string;
  category: string;
  status: "all" | "draft" | "active" | "expired" | "archived";
};

function textSearch(q: string): Prisma.ScholarshipWhereInput | null {
  if (!q) {
    return null;
  }

  const contains = { contains: q, mode: "insensitive" as const };

  return {
    OR: [
      { title: contains },
      { provider: contains },
      { category: contains },
      { description: contains },
      { eligibility: contains },
    ],
  };
}

function studentVisibilityWhere(
  deadline: StudentCatalogueFilters["deadline"],
): Prisma.ScholarshipWhereInput {
  const today = todayDateOnly();
  const soonLimit = addDaysDateOnly(today, CLOSING_SOON_DAYS);

  switch (deadline) {
    case "active":
      return { status: "PUBLISHED", deadline: { gte: today } };
    case "soon":
      return {
        status: "PUBLISHED",
        deadline: { gte: today, lte: soonLimit },
      };
    case "expired":
      return {
        OR: [
          { status: "EXPIRED" },
          { status: "PUBLISHED", deadline: { lt: today } },
        ],
      };
    case "all":
      return { OR: [{ status: "PUBLISHED" }, { status: "EXPIRED" }] };
  }
}

export async function getStudentCatalogue(
  userId: string,
  filters: StudentCatalogueFilters,
) {
  const conditions: Prisma.ScholarshipWhereInput[] = [
    studentVisibilityWhere(filters.deadline),
  ];

  const search = textSearch(filters.q);

  if (search) {
    conditions.push(search);
  }

  if (filters.category) {
    conditions.push({ category: filters.category });
  }

  if (filters.view === "saved") {
    conditions.push({ savedBy: { some: { userId } } });
  }

  return prisma.scholarship.findMany({
    where: { AND: conditions },
    orderBy: [
      { deadline: filters.deadline === "expired" ? "desc" : "asc" },
      { createdAt: "desc" },
    ],
    take: 100,
    select: {
      id: true,
      title: true,
      provider: true,
      category: true,
      description: true,
      deadline: true,
      status: true,
      updatedAt: true,
      savedBy: {
        where: { userId },
        select: { userId: true },
      },
    },
  });
}

export async function getStudentScholarshipStats(userId: string) {
  const today = todayDateOnly();
  const soonLimit = addDaysDateOnly(today, CLOSING_SOON_DAYS);

  const [active, closingSoon, saved] = await Promise.all([
    prisma.scholarship.count({
      where: { status: "PUBLISHED", deadline: { gte: today } },
    }),
    prisma.scholarship.count({
      where: {
        status: "PUBLISHED",
        deadline: { gte: today, lte: soonLimit },
      },
    }),
    prisma.savedScholarship.count({ where: { userId } }),
  ]);

  return { active, closingSoon, saved };
}

export async function getClosingSoonScholarships(take = 4) {
  const today = todayDateOnly();
  const soonLimit = addDaysDateOnly(today, CLOSING_SOON_DAYS);

  return prisma.scholarship.findMany({
    where: {
      status: "PUBLISHED",
      deadline: { gte: today, lte: soonLimit },
    },
    select: {
      id: true,
      title: true,
      provider: true,
      category: true,
      deadline: true,
    },
    orderBy: [{ deadline: "asc" }, { title: "asc" }],
    take,
  });
}

export async function getScholarshipCategories(role: Role) {
  const where: Prisma.ScholarshipWhereInput =
    role === "STUDENT"
      ? {
          OR: [{ status: "PUBLISHED" }, { status: "EXPIRED" }],
          category: { not: null },
        }
      : { category: { not: null } };

  const rows = await prisma.scholarship.findMany({
    where,
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  return rows
    .map((row) => row.category)
    .filter((category): category is string => Boolean(category?.trim()));
}

export async function getStaffScholarships(filters: StaffScholarshipFilters) {
  const today = todayDateOnly();
  const conditions: Prisma.ScholarshipWhereInput[] = [];

  const search = textSearch(filters.q);

  if (search) {
    conditions.push(search);
  }

  if (filters.category) {
    conditions.push({ category: filters.category });
  }

  switch (filters.status) {
    case "draft":
      conditions.push({ status: "DRAFT" });
      break;
    case "active":
      conditions.push({ status: "PUBLISHED", deadline: { gte: today } });
      break;
    case "expired":
      conditions.push({
        OR: [
          { status: "EXPIRED" },
          { status: "PUBLISHED", deadline: { lt: today } },
        ],
      });
      break;
    case "archived":
      conditions.push({ status: "ARCHIVED" });
      break;
    case "all":
      break;
  }

  return prisma.scholarship.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      provider: true,
      category: true,
      deadline: true,
      status: true,
      updatedAt: true,
      createdAt: true,
      _count: {
        select: { savedBy: true },
      },
    },
  });
}

export async function getStaffScholarshipStats() {
  const today = todayDateOnly();
  const soonLimit = addDaysDateOnly(today, CLOSING_SOON_DAYS);

  const [
    total,
    draft,
    active,
    closingSoon,
    explicitExpired,
    publishedPastDeadline,
    archived,
  ] = await Promise.all([
    prisma.scholarship.count(),
    prisma.scholarship.count({ where: { status: "DRAFT" } }),
    prisma.scholarship.count({
      where: { status: "PUBLISHED", deadline: { gte: today } },
    }),
    prisma.scholarship.count({
      where: {
        status: "PUBLISHED",
        deadline: { gte: today, lte: soonLimit },
      },
    }),
    prisma.scholarship.count({ where: { status: "EXPIRED" } }),
    prisma.scholarship.count({
      where: { status: "PUBLISHED", deadline: { lt: today } },
    }),
    prisma.scholarship.count({ where: { status: "ARCHIVED" } }),
  ]);

  return {
    total,
    draft,
    active,
    closingSoon,
    expired: explicitExpired + publishedPastDeadline,
    archived,
  };
}

export async function getScholarshipDetail(
  id: string,
  viewer: { id: string; role: Role },
) {
  const record = await prisma.scholarship.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      provider: true,
      category: true,
      description: true,
      eligibility: true,
      benefits: true,
      requiredDocuments: true,
      deadline: true,
      applicationUrl: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      savedBy: {
        where: { userId: viewer.id },
        select: { userId: true },
      },
      _count: {
        select: { savedBy: true },
      },
    },
  });

  if (!record) {
    return null;
  }

  if (
    viewer.role === "STUDENT" &&
    (record.status === "DRAFT" || record.status === "ARCHIVED")
  ) {
    return null;
  }

  return {
    ...record,
    isSaved: record.savedBy.length > 0,
  };
}

export async function getScholarshipForEdit(id: string) {
  return prisma.scholarship.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      provider: true,
      category: true,
      description: true,
      eligibility: true,
      benefits: true,
      requiredDocuments: true,
      deadline: true,
      applicationUrl: true,
      status: true,
      updatedAt: true,
    },
  });
}

export async function getScholarshipForAction(id: string) {
  return prisma.scholarship.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      provider: true,
      deadline: true,
      status: true,
    },
  });
}

export async function getActiveStudentIds() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", isActive: true },
    select: { id: true },
  });

  return students.map((student) => student.id);
}

export async function getSavedStudentIds(scholarshipId: string) {
  const rows = await prisma.savedScholarship.findMany({
    where: { scholarshipId },
    select: { userId: true },
  });

  return rows.map((row) => row.userId);
}
