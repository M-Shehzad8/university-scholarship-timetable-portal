import { prisma } from "@/lib/db/prisma";

export async function getUserManagementData() {
  const [users, departments, batches] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        batch: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    }),
    prisma.department.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    }),
    prisma.batch.findMany({
      orderBy: [{ name: "asc" }, { section: "asc" }],
      select: {
        id: true,
        name: true,
        section: true,
        department: {
          select: {
            code: true,
          },
        },
      },
    }),
  ]);

  return { users, departments, batches };
}
