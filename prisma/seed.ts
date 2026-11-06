import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";

import { hashPassword } from "../lib/auth/password";
import type { Role } from "../lib/generated/prisma/enums";
import { PrismaClient } from "../lib/generated/prisma/client";
import { passwordPolicySchema } from "../lib/validation/auth";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Configure it in .env.local before seeding.",
  );
}

const seedPassword = process.env.SEED_PASSWORD ?? "PortalDemo2026!";
const passwordCheck = passwordPolicySchema.safeParse(seedPassword);

if (!passwordCheck.success) {
  throw new Error(
    "SEED_PASSWORD does not meet the minimum policy: at least 12 characters, including a letter and a number.",
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
});

const prisma = new PrismaClient({ adapter });

type DemoUser = {
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  batchId: string | null;
  departmentId: string | null;
};

async function main() {
  const passwordHash = await hashPassword(seedPassword);

  const department = await prisma.department.upsert({
    where: { code: "CSE" },
    update: { name: "Computer Science" },
    create: {
      name: "Computer Science",
      code: "CSE",
    },
  });

  const batch = await prisma.batch.upsert({
    where: {
      departmentId_name_section: {
        departmentId: department.id,
        name: "BCS",
        section: "7A",
      },
    },
    update: {},
    create: {
      name: "BCS",
      section: "7A",
      departmentId: department.id,
    },
  });

  const demoUsers: DemoUser[] = [
    {
      name: "Dr. Ayesha Khan",
      email: "coordinator@university.edu",
      role: "COORDINATOR",
      isActive: true,
      batchId: null,
      departmentId: department.id,
    },
    {
      name: "Mr. Bilal Ahmed",
      email: "staff@university.edu",
      role: "STAFF",
      isActive: true,
      batchId: null,
      departmentId: department.id,
    },
    {
      name: "Sara Malik",
      email: "student@university.edu",
      role: "STUDENT",
      isActive: true,
      batchId: batch.id,
      departmentId: null,
    },
    {
      name: "Hamza Ali",
      email: "inactive@university.edu",
      role: "STUDENT",
      isActive: false,
      batchId: batch.id,
      departmentId: null,
    },
  ];

  for (const demoUser of demoUsers) {
    await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {
        name: demoUser.name,
        role: demoUser.role,
        isActive: demoUser.isActive,
        batchId: demoUser.batchId,
        departmentId: demoUser.departmentId,
        passwordHash,
      },
      create: {
        ...demoUser,
        passwordHash,
      },
    });
  }

  console.log("Seed data is ready.");
  console.log(`Department: ${department.name} (${department.code})`);
  console.log(`Batch: ${batch.name}-${batch.section}`);
  console.log(`Demo password: ${seedPassword}`);
  console.log("Accounts:");
  for (const demoUser of demoUsers) {
    console.log(
      `  ${demoUser.email} — ${demoUser.role}${demoUser.isActive ? "" : " (inactive)"}`,
    );
  }
}

main()
  .catch((error) => {
    console.error("Seeding failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
