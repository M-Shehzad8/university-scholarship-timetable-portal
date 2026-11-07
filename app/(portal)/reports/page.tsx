import type { Metadata } from "next";

import { ReportsOverview } from "@/components/reports/reports-overview";
import { NoDepartmentNotice } from "@/components/timetable/no-department-notice";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { requireStaffOrCoordinator } from "@/lib/auth/dal";
import { getReportsOverview } from "@/lib/reports/queries";
import { getPortalDayOfWeek, getPortalMinutes } from "@/lib/timetable/rules";

export const metadata: Metadata = {
  title: "Reports",
};

export const instant = false;

export default async function ReportsPage() {
  const user = await requireStaffOrCoordinator();
  const now = new Date();
  const todayDay = getPortalDayOfWeek(now);
  const nowMinutes = getPortalMinutes(now);

  if (!user.department) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Operations"
          title="Reports"
          description="Read-only scholarship and timetable summaries for staff and coordinators."
          actions={<Badge tone="warning">Read-only</Badge>}
        />
        <NoDepartmentNotice
          title="No department assigned"
          description="Reports combine scholarship activity with department timetable, room, and conflict data. Ask the coordinator to link your account to a department."
        />
      </div>
    );
  }

  const data = await getReportsOverview(
    user.department.id,
    todayDay,
    nowMinutes,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Reports"
        description="Small, practical summaries built from live scholarship and timetable data. Reports support oversight without turning the portal into an analytics platform."
        actions={<Badge tone="success">Live data</Badge>}
      />

      <ReportsOverview
        data={data}
        todayDay={todayDay}
        nowMinutes={nowMinutes}
      />
    </div>
  );
}
