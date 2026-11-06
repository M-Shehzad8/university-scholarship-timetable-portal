import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address.")
  .max(254, "Email address is too long.")
  .email("Enter a valid email address.");

export const passwordPolicySchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(72, "Use no more than 72 characters.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(200, "Password is too long."),
});

export const roleSchema = z.enum(["STUDENT", "STAFF", "COORDINATOR"], {
  error: "Choose a valid role.",
});

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter the full name.")
    .max(100, "Name is too long."),
  email: emailSchema,
  password: passwordPolicySchema,
  role: roleSchema,
  batchId: z.string().trim().max(100).optional(),
  departmentId: z.string().trim().max(100).optional(),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: roleSchema,
});

export const setUserActiveSchema = z.object({
  userId: z.string().min(1),
  isActive: z.enum(["true", "false"], {
    error: "Choose a valid account state.",
  }),
});
