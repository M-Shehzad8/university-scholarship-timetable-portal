"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createUserAction } from "@/lib/auth/user-actions";
import type { CreateUserState } from "@/lib/auth/types";
import type { Role } from "@/lib/generated/prisma/enums";

type ReferenceOption = {
  id: string;
  label: string;
};

export function CreateUserForm({
  departments,
  batches,
}: {
  departments: ReferenceOption[];
  batches: ReferenceOption[];
}) {
  const [state, formAction, pending] = useActionState<
    CreateUserState,
    FormData
  >(createUserAction, undefined);
  const [role, setRole] = useState<Role>("STUDENT");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {state?.error ? (
        <Alert tone="error" title="Could not create the account">
          {state.error}
        </Alert>
      ) : null}

      {state?.success ? (
        <Alert tone="success" title="Account created">
          {state.success}
        </Alert>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Full name"
          htmlFor="name"
          error={state?.fieldErrors?.name}
        >
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            aria-invalid={state?.fieldErrors?.name ? true : undefined}
          />
        </Field>

        <Field
          label="Email address"
          htmlFor="email"
          error={state?.fieldErrors?.email}
        >
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            aria-invalid={state?.fieldErrors?.email ? true : undefined}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Temporary password"
          htmlFor="password"
          hint="At least 12 characters, including a letter and a number."
          error={state?.fieldErrors?.password}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={state?.fieldErrors?.password ? true : undefined}
          />
        </Field>

        <Field label="Role" htmlFor="role" error={state?.fieldErrors?.role}>
          <Select
            id="role"
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
            required
            aria-invalid={state?.fieldErrors?.role ? true : undefined}
          >
            <option value="STUDENT">Student</option>
            <option value="STAFF">Staff</option>
            <option value="COORDINATOR">Coordinator</option>
          </Select>
        </Field>
      </div>

      {role === "STUDENT" ? (
        <Field
          label="Batch"
          htmlFor="batchId"
          hint={
            batches.length === 0
              ? "No batches exist yet. Run npm run db:seed for demo data."
              : "Optional. A student account may be linked to one batch."
          }
          error={state?.fieldErrors?.batchId}
        >
          <Select
            id="batchId"
            name="batchId"
            defaultValue=""
            disabled={batches.length === 0}
            aria-invalid={state?.fieldErrors?.batchId ? true : undefined}
          >
            <option value="">No batch assigned</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.label}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <Field
          label="Department"
          htmlFor="departmentId"
          hint={
            departments.length === 0
              ? "No departments exist yet. Run npm run db:seed for demo data."
              : "Optional. Staff and coordinator accounts may be linked to one department."
          }
          error={state?.fieldErrors?.departmentId}
        >
          <Select
            id="departmentId"
            name="departmentId"
            defaultValue=""
            disabled={departments.length === 0}
            aria-invalid={state?.fieldErrors?.departmentId ? true : undefined}
          >
            <option value="">No department assigned</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.label}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
