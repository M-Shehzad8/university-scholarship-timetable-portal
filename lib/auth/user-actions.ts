"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ZodError } from "zod";

import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  createUserSchema,
  setUserActiveSchema,
  updateUserRoleSchema,
} from "@/lib/validation/auth";

import { requireCoordinator } from "./dal";
import { hashPassword } from "./password";
import type { CreateUserState, UserField } from "./types";

const USER_FIELDS: UserField[] = [
  "name",
  "email",
  "password",
  "role",
  "batchId",
  "departmentId",
];

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getFieldErrors(error: ZodError): Partial<Record<UserField, string>> {
  const flattened = error.flatten().fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const fieldErrors: Partial<Record<UserField, string>> = {};

  for (const field of USER_FIELDS) {
    const message = flattened[field]?.[0];

    if (message) {
      fieldErrors[field] = message;
    }
  }

  return fieldErrors;
}

export async function createUserAction(
  _previousState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  await requireCoordinator();

  const parsed = createUserSchema.safeParse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
    role: formValue(formData, "role"),
    batchId: formValue(formData, "batchId"),
    departmentId: formValue(formData, "departmentId"),
  });

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: getFieldErrors(parsed.error),
    };
  }

  const { name, email, password, role } = parsed.data;
  const batchId =
    role === "STUDENT" && parsed.data.batchId ? parsed.data.batchId : null;
  const departmentId =
    role !== "STUDENT" && parsed.data.departmentId
      ? parsed.data.departmentId
      : null;

  if (batchId) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true },
    });

    if (!batch) {
      return {
        error: "The selected batch no longer exists.",
        fieldErrors: { batchId: "Choose an existing batch." },
      };
    }
  }

  if (departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    });

    if (!department) {
      return {
        error: "The selected department no longer exists.",
        fieldErrors: { departmentId: "Choose an existing department." },
      };
    }
  }

  try {
    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        batchId,
        departmentId,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: "An account with that email already exists.",
        fieldErrors: { email: "Use a different email address." },
      };
    }

    console.error("User creation failed", error);
    return {
      error: "The account could not be created. Please try again.",
    };
  }

  revalidatePath("/users");

  return {
    success: `${name}'s account was created.`,
  };
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const coordinator = await requireCoordinator();

  const parsed = updateUserRoleSchema.safeParse({
    userId: formValue(formData, "userId"),
    role: formValue(formData, "role"),
  });

  if (!parsed.success) {
    redirect("/users?error=invalid-role");
  }

  const { userId, role } = parsed.data;

  if (userId === coordinator.id && role !== "COORDINATOR") {
    redirect("/users?error=self-role");
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!target) {
    redirect("/users?error=missing-user");
  }

  if (
    target.role === "COORDINATOR" &&
    target.isActive &&
    role !== "COORDINATOR"
  ) {
    const activeCoordinators = await prisma.user.count({
      where: {
        role: "COORDINATOR",
        isActive: true,
      },
    });

    if (activeCoordinators <= 1) {
      redirect("/users?error=last-coordinator");
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  } catch (error) {
    console.error("User role update failed", error);
    redirect("/users?error=update-failed");
  }

  revalidatePath("/users");
  redirect("/users?status=role-updated");
}

export async function setUserActiveAction(formData: FormData): Promise<void> {
  const coordinator = await requireCoordinator();

  const parsed = setUserActiveSchema.safeParse({
    userId: formValue(formData, "userId"),
    isActive: formValue(formData, "isActive"),
  });

  if (!parsed.success) {
    redirect("/users?error=invalid-state");
  }

  const { userId } = parsed.data;
  const isActive = parsed.data.isActive === "true";

  if (userId === coordinator.id && !isActive) {
    redirect("/users?error=self-deactivate");
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!target) {
    redirect("/users?error=missing-user");
  }

  if (!isActive && target.role === "COORDINATOR" && target.isActive) {
    const activeCoordinators = await prisma.user.count({
      where: {
        role: "COORDINATOR",
        isActive: true,
      },
    });

    if (activeCoordinators <= 1) {
      redirect("/users?error=last-coordinator");
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    if (!isActive) {
      // Deactivation signs the account out everywhere.
      await prisma.session.deleteMany({
        where: { userId },
      });
    }
  } catch (error) {
    console.error("User activation update failed", error);
    redirect("/users?error=update-failed");
  }

  revalidatePath("/users");
  redirect(`/users?status=${isActive ? "activated" : "deactivated"}`);
}
