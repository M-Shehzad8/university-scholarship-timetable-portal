import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export function NoDepartmentNotice({
  title = "No department assigned",
  description = "Timetable maintenance is scoped to one department. Ask the coordinator to link your account to a department before scheduling classes.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <EmptyState
        title={title}
        description={description}
        action={
          <Link
            href="/dashboard"
            className={buttonStyles({ variant: "secondary", size: "md" })}
          >
            Back to dashboard
          </Link>
        }
        className="py-12"
      />
    </Card>
  );
}
