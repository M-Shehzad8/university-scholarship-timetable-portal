import { z } from "zod";

import { parseDateInput } from "@/lib/scholarships/rules";

export const SCHOLARSHIP_FORM_FIELDS = [
  "title",
  "provider",
  "category",
  "description",
  "eligibility",
  "benefits",
  "requiredDocuments",
  "deadline",
  "applicationUrl",
] as const;

export type ScholarshipFormField = (typeof SCHOLARSHIP_FORM_FIELDS)[number];

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(2, `Enter the ${label}.`)
    .max(max, `${label[0]?.toUpperCase()}${label.slice(1)} is too long.`);

export const scholarshipFormSchema = z.object({
  title: requiredText("title", 160),
  provider: requiredText("provider", 120),
  category: z
    .string()
    .trim()
    .max(60, "Category is too long.")
    .optional()
    .default(""),
  description: z
    .string()
    .trim()
    .min(20, "Write at least 20 characters.")
    .max(5000, "Description is too long."),
  eligibility: z
    .string()
    .trim()
    .min(10, "Describe who is eligible.")
    .max(3000, "Eligibility text is too long."),
  benefits: z
    .string()
    .trim()
    .min(5, "Describe the benefits.")
    .max(3000, "Benefits text is too long."),
  requiredDocuments: z
    .string()
    .trim()
    .min(5, "List the required documents.")
    .max(3000, "Required-documents text is too long."),
  deadline: z
    .string()
    .trim()
    .min(1, "Choose a deadline.")
    .refine((value) => parseDateInput(value) !== null, {
      message: "Choose a valid calendar date.",
    }),
  applicationUrl: z
    .string()
    .trim()
    .min(1, "Enter the official application URL.")
    .max(2048, "Application URL is too long.")
    .refine(
      (value) => {
        try {
          const url = new URL(value);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Use a full http:// or https:// URL." },
    ),
});

export const updateScholarshipSchema = scholarshipFormSchema.extend({
  scholarshipId: z.string().trim().min(1, "Missing scholarship record."),
});

export const scholarshipIdSchema = z
  .string()
  .trim()
  .min(1, "Missing scholarship record.")
  .max(100);

export const staffScholarshipFilterSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  category: z.string().trim().max(60).catch(""),
  status: z
    .enum(["all", "draft", "active", "expired", "archived"])
    .catch("all"),
});

export const studentCatalogueFilterSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  category: z.string().trim().max(60).catch(""),
  deadline: z
    .enum(["active", "soon", "expired", "all"])
    .optional()
    .catch(undefined),
  view: z.enum(["all", "saved"]).catch("all"),
});

export const bookmarkSchema = z.object({
  scholarshipId: scholarshipIdSchema,
  intent: z.enum(["save", "remove"], {
    error: "Choose a bookmark action.",
  }),
  returnTo: z.string().max(500).optional().default(""),
});

export const scholarshipStatusActionSchema = z.object({
  scholarshipId: scholarshipIdSchema,
  returnTo: z.string().max(500).optional().default(""),
});

/**
 * Only same-origin scholarship paths are accepted as return targets. This
 * prevents the action's `returnTo` field from becoming an open redirect.
 */
export function sanitizeScholarshipReturnPath(value: string | null): string {
  const fallback = "/scholarships";

  if (!value) {
    return fallback;
  }

  try {
    const url = new URL(value, "http://portal.local");

    if (url.origin !== "http://portal.local") {
      return fallback;
    }

    if (
      url.pathname !== "/scholarships" &&
      !url.pathname.startsWith("/scholarships/")
    ) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
