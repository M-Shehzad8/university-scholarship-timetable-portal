import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ScholarshipForm } from "@/components/scholarships/scholarship-form";
import { requireStaffOrCoordinator } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "New scholarship",
};

export const instant = false;

export default async function NewScholarshipPage() {
  await requireStaffOrCoordinator();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Scholarship management"
        title="Create a scholarship draft"
        description="Enter verified information from the official provider. The record stays hidden from students until you publish it from the record page."
        actions={<Badge tone="info">Draft</Badge>}
      />

      <Alert title="Only enter information from an official source.">
        The portal stores the official application URL and never submits an
        application on a student&apos;s behalf. Use the provider&apos;s own
        process for applications.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Scholarship details</CardTitle>
        </CardHeader>
        <CardContent>
          <ScholarshipForm
            mode="create"
            cancelHref="/scholarships"
            values={{
              title: "",
              provider: "",
              category: "",
              description: "",
              eligibility: "",
              benefits: "",
              requiredDocuments: "",
              deadline: "",
              applicationUrl: "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
