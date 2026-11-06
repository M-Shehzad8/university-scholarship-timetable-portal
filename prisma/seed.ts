import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";

import { hashPassword } from "../lib/auth/password";
import type { Role, ScholarshipStatus } from "../lib/generated/prisma/enums";
import { PrismaClient } from "../lib/generated/prisma/client";
import { addDaysDateOnly, todayDateOnly } from "../lib/scholarships/rules";
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

type DemoScholarship = {
  id: string;
  title: string;
  provider: string;
  category: string;
  description: string;
  eligibility: string;
  benefits: string;
  requiredDocuments: string;
  deadline: Date;
  applicationUrl: string;
  status: ScholarshipStatus;
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

  const today = todayDateOnly();
  const relativeDate = (days: number) => addDaysDateOnly(today, days);

  const demoScholarships: DemoScholarship[] = [
    {
      id: "seed-scholarship-hec-need",
      title: "HEC Need-Based Scholarship 2026",
      provider: "Higher Education Commission",
      category: "Need-based",
      description:
        "A need-based support programme for undergraduate students enrolled in recognised Pakistani universities. The scholarship helps cover tuition and a modest living allowance for students facing financial hardship.",
      eligibility:
        "Enrolled undergraduate students with a demonstrated financial need, a minimum CGPA of 2.5, and no other full scholarship. Applicants must submit verified household income evidence.",
      benefits:
        "Tuition fee coverage up to the programme ceiling plus a monthly living stipend for the approved academic year.",
      requiredDocuments:
        "CNIC or B-Form copy\nLast transcript\nHousehold income certificate\nUniversity enrolment letter\nBank account details",
      deadline: relativeDate(45),
      applicationUrl: "https://www.hec.gov.pk/scholarships",
      status: "PUBLISHED",
    },
    {
      id: "seed-scholarship-merit",
      title: "University Merit Scholarship 2026",
      provider: "University of Engineering & Technology",
      category: "Merit",
      description:
        "A merit award for continuing students who have maintained an outstanding academic record across the previous two semesters. The award recognises consistent performance and encourages peer tutoring.",
      eligibility:
        "Continuing undergraduate students with a CGPA of 3.7 or above and no disciplinary record. Applicants must be enrolled in the current semester.",
      benefits:
        "A 50% tuition fee waiver for one semester and recognition at the annual academic awards ceremony.",
      requiredDocuments:
        "Latest result card\nCNIC copy\nDepartment recommendation letter",
      deadline: relativeDate(5),
      applicationUrl: "https://www.uet.edu.pk/scholarships",
      status: "PUBLISHED",
    },
    {
      id: "seed-scholarship-stem",
      title: "Women in STEM Grant",
      provider: "National Technology Fund",
      category: "STEM",
      description:
        "A grant that supports women pursuing computing, engineering, and applied science degrees. The programme combines fee support with mentorship from industry practitioners.",
      eligibility:
        "Women students in the third or fourth year of a computing, engineering, or applied science programme with a CGPA of at least 3.0.",
      benefits:
        "Partial tuition support, a project materials allowance, and a semester-long industry mentor.",
      requiredDocuments:
        "CNIC copy\nCurrent transcript\nPersonal statement\nTwo academic references",
      deadline: relativeDate(20),
      applicationUrl: "https://www.ignite.org.pk/scholarships",
      status: "PUBLISHED",
    },
    {
      id: "seed-scholarship-talent",
      title: "National Talent Scholarship 2025",
      provider: "Higher Education Commission",
      category: "Merit",
      description:
        "A previous-cycle talent award for high-achieving students. The application window is closed; this record remains available as a reference for students who saved it.",
      eligibility:
        "Students who completed at least two semesters with a CGPA of 3.5 or above during the 2025 academic cycle.",
      benefits: "One-time academic allowance and a certificate of achievement.",
      requiredDocuments: "2025 transcript\nCNIC copy\nDean's recommendation",
      deadline: relativeDate(-30),
      applicationUrl: "https://www.hec.gov.pk/scholarships",
      status: "PUBLISHED",
    },
    {
      id: "seed-scholarship-endowment",
      title: "Faculty Endowment Award 2027",
      provider: "University Endowment Office",
      category: "Research",
      description:
        "A draft award for final-year students preparing an applied research project with a faculty supervisor. The record is being reviewed and is not visible to students yet.",
      eligibility:
        "Final-year students with an approved research proposal and a faculty supervisor commitment.",
      benefits:
        "Research materials grant and conference travel support for accepted papers.",
      requiredDocuments:
        "Research proposal\nSupervisor endorsement\nBudget plan",
      deadline: relativeDate(90),
      applicationUrl: "https://www.uet.edu.pk/endowment",
      status: "DRAFT",
    },
    {
      id: "seed-scholarship-exchange",
      title: "Overseas Exchange Bursary",
      provider: "International Office",
      category: "Exchange",
      description:
        "An archived bursary that previously supported one-semester exchange placements. It is retained for staff reference and may reopen in a later cycle.",
      eligibility:
        "Students nominated by their department for a partner-university exchange semester.",
      benefits:
        "Partial travel and accommodation support for the exchange semester.",
      requiredDocuments:
        "Nomination letter\nPassport copy\nAcademic transcript",
      deadline: relativeDate(120),
      applicationUrl: "https://www.uet.edu.pk/international",
      status: "ARCHIVED",
    },
    {
      id: "seed-scholarship-sports",
      title: "Sports Excellence Award 2026",
      provider: "Directorate of Sports",
      category: "Sports",
      description:
        "A closed award that recognised students representing the university in national competitions. The record is retained as an explicitly expired reference.",
      eligibility:
        "Students who represented the university in a national-level competition during the previous academic year.",
      benefits: "Sports kit allowance and competition travel reimbursement.",
      requiredDocuments:
        "Competition certificate\nCoach recommendation\nCNIC copy",
      deadline: relativeDate(-90),
      applicationUrl: "https://www.uet.edu.pk/sports",
      status: "EXPIRED",
    },
  ];

  for (const demoScholarship of demoScholarships) {
    await prisma.scholarship.upsert({
      where: { id: demoScholarship.id },
      update: demoScholarship,
      create: demoScholarship,
    });
  }

  const student = await prisma.user.findUnique({
    where: { email: "student@university.edu" },
    select: { id: true },
  });

  if (student) {
    // One active and one expired bookmark demonstrate the saved-list marker.
    for (const scholarshipId of [
      "seed-scholarship-merit",
      "seed-scholarship-talent",
    ]) {
      await prisma.savedScholarship.upsert({
        where: {
          userId_scholarshipId: {
            userId: student.id,
            scholarshipId,
          },
        },
        update: {},
        create: {
          userId: student.id,
          scholarshipId,
        },
      });
    }
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
  console.log(
    `Scholarships: ${demoScholarships.length} demo records (draft, active, closing soon, expired, archived).`,
  );
}

main()
  .catch((error) => {
    console.error("Seeding failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
