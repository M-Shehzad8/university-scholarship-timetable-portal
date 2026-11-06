import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ScholarshipForm } from "@/components/scholarships/scholarship-form";
import { ScholarshipStatusBadge } from "@/components/scholarships/scholarship-status-badge";
import { requireStaffOrCoordinator } from "@/lib/auth/dal";
import { getScholarshipForEdit } from "@/lib/scholarships/queries";
import {
  deriveEffectiveState,
  formatDateTime,
  toDateInputValue,
} from "@/lib/scholarships/rules";

export const metadata: Metadata = {
  title: "Edit scholarship",
};

export const instant = false;

export default async function EditScholarshipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaffOrCoordinator();
  const { id } = await params;
  const scholarship = await getScholarshipForEdit(id);

  if (!scholarship) {
    notFound();
  }

  const state = deriveEffectiveState(scholarship.status, scholarship.deadline);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Scholarship management"
        title={scholarship.title}
        description={`Editing the record last updated ${formatDateTime(
          scholarship.updatedAt,
        )}. Saving fields does not change its status.`}
        actions={<ScholarshipStatusBadge state={state} />}
      />

      <Alert tone="info" title="Publishing is a separate decision.">
        A draft stays hidden until you publish it. A published record remains
        visible while its deadline has not passed, even after you edit its
        fields.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Scholarship details</CardTitle>
        </CardHeader>
        <CardContent>
          <ScholarshipForm
            mode="edit"
            cancelHref={`/scholarships/${scholarship.id}`}
            values={{
              id: scholarship.id,
              title: scholarship.title,
              provider: scholarship.provider,
              category: scholarship.category ?? "",
              description: scholarship.description,
              eligibility: scholarship.eligibility,
              benefits: scholarship.benefits,
              requiredDocuments: scholarship.requiredDocuments,
              deadline: toDateInputValue(scholarship.deadline),
              applicationUrl: scholarship.applicationUrl,
              status: scholarship.status,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
