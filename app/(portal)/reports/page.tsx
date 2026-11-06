import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Reports",
};

const reports = [
  {
    title: "Active scholarships",
    description:
      "Published opportunities whose deadline has not passed, ordered by deadline.",
  },
  {
    title: "Scholarships expiring soon",
    description:
      "Published opportunities closing within the next 14 days for staff follow-up.",
  },
  {
    title: "Timetable by batch",
    description:
      "A weekly view for one batch or section, including course, teacher, and room.",
  },
  {
    title: "Timetable by teacher",
    description:
      "A weekly load view that makes overlapping assignments easy to spot.",
  },
  {
    title: "Room usage",
    description:
      "Scheduled and free room information for a selected day or time range.",
  },
  {
    title: "Conflict summary",
    description:
      "A focused list of overlapping teacher, batch, or room assignments that need attention.",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Reports"
        description="Small, practical summaries for staff and coordinators. Reports support oversight without turning the portal into an analytics platform."
        actions={<Badge tone="warning">Phase 5 implementation</Badge>}
      />

      <Alert title="Report definitions are stable; report pages are not built yet.">
        The reports below are the agreed scope. They will use live data after
        the scholarship and timetable modules are implemented. PDF export is
        optional and will be considered only if it does not destabilise the core
        system.
      </Alert>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.title}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle>{report.title}</CardTitle>
                <Badge tone="neutral">Planned</Badge>
              </div>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
