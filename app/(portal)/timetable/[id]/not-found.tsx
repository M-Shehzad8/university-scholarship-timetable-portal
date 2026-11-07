import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default function TimetableEntryNotFound() {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <Card>
        <EmptyState
          title="Class not found"
          description="This timetable row may have been deleted or belongs to another department. Return to the timetable to view the current schedule."
          action={
            <Link
              href="/timetable"
              className={buttonStyles({ variant: "secondary", size: "md" })}
            >
              Back to timetable
            </Link>
          }
          className="py-14"
        />
      </Card>
    </div>
  );
}
