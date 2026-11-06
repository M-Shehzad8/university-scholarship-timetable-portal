"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ZodError } from "zod";

import { requireRole, requireStaffOrCoordinator } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import {
  bookmarkSchema,
  sanitizeScholarshipReturnPath,
  scholarshipFormSchema,
  scholarshipStatusActionSchema,
  updateScholarshipSchema,
  SCHOLARSHIP_FORM_FIELDS,
  type ScholarshipFormField,
} from "@/lib/validation/scholarship";

import {
  deriveEffectiveState,
  formatDateOnly,
  isActiveState,
  isDeadlinePassed,
  parseDateInput,
  type ScholarshipStatusValue,
} from "./rules";
import {
  getActiveStudentIds,
  getSavedStudentIds,
  getScholarshipForAction,
} from "./queries";

export type ScholarshipFormState =
  | {
      error?: string;
      fieldErrors?: Partial<Record<ScholarshipFormField, string>>;
    }
  | undefined;

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getFieldErrors(
  error: ZodError,
): Partial<Record<ScholarshipFormField, string>> {
  const flattened = error.flatten().fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const fieldErrors: Partial<Record<ScholarshipFormField, string>> = {};

  for (const field of SCHOLARSHIP_FORM_FIELDS) {
    const message = flattened[field]?.[0];

    if (message) {
      fieldErrors[field] = message;
    }
  }

  return fieldErrors;
}

function readFormValues(formData: FormData) {
  return {
    title: formValue(formData, "title"),
    provider: formValue(formData, "provider"),
    category: formValue(formData, "category"),
    description: formValue(formData, "description"),
    eligibility: formValue(formData, "eligibility"),
    benefits: formValue(formData, "benefits"),
    requiredDocuments: formValue(formData, "requiredDocuments"),
    deadline: formValue(formData, "deadline"),
    applicationUrl: formValue(formData, "applicationUrl"),
  };
}

function toWriteData(values: {
  title: string;
  provider: string;
  category?: string;
  description: string;
  eligibility: string;
  benefits: string;
  requiredDocuments: string;
  deadline: string;
  applicationUrl: string;
}) {
  const deadline = parseDateInput(values.deadline);

  if (!deadline) {
    throw new Error("A validated scholarship form produced an invalid date.");
  }

  return {
    title: values.title,
    provider: values.provider,
    category: values.category?.trim() || null,
    description: values.description,
    eligibility: values.eligibility,
    benefits: values.benefits,
    requiredDocuments: values.requiredDocuments,
    deadline,
    applicationUrl: values.applicationUrl,
  };
}

function withFlashMessage(
  path: string,
  key: "status" | "error",
  value: string,
): string {
  const url = new URL(path, "http://portal.local");
  // `notice`/`problem` avoid colliding with the staff list's `status` filter.
  url.searchParams.set(key === "status" ? "notice" : "problem", value);
  return `${url.pathname}${url.search}${url.hash}`;
}

function revalidateScholarshipSurfaces(id?: string) {
  revalidatePath("/scholarships");
  revalidatePath("/dashboard");

  if (id) {
    revalidatePath(`/scholarships/${id}`);
  }
}

function statusActionTarget(formData: FormData) {
  const parsed = scholarshipStatusActionSchema.safeParse({
    scholarshipId: formValue(formData, "scholarshipId"),
    returnTo: formValue(formData, "returnTo"),
  });

  if (!parsed.success) {
    return {
      scholarshipId: null,
      returnPath: "/scholarships",
    } as const;
  }

  return {
    scholarshipId: parsed.data.scholarshipId,
    returnPath: sanitizeScholarshipReturnPath(parsed.data.returnTo),
  } as const;
}

async function notifyStudentsOfPublication(record: {
  title: string;
  provider: string;
  deadline: Date;
}) {
  const studentIds = await getActiveStudentIds();

  if (studentIds.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: studentIds.map((userId) => ({
      userId,
      type: "SCHOLARSHIP_PUBLISHED",
      title: `New scholarship: ${record.title}`,
      message: `${record.provider} is accepting applications until ${formatDateOnly(
        record.deadline,
      )}.`,
    })),
  });
}

async function notifySaversOfExpiry(record: { id: string; title: string }) {
  const studentIds = await getSavedStudentIds(record.id);

  if (studentIds.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: studentIds.map((userId) => ({
      userId,
      type: "SCHOLARSHIP_EXPIRED",
      title: `Scholarship expired: ${record.title}`,
      message:
        "This saved opportunity is no longer open. It remains available as a read-only reference.",
    })),
  });
}

export async function createScholarshipAction(
  _previousState: ScholarshipFormState,
  formData: FormData,
): Promise<ScholarshipFormState> {
  await requireStaffOrCoordinator();

  const parsed = scholarshipFormSchema.safeParse(readFormValues(formData));

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: getFieldErrors(parsed.error),
    };
  }

  let createdId: string;

  try {
    const created = await prisma.scholarship.create({
      data: {
        ...toWriteData(parsed.data),
        status: "DRAFT",
      },
      select: { id: true },
    });

    createdId = created.id;
  } catch (error) {
    console.error("Scholarship creation failed", error);
    return {
      error: "The scholarship could not be saved. Please try again.",
    };
  }

  revalidateScholarshipSurfaces(createdId);
  redirect(`/scholarships/${createdId}?notice=created`);
}

export async function updateScholarshipAction(
  _previousState: ScholarshipFormState,
  formData: FormData,
): Promise<ScholarshipFormState> {
  await requireStaffOrCoordinator();

  const parsed = updateScholarshipSchema.safeParse({
    ...readFormValues(formData),
    scholarshipId: formValue(formData, "scholarshipId"),
  });

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: getFieldErrors(parsed.error),
    };
  }

  const { scholarshipId } = parsed.data;
  const existing = await prisma.scholarship.findUnique({
    where: { id: scholarshipId },
    select: { id: true },
  });

  if (!existing) {
    redirect("/scholarships?error=missing");
  }

  try {
    await prisma.scholarship.update({
      where: { id: scholarshipId },
      data: toWriteData(parsed.data),
    });
  } catch (error) {
    console.error("Scholarship update failed", error);
    return {
      error: "The changes could not be saved. Please try again.",
    };
  }

  revalidateScholarshipSurfaces(scholarshipId);
  redirect(`/scholarships/${scholarshipId}?notice=updated`);
}

export async function publishScholarshipAction(
  formData: FormData,
): Promise<void> {
  await requireStaffOrCoordinator();
  const { scholarshipId, returnPath } = statusActionTarget(formData);

  if (!scholarshipId) {
    redirect(withFlashMessage(returnPath, "error", "invalid"));
  }

  const record = await getScholarshipForAction(scholarshipId);

  if (!record) {
    redirect(withFlashMessage(returnPath, "error", "missing"));
  }

  if (record.status === "PUBLISHED") {
    redirect(withFlashMessage(returnPath, "status", "unchanged"));
  }

  if (isDeadlinePassed(record.deadline)) {
    redirect(withFlashMessage(returnPath, "error", "deadline-passed"));
  }

  try {
    await prisma.scholarship.update({
      where: { id: scholarshipId },
      data: { status: "PUBLISHED" },
    });
  } catch (error) {
    console.error("Scholarship publication failed", error);
    redirect(withFlashMessage(returnPath, "error", "update-failed"));
  }

  try {
    await notifyStudentsOfPublication(record);
  } catch (error) {
    // Publication itself succeeded; a notification failure must not roll it
    // back. Phase 5 surfaces these notifications in the notification centre.
    console.error("Scholarship publication notification failed", error);
  }

  revalidateScholarshipSurfaces(scholarshipId);
  redirect(withFlashMessage(returnPath, "status", "published"));
}

export async function archiveScholarshipAction(
  formData: FormData,
): Promise<void> {
  await requireStaffOrCoordinator();
  const { scholarshipId, returnPath } = statusActionTarget(formData);

  if (!scholarshipId) {
    redirect(withFlashMessage(returnPath, "error", "invalid"));
  }

  const record = await getScholarshipForAction(scholarshipId);

  if (!record) {
    redirect(withFlashMessage(returnPath, "error", "missing"));
  }

  if (record.status === "ARCHIVED") {
    redirect(withFlashMessage(returnPath, "status", "unchanged"));
  }

  try {
    await prisma.scholarship.update({
      where: { id: scholarshipId },
      data: { status: "ARCHIVED" },
    });
  } catch (error) {
    console.error("Scholarship archive failed", error);
    redirect(withFlashMessage(returnPath, "error", "update-failed"));
  }

  revalidateScholarshipSurfaces(scholarshipId);
  redirect(withFlashMessage(returnPath, "status", "archived"));
}

export async function expireScholarshipAction(
  formData: FormData,
): Promise<void> {
  await requireStaffOrCoordinator();
  const { scholarshipId, returnPath } = statusActionTarget(formData);

  if (!scholarshipId) {
    redirect(withFlashMessage(returnPath, "error", "invalid"));
  }

  const record = await getScholarshipForAction(scholarshipId);

  if (!record) {
    redirect(withFlashMessage(returnPath, "error", "missing"));
  }

  if (record.status === "EXPIRED" || record.status === "ARCHIVED") {
    redirect(withFlashMessage(returnPath, "status", "unchanged"));
  }

  try {
    await prisma.scholarship.update({
      where: { id: scholarshipId },
      data: { status: "EXPIRED" },
    });
  } catch (error) {
    console.error("Scholarship expiry failed", error);
    redirect(withFlashMessage(returnPath, "error", "update-failed"));
  }

  try {
    await notifySaversOfExpiry(record);
  } catch (error) {
    console.error("Scholarship expiry notification failed", error);
  }

  revalidateScholarshipSurfaces(scholarshipId);
  redirect(withFlashMessage(returnPath, "status", "expired"));
}

export async function deleteScholarshipAction(
  formData: FormData,
): Promise<void> {
  await requireStaffOrCoordinator();
  const { scholarshipId } = statusActionTarget(formData);

  if (!scholarshipId) {
    redirect("/scholarships?problem=invalid");
  }

  let deleted = false;

  try {
    const result = await prisma.scholarship.deleteMany({
      where: { id: scholarshipId },
    });
    deleted = result.count > 0;
  } catch (error) {
    console.error("Scholarship deletion failed", error);
    redirect("/scholarships?problem=update-failed");
  }

  if (!deleted) {
    redirect("/scholarships?problem=missing");
  }

  revalidateScholarshipSurfaces(scholarshipId);
  redirect("/scholarships?notice=deleted");
}

export async function toggleBookmarkAction(formData: FormData): Promise<void> {
  const user = await requireRole(["STUDENT"]);
  const parsed = bookmarkSchema.safeParse({
    scholarshipId: formValue(formData, "scholarshipId"),
    intent: formValue(formData, "intent"),
    returnTo: formValue(formData, "returnTo"),
  });
  const returnPath = sanitizeScholarshipReturnPath(
    formValue(formData, "returnTo"),
  );

  if (!parsed.success) {
    redirect(withFlashMessage(returnPath, "error", "invalid"));
  }

  const record = await getScholarshipForAction(parsed.data.scholarshipId);

  if (!record) {
    redirect(withFlashMessage(returnPath, "error", "missing"));
  }

  if (parsed.data.intent === "remove") {
    try {
      await prisma.savedScholarship.deleteMany({
        where: {
          userId: user.id,
          scholarshipId: record.id,
        },
      });
    } catch (error) {
      console.error("Bookmark removal failed", error);
      redirect(withFlashMessage(returnPath, "error", "update-failed"));
    }

    revalidateScholarshipSurfaces(record.id);
    redirect(withFlashMessage(returnPath, "status", "removed"));
  }

  const state = deriveEffectiveState(
    record.status as ScholarshipStatusValue,
    record.deadline,
  );

  if (!isActiveState(state)) {
    redirect(withFlashMessage(returnPath, "error", "save-unavailable"));
  }

  try {
    await prisma.savedScholarship.createMany({
      data: [{ userId: user.id, scholarshipId: record.id }],
      skipDuplicates: true,
    });
  } catch (error) {
    console.error("Bookmark save failed", error);
    redirect(withFlashMessage(returnPath, "error", "update-failed"));
  }

  revalidateScholarshipSurfaces(record.id);
  redirect(withFlashMessage(returnPath, "status", "saved"));
}
