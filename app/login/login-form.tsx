"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth/actions";
import type { LoginState } from "@/lib/auth/types";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state?.error ? (
        <Alert tone="error" title="Could not sign in">
          {state.error}
        </Alert>
      ) : null}

      <Field label="Email address" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state?.email ?? ""}
          aria-invalid={state?.error ? true : undefined}
          placeholder="you@university.edu"
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state?.error ? true : undefined}
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        Sessions are stored in an HTTP-only cookie. Signing out revokes the
        session on the server.
      </p>
    </form>
  );
}
