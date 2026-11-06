import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default function ScholarshipNotFound() {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <Card>
        <EmptyState
          title="Scholarship not found"
          description="This record may have been deleted, archived, or is not published. It is not available to your account."
          action={
            <Link
              href="/scholarships"
              className={buttonStyles({ variant: "secondary", size: "md" })}
            >
              Back to scholarships
            </Link>
          }
          className="py-14"
        />
      </Card>
    </div>
  );
}
