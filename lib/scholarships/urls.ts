import type {
  StaffScholarshipFilters,
  StudentCatalogueFilters,
} from "./queries";

export function buildStudentCatalogueHref(
  filters: StudentCatalogueFilters,
): string {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.deadline !== "active") {
    params.set("deadline", filters.deadline);
  }

  if (filters.view === "saved") {
    params.set("view", "saved");
  }

  const query = params.toString();
  return query ? `/scholarships?${query}` : "/scholarships";
}

export function buildStaffCatalogueHref(
  filters: StaffScholarshipFilters,
): string {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  const query = params.toString();
  return query ? `/scholarships?${query}` : "/scholarships";
}
