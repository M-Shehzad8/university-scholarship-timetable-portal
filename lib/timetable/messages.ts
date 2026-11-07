export const referenceNoticeMessages: Record<string, string> = {
  created: "Record added. It is available immediately.",
  updated: "Record updated. The change applies to future timetable views.",
  deleted: "Record deleted.",
};

export const referenceProblemMessages: Record<string, string> = {
  missing: "That record no longer exists.",
  "in-use":
    "That record is used by a timetable class. Remove or reassign the class first.",
  invalid: "The request was not valid. Reload the page and try again.",
  "delete-failed": "The record could not be deleted. Please try again.",
  "no-department":
    "Your account is not linked to a department, so reference data cannot be maintained.",
};

export const entryNoticeMessages: Record<string, string> = {
  created: "Class added to the timetable.",
  updated: "Class updated. Conflict checks ran again before saving.",
  deleted: "Class removed from the timetable.",
};

export const entryProblemMessages: Record<string, string> = {
  missing: "That class no longer exists.",
  invalid: "The request was not valid. Reload the timetable and try again.",
  "delete-failed": "The class could not be deleted. Please try again.",
  "no-department":
    "Your account is not linked to a department, so the timetable cannot be maintained.",
};
