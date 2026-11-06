"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validation/auth";

import { verifyPasswordOrDummy } from "./password";
import { createSession, revokeCurrentSession } from "./session";
import type { LoginState } from "./types";

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const rawEmail =
    typeof formData.get("email") === "string"
      ? (formData.get("email") as string)
      : "";

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "Enter a valid email address and password.",
      email: rawEmail.trim(),
    };
  }

  const { email, password } = parsed.data;

  let user: {
    id: string;
    isActive: boolean;
    passwordHash: string;
  } | null;

  try {
    user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        isActive: true,
        passwordHash: true,
      },
    });
  } catch (error) {
    console.error("Login user lookup failed", error);
    return {
      error: "Sign-in is temporarily unavailable. Please try again.",
      email,
    };
  }

  const passwordMatches = await verifyPasswordOrDummy(
    password,
    user?.passwordHash ?? null,
  );

  if (!user || !passwordMatches) {
    return {
      error: "Invalid email or password.",
      email,
    };
  }

  if (!user.isActive) {
    return {
      error: "This account has been deactivated. Contact your coordinator.",
      email,
    };
  }

  try {
    await revokeCurrentSession();
    await createSession(user.id);
  } catch (error) {
    console.error("Login session creation failed", error);
    return {
      error: "Sign-in is temporarily unavailable. Please try again.",
      email,
    };
  }

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await revokeCurrentSession();
  redirect("/login");
}
