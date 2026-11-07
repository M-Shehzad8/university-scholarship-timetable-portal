import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";

import { hashPassword } from "../lib/auth/password";
import type {
  DayOfWeek,
  Role,
  ScholarshipStatus,
} from "../lib/generated/prisma/enums";
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

  const secondBatch = await prisma.batch.upsert({
    where: {
      departmentId_name_section: {
        departmentId: department.id,
        name: "BCS",
        section: "7B",
      },
    },
    update: {},
    create: {
      name: "BCS",
      section: "7B",
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

  const courseSeeds = [
    { code: "CS-301", title: "Design and Analysis of Algorithms" },
    { code: "CS-302", title: "Database Systems" },
    { code: "CS-303", title: "Operating Systems" },
    { code: "CS-304", title: "Computer Networks" },
    { code: "CS-305", title: "Software Engineering" },
  ];

  const courseIds = new Map<string, string>();

  for (const seed of courseSeeds) {
    const course = await prisma.course.upsert({
      where: {
        departmentId_code: {
          departmentId: department.id,
          code: seed.code,
        },
      },
      update: { title: seed.title },
      create: {
        code: seed.code,
        title: seed.title,
        departmentId: department.id,
      },
    });

    courseIds.set(course.code, course.id);
  }

  const teacherSeeds = [
    {
      name: "Dr. Imran Sheikh",
      email: "imran.sheikh@university.edu",
    },
    {
      name: "Dr. Nadia Raza",
      email: "nadia.raza@university.edu",
    },
    {
      name: "Mr. Usman Tariq",
      email: "usman.tariq@university.edu",
    },
    {
      name: "Ms. Hira Qureshi",
      email: "hira.qureshi@university.edu",
    },
    {
      name: "Dr. Farhan Iqbal",
      email: "farhan.iqbal@university.edu",
    },
  ];

  const teacherIds = new Map<string, string>();

  for (const seed of teacherSeeds) {
    const teacher = await prisma.teacher.upsert({
      where: {
        departmentId_email: {
          departmentId: department.id,
          email: seed.email,
        },
      },
      update: { name: seed.name },
      create: {
        name: seed.name,
        email: seed.email,
        departmentId: department.id,
      },
    });

    teacherIds.set(teacher.email ?? seed.email, teacher.id);
  }

  const roomSeeds = [
    { roomNumber: "101", building: "Main Block" },
    { roomNumber: "102", building: "Main Block" },
    { roomNumber: "103", building: "Main Block" },
    { roomNumber: "201", building: "CS Block" },
    { roomNumber: "202", building: "CS Block" },
    { roomNumber: "203", building: "Lab Block" },
  ];

  const roomIds = new Map<string, string>();

  for (const seed of roomSeeds) {
    const room = await prisma.room.upsert({
      where: {
        departmentId_roomNumber: {
          departmentId: department.id,
          roomNumber: seed.roomNumber,
        },
      },
      update: { building: seed.building },
      create: {
        roomNumber: seed.roomNumber,
        building: seed.building,
        departmentId: department.id,
      },
    });

    roomIds.set(room.roomNumber, room.id);
  }

  const batchIds = new Map<string, string>([
    [`${batch.name}-${batch.section}`, batch.id],
    [`${secondBatch.name}-${secondBatch.section}`, secondBatch.id],
  ]);

  const minutes = (hour: number, minute = 0) => hour * 60 + minute;

  type DemoEntry = {
    id: string;
    courseCode: string;
    teacherEmail: string;
    batchLabel: string;
    roomNumber: string;
    dayOfWeek: DayOfWeek;
    startMinute: number;
    endMinute: number;
  };

  // A conflict-free demo week: teacher, batch, and room intervals never
  // overlap. Saturday rows keep the "today" and "next class" views useful.
  const demoEntries: DemoEntry[] = [
    {
      id: "seed-entry-01",
      courseCode: "CS-301",
      teacherEmail: "imran.sheikh@university.edu",
      batchLabel: "BCS-7A",
      roomNumber: "101",
      dayOfWeek: "MONDAY",
      startMinute: minutes(9),
      endMinute: minutes(10),
    },
    {
      id: "seed-entry-02",
      courseCode: "CS-302",
      teacherEmail: "nadia.raza@university.edu",
      batchLabel: "BCS-7B",
      roomNumber: "102",
      dayOfWeek: "MONDAY",
      startMinute: minutes(9),
      endMinute: minutes(10),
    },
    {
      id: "seed-entry-03",
      courseCode: "CS-302",
      teacherEmail: "nadia.raza@university.edu",
      batchLabel: "BCS-7A",
      roomNumber: "101",
      dayOfWeek: "MONDAY",
      startMinute: minutes(10),
      endMinute: minutes(11),
    },
    {
      id: "seed-entry-04",
      courseCode: "CS-301",
      teacherEmail: "imran.sheikh@university.edu",
      batchLabel: "BCS-7B",
      roomNumber: "102",
      dayOfWeek: "MONDAY",
      startMinute: minutes(10),
      endMinute: minutes(11),
    },
    {
      id: "seed-entry-05",
      courseCode: "CS-303",
      teacherEmail: "usman.tariq@university.edu",
      batchLabel: "BCS-7A",
      roomNumber: "103",
      dayOfWeek: "MONDAY",
      startMinute: minutes(11),
      endMinute: minutes(12),
    },
    {
      id: "seed-entry-06",
      courseCode: "CS-303",
      teacherEmail: "usman.tariq@university.edu",
      batchLabel: "BCS-7B",
      roomNumber: "103",
      dayOfWeek: "TUESDAY",
      startMinute: minutes(9),
      endMinute: minutes(10),
    },
    {
      id: "seed-entry-07",
      courseCode: "CS-304",
      teacherEmail: "hira.qureshi@university.edu",
      batchLabel: "BCS-7A",
      roomNumber: "201",
      dayOfWeek: "TUESDAY",
      startMinute: minutes(9),
      endMinute: minutes(10),
    },
    {
      id: "seed-entry-08",
      courseCode: "CS-304",
      teacherEmail: "hira.qureshi@university.edu",
      batchLabel: "BCS-7B",
      roomNumber: "201",
      dayOfWeek: "TUESDAY",
      startMinute: minutes(10),
      endMinute: minutes(11),
    },
    {
      id: "seed-entry-09",
      courseCode: "CS-305",
      teacherEmail: "farhan.iqbal@university.edu",
      batchLabel: "BCS-7A",
      roomNumber: "202",
      dayOfWeek: "TUESDAY",
      startMinute: minutes(11),
      endMinute: minutes(12),
    },
    {
      id: "seed-entry-10",
      courseCode: "CS-305",
      teacherEmail: "farhan.iqbal@university.edu",
      batchLabel: "BCS-7B",
      roomNumber: "202",
      dayOfWeek: "WEDNESDAY",
      startMinute: minutes(9),
      endMinute: minutes(10),
    },
    {
      id: "seed-entry-11",
      courseCode: "CS-302",
      teacherEmail: "nadia.raza@university.edu",
      batchLabel: "BCS-7A",
      roomNumber: "101",
      dayOfWeek: "WEDNESDAY",
      startMinute: minutes(10),
      endMinute: minutes(11),
    },
    {
      id: "seed-entry-12",
      courseCode: "CS-302",
      teacherEmail: "nadia.raza@university.edu",
      batchLabel: "BCS-7B",
      roomNumber: "102",
      dayOfWeek: "WEDNESDAY",
      startMinute: minutes(11),
      endMinute: minutes(12),
    },
    {
      id: "seed-entry-13",
      courseCode: "CS-303",
      teacherEmail: "usman.tariq@university.edu",
      batchLabel: "BCS-7A",
      roomNumber: "103",
      dayOfWeek: "WEDNESDAY",
      startMinute: minutes(12),
      endMinute: minutes(13),
    },
    {
      id: "seed-entry-14",
      courseCode: "CS-303",
      teacherEmail: "usman.tariq@university.edu",
      batchLabel: "BCS-7B",
      roomNumber: "103",
      dayOfWeek: "THURSDAY",
      startMinute: minutes(9),
      endMinute: minutes(10),
    },
    {
      id: "seed-entry-15",
      courseCode: "CS-301",
      teacherEmail: "imran.sheikh@university.edu",
      batchLabel: "BCS-7A",
      roomNumber: "101",
      dayOfWeek: "THURSDAY",
      startMinute: minutes(10),
      endMinute: minutes(11),
    },
    {
      id: "seed-entry-16",
      courseCode: "CS-301",
      teacherEmail: "imran.sheikh@university.edu",
      batchLabel: "BCS-7B",
      roomNumber: "102",
      dayOfWeek: "THURSDAY",
      startMinute: minutes(11),
      endMinute: minutes(12),
    },
    {
      id: "seed-entry-17",
      courseCode: "CS-304",
      teacherEmail: "hira.qureshi@university.edu",
      batchLabel: "BCS-7A",
      roomNumber: "201",
      dayOfWeek: "THURSDAY",
      startMinute: minutes(12),
      endMinute: minutes(13),
    },
    {
      id: "seed-entry-18",
      courseCode: "CS-304",
      teacherEmail: "hira.qureshi@university.edu",
      batchLabel: "BCS-7B",
      roomNumber: "201",
      dayOfWeek: "FRIDAY",
      startMinute: minutes(9),
      endMinute: minutes(10),
    },
    {
      id: "seed-entry-19",
      courseCode: "CS-305",
      teacherEmail: "farhan.iqbal@university.edu",
      batchLabel: "BCS-7A",
      roomNumber: "202",
      dayOfWeek: "FRIDAY",
      startMinute: minutes(10),
      endMinute: minutes(11),
    },
    {
      id: "seed-entry-20",
      courseCode: "CS-305",
      teacherEmail: "farhan.iqbal@university.edu",
      batchLabel: "BCS-7B",
      roomNumber: "203",
      dayOfWeek: "FRIDAY",
      startMinute: minutes(11),
      endMinute: minutes(12),
    },
    {
      id: "seed-entry-21",
      courseCode: "CS-302",
      teacherEmail: "nadia.raza@university.edu",
      batchLabel: "BCS-7A",
      roomNumber: "101",
      dayOfWeek: "SATURDAY",
      startMinute: minutes(9),
      endMinute: minutes(10),
    },
    {
      id: "seed-entry-22",
      courseCode: "CS-303",
      teacherEmail: "usman.tariq@university.edu",
      batchLabel: "BCS-7B",
      roomNumber: "103",
      dayOfWeek: "SATURDAY",
      startMinute: minutes(9),
      endMinute: minutes(10),
    },
  ];

  for (const entry of demoEntries) {
    const courseId = courseIds.get(entry.courseCode);
    const teacherId = teacherIds.get(entry.teacherEmail);
    const batchId = batchIds.get(entry.batchLabel);
    const roomId = roomIds.get(entry.roomNumber);

    if (!courseId || !teacherId || !batchId || !roomId) {
      throw new Error(`Seed entry ${entry.id} references missing data.`);
    }

    await prisma.timetableEntry.upsert({
      where: { id: entry.id },
      update: {
        courseId,
        teacherId,
        batchId,
        roomId,
        dayOfWeek: entry.dayOfWeek,
        startMinute: entry.startMinute,
        endMinute: entry.endMinute,
      },
      create: {
        id: entry.id,
        courseId,
        teacherId,
        batchId,
        roomId,
        dayOfWeek: entry.dayOfWeek,
        startMinute: entry.startMinute,
        endMinute: entry.endMinute,
      },
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
  console.log(
    `Batches: ${batch.name}-${batch.section}, ${secondBatch.name}-${secondBatch.section}`,
  );
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
  console.log(
    `Timetable: ${courseSeeds.length} courses, ${teacherSeeds.length} teachers, ${roomSeeds.length} rooms, ${demoEntries.length} conflict-free classes.`,
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
