export type TimetableFilters = {
  batchId: string;
  teacherId: string;
  day: string;
};

export function buildTimetableHref(filters: TimetableFilters): string {
  const params = new URLSearchParams();

  if (filters.batchId) {
    params.set("batch", filters.batchId);
  }

  if (filters.teacherId) {
    params.set("teacher", filters.teacherId);
  }

  if (filters.day) {
    params.set("day", filters.day);
  }

  const query = params.toString();
  return query ? `/timetable?${query}` : "/timetable";
}

export function buildNewEntryHref(returnTo: string, today: string): string {
  const params = new URLSearchParams({ returnTo });

  if (today) {
    params.set("day", today);
  }

  return `/timetable/new?${params.toString()}`;
}
