import type { Metadata } from "next";

import { StudentCatalogue } from "@/components/scholarships/student-catalogue";
import { StaffScholarshipManager } from "@/components/scholarships/staff-scholarship-manager";
import { requireUser } from "@/lib/auth/dal";
import {
  getScholarshipCategories,
  getStaffScholarships,
  getStaffScholarshipStats,
  getStudentCatalogue,
  getStudentScholarshipStats,
  type StaffScholarshipFilters,
  type StudentCatalogueFilters,
} from "@/lib/scholarships/queries";
import {
  staffScholarshipFilterSchema,
  studentCatalogueFilterSchema,
} from "@/lib/validation/scholarship";

export const metadata: Metadata = {
  title: "Scholarships",
};

export const instant = false;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const studentStatusMessages: Record<string, string> = {
  saved: "Scholarship saved. You can find it under Saved.",
  removed: "Bookmark removed from your saved list.",
};

const studentErrorMessages: Record<string, string> = {
  "save-unavailable":
    "That scholarship is no longer open, so it cannot be newly saved. Expired records remain readable.",
  missing: "That scholarship no longer exists.",
  invalid: "The request was not valid. Please try again.",
  "update-failed": "Your saved list could not be updated. Please try again.",
};

const staffStatusMessages: Record<string, string> = {
  created: "Draft created. Review the details and publish when ready.",
  updated: "Scholarship details saved. The last-updated time is new.",
  published: "Scholarship published. Active students can now see it.",
  archived: "Scholarship archived and hidden from student listings.",
  expired: "Scholarship marked expired. Students who saved it were notified.",
  deleted: "Scholarship deleted together with its bookmarks.",
  unchanged: "No status change was needed.",
};

const staffErrorMessages: Record<string, string> = {
  missing: "That scholarship no longer exists.",
  invalid: "The request was not valid. Please try again.",
  "deadline-passed":
    "The deadline has passed. Update the deadline before publishing.",
  "update-failed": "The change could not be saved. Please try again.",
};

export default async function ScholarshipsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const raw = await searchParams;
  const notice = first(raw.notice);
  const problem = first(raw.problem);

  if (user.role === "STUDENT") {
    const parsed = studentCatalogueFilterSchema.parse({
      q: first(raw.q),
      category: first(raw.category),
      deadline: first(raw.deadline),
      view: first(raw.view),
    });

    const filters: StudentCatalogueFilters = {
      q: parsed.q,
      category: parsed.category,
      deadline: parsed.deadline ?? (parsed.view === "saved" ? "all" : "active"),
      view: parsed.view,
    };

    const [scholarships, stats, categories] = await Promise.all([
      getStudentCatalogue(user.id, filters),
      getStudentScholarshipStats(user.id),
      getScholarshipCategories(user.role),
    ]);

    return (
      <StudentCatalogue
        scholarships={scholarships}
        stats={stats}
        filters={filters}
        categories={categories}
        statusMessage={notice ? studentStatusMessages[notice] : undefined}
        errorMessage={problem ? studentErrorMessages[problem] : undefined}
      />
    );
  }

  const parsed = staffScholarshipFilterSchema.parse({
    q: first(raw.q),
    category: first(raw.category),
    status: first(raw.status),
  });

  const filters: StaffScholarshipFilters = {
    q: parsed.q,
    category: parsed.category,
    status: parsed.status,
  };

  const [scholarships, stats, categories] = await Promise.all([
    getStaffScholarships(filters),
    getStaffScholarshipStats(),
    getScholarshipCategories(user.role),
  ]);

  return (
    <StaffScholarshipManager
      scholarships={scholarships}
      stats={stats}
      filters={filters}
      categories={categories}
      statusMessage={notice ? staffStatusMessages[notice] : undefined}
      errorMessage={problem ? staffErrorMessages[problem] : undefined}
    />
  );
}
