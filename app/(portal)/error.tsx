"use client";

import { useEffect } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function PortalError({
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
    <div className="mx-auto max-w-xl space-y-4 py-10">
      <Alert tone="error" title="This page could not be loaded">
        Portal data could not be read. Check that the database is running and
        try again. If the problem continues, contact your coordinator.
      </Alert>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
