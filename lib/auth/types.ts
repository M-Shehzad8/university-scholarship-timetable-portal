import type { Role } from "@/lib/generated/prisma/enums";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  batch: {
    id: string;
    name: string;
    section: string;
  } | null;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
};

export type LoginState =
  | {
      error?: string;
      email?: string;
    }
  | undefined;

export type UserField =
  "name" | "email" | "password" | "role" | "batchId" | "departmentId";

export type CreateUserState =
  | {
      error?: string;
      fieldErrors?: Partial<Record<UserField, string>>;
      success?: string;
    }
  | undefined;
