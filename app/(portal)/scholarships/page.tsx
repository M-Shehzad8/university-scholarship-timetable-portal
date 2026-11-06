import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Scholarships",
};

export const instant = false;

const studentFeatures = [
  "Search active opportunities by title, provider, or keyword",
  "Filter by category and review eligibility, benefits, and required documents",
  "Open the official application link and save opportunities for later",
  "See clear active, closing-soon, and expired states",
];

const staffFeatures = [
  "Create and edit scholarship records from official announcements",
  "Publish, archive, or expire a record with a visible last-updated date",
  "Maintain deadline, eligibility, benefits, documents, and application URL",
  "Remove records while keeping saved-bookmark references consistent",
];

export default async function ScholarshipsPage() {
  await requireUser();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Academic module"
        title="Scholarships"
        description="A maintained catalogue of opportunities. Students search and save records; authorised staff keep every field accurate and current."
        actions={<Badge tone="info">Phase 3 implementation</Badge>}
      />

      <Alert title="The catalogue is intentionally empty until Phase 3.">
        The database model and screen structure are ready. Scholarship records,
        search, filters, bookmarks, and staff maintenance are implemented in
        Phase 3 so this foundation does not claim features that do not work yet.
      </Alert>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Student experience</CardTitle>
              <Badge tone="success">Read and save</Badge>
            </div>
            <CardDescription>
              Students only see information that is safe and useful to act on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {studentFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex gap-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600"
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Staff maintenance</CardTitle>
              <Badge tone="warning">Staff and coordinator</Badge>
            </div>
            <CardDescription>
              Records are entered manually from selected official sources. There
              is no scraping or automatic application submission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {staffFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex gap-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record lifecycle</CardTitle>
          <CardDescription>
            An opportunity is active only when it is published and its deadline
            has not passed. Expired records remain readable for reference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Badge>Draft</Badge>
            <span aria-hidden="true">→</span>
            <Badge tone="success">Published</Badge>
            <span aria-hidden="true">→</span>
            <Badge tone="warning">Expired by date</Badge>
            <span className="px-2 text-zinc-400 dark:text-zinc-600">or</span>
            <Badge tone="danger">Archived / expired</Badge>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Draft records are hidden from students. Archived records are hidden
            from default listings. A published record whose deadline passes is
            excluded from active results without deleting history.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue preview</CardTitle>
          <CardDescription>
            The final listing uses the same table and empty-state patterns shown
            here. No sample scholarship data is stored yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <tr>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState
                    title="No scholarships available yet"
                    description="Once staff publish the first records, active opportunities will appear here with their deadline and official application link."
                    className="py-10"
                  />
                </TableCell>
              </tr>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
