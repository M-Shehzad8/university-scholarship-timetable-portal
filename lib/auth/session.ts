import { createHmac, randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import type { AuthenticatedUser } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";

export const SESSION_COOKIE_NAME = "university_session";
export const SESSION_DURATION_DAYS = 7;

const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set it to at least 32 characters in .env.local.",
    );
  }

  return secret;
}

function hashToken(token: string): string {
  return createHmac("sha256", getSessionSecret()).update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSessionUser(): Promise<AuthenticatedUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashToken(token),
    },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          batch: {
            select: {
              id: true,
              name: true,
              section: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  if (!session.user.isActive) {
    return null;
  }

  return session.user;
}

export async function revokeCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await prisma.session.deleteMany({
        where: {
          tokenHash: hashToken(token),
        },
      });
    } catch (error) {
      // The cookie must still be cleared so the browser stops sending it.
      console.error("Session revocation failed", error);
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
