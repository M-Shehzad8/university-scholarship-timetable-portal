"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { buttonStyles, Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createScholarshipAction,
  updateScholarshipAction,
  type ScholarshipFormState,
} from "@/lib/scholarships/actions";
import type { ScholarshipStatusValue } from "@/lib/scholarships/rules";
import type { ScholarshipFormField } from "@/lib/validation/scholarship";

export type ScholarshipFormValues = {
  id?: string;
  title: string;
  provider: string;
  category: string;
  description: string;
  eligibility: string;
  benefits: string;
  requiredDocuments: string;
  deadline: string;
  applicationUrl: string;
  status?: ScholarshipStatusValue;
};

export function ScholarshipForm({
  mode,
  values,
  cancelHref,
}: {
  mode: "create" | "edit";
  values: ScholarshipFormValues;
  cancelHref: string;
}) {
  const action =
    mode === "edit" ? updateScholarshipAction : createScholarshipAction;
  const [state, formAction, pending] = useActionState<
    ScholarshipFormState,
    FormData
  >(action, undefined);

  const fieldError = (field: ScholarshipFormField) =>
    state?.fieldErrors?.[field];

  return (
    <form action={formAction} className="space-y-6">
      {values.id ? (
        <input type="hidden" name="scholarshipId" value={values.id} />
      ) : null}

      {state?.error ? (
        <Alert tone="error" title="Could not save the scholarship">
          {state.error}
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Field
          label="Title"
          htmlFor="title"
          error={fieldError("title")}
          className="lg:col-span-2"
        >
          <Input
            id="title"
            name="title"
            defaultValue={values.title}
            maxLength={160}
            required
            aria-invalid={fieldError("title") ? true : undefined}
            placeholder="e.g. HEC Need-Based Scholarship 2026"
          />
        </Field>

        <Field
          label="Provider"
          htmlFor="provider"
          error={fieldError("provider")}
        >
          <Input
            id="provider"
            name="provider"
            defaultValue={values.provider}
            maxLength={120}
            required
            aria-invalid={fieldError("provider") ? true : undefined}
            placeholder="e.g. Higher Education Commission"
          />
        </Field>

        <Field
          label="Category"
          htmlFor="category"
          hint="Optional. Used by the student category filter."
          error={fieldError("category")}
        >
          <Input
            id="category"
            name="category"
            defaultValue={values.category}
            maxLength={60}
            aria-invalid={fieldError("category") ? true : undefined}
            placeholder="e.g. Merit"
          />
        </Field>

        <Field
          label="Deadline"
          htmlFor="deadline"
          hint="A calendar date, inclusive through the end of that day. Publishing requires today or later."
          error={fieldError("deadline")}
        >
          <Input
            id="deadline"
            name="deadline"
            type="date"
            defaultValue={values.deadline}
            required
            aria-invalid={fieldError("deadline") ? true : undefined}
          />
        </Field>

        <Field
          label="Official application URL"
          htmlFor="applicationUrl"
          hint="Full http:// or https:// address. The portal never submits applications."
          error={fieldError("applicationUrl")}
          className="lg:col-span-2"
        >
          <Input
            id="applicationUrl"
            name="applicationUrl"
            type="url"
            defaultValue={values.applicationUrl}
            maxLength={2048}
            required
            aria-invalid={fieldError("applicationUrl") ? true : undefined}
            placeholder="https://"
          />
        </Field>

        <Field
          label="Description"
          htmlFor="description"
          error={fieldError("description")}
          className="lg:col-span-2"
        >
          <Textarea
            id="description"
            name="description"
            defaultValue={values.description}
            maxLength={5000}
            required
            aria-invalid={fieldError("description") ? true : undefined}
            placeholder="What the scholarship is for and who provides it."
          />
        </Field>

        <Field
          label="Eligibility"
          htmlFor="eligibility"
          error={fieldError("eligibility")}
        >
          <Textarea
            id="eligibility"
            name="eligibility"
            defaultValue={values.eligibility}
            maxLength={3000}
            required
            aria-invalid={fieldError("eligibility") ? true : undefined}
            placeholder="Degree level, programme, minimum marks, and other conditions."
          />
        </Field>

        <Field
          label="Benefits"
          htmlFor="benefits"
          error={fieldError("benefits")}
        >
          <Textarea
            id="benefits"
            name="benefits"
            defaultValue={values.benefits}
            maxLength={3000}
            required
            aria-invalid={fieldError("benefits") ? true : undefined}
            placeholder="Tuition coverage, stipend, or other support."
          />
        </Field>

        <Field
          label="Required documents"
          htmlFor="requiredDocuments"
          hint="Put each document on a new line for a readable list."
          error={fieldError("requiredDocuments")}
          className="lg:col-span-2"
        >
          <Textarea
            id="requiredDocuments"
            name="requiredDocuments"
            defaultValue={values.requiredDocuments}
            maxLength={3000}
            required
            aria-invalid={fieldError("requiredDocuments") ? true : undefined}
            placeholder={"CNIC copy\nLast transcript\nIncome certificate"}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Create draft"}
        </Button>
        <Link
          href={cancelHref}
          className={buttonStyles({ variant: "secondary", size: "md" })}
        >
          Cancel
        </Link>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {mode === "edit"
            ? "Saving fields does not change the current status."
            : "New records start as drafts. Publish from the record page when the information is ready."}
        </p>
      </div>
    </form>
  );
}
