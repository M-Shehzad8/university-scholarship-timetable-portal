import { z } from "zod";

export const notificationViewSchema = z.enum(["all", "unread"]);

export const notificationFilterSchema = z.object({
  view: notificationViewSchema.optional().default("all"),
});

export const notificationIdSchema = z.object({
  notificationId: z
    .string()
    .trim()
    .min(1, "Choose a notification.")
    .max(100, "The selected notification is not valid."),
});
