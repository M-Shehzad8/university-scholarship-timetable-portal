"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button, buttonStyles } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ReferenceFormState } from "@/lib/timetable/actions";

export type ReferenceFormField = {
  name: string;
  label: string;
  defaultValue: string;
  type?: "text" | "email";
  placeholder?: string;
  hint?: string;
  maxLength?: number;
  required?: boolean;
  className?: string;
};

export function ReferenceForm({
  action,
  mode,
  entityLabel,
  fields,
  idField,
  idValue,
  cancelHref,
}: {
  action: (
    state: ReferenceFormState,
    formData: FormData,
  ) => Promise<ReferenceFormState>;
  mode: "create" | "edit";
  entityLabel: string;
  fields: ReferenceFormField[];
  idField?: string;
  idValue?: string;
  cancelHref?: string;
}) {
  const [state, formAction, pending] = useActionState<
    ReferenceFormState,
    FormData
  >(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {idField && idValue ? (
        <input type="hidden" name={idField} value={idValue} />
      ) : null}

      {state?.error ? (
        <Alert tone="error" title={`Could not save the ${entityLabel}`}>
          {state.error}
        </Alert>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => {
          const error = state?.fieldErrors?.[field.name];

          return (
            <Field
              key={field.name}
              label={field.label}
              htmlFor={`reference-${field.name}`}
              hint={field.hint}
              error={error}
              className={field.className}
            >
              <Input
                id={`reference-${field.name}`}
                name={field.name}
                type={field.type ?? "text"}
                defaultValue={field.defaultValue}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                required={field.required ?? true}
                aria-invalid={error ? true : undefined}
              />
            </Field>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : `Add ${entityLabel}`}
        </Button>
        {cancelHref ? (
          <Link
            href={cancelHref}
            className={buttonStyles({ variant: "secondary", size: "md" })}
          >
            Cancel
          </Link>
        ) : null}
      </div>
    </form>
  );
}
