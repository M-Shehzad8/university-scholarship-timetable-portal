"use client";

import { useEffect } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
      <div className="w-full max-w-xl space-y-4">
        <Alert tone="error" title="The portal could not be loaded">
          An unexpected error interrupted the request. Check the server and
          database, then try again.
        </Alert>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
