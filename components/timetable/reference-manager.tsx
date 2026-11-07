import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReferenceFormState } from "@/lib/timetable/actions";

import { ReferenceForm, type ReferenceFormField } from "./reference-form";

type ReferenceAction = (
  state: ReferenceFormState,
  formData: FormData,
) => Promise<ReferenceFormState>;

export function ReferenceManager({
  tableTitle,
  tableDescription,
  columns,
  count,
  children,
  canManage,
  createAction,
  createFields,
  entityLabel,
  editPanel,
}: {
  tableTitle: string;
  tableDescription: string;
  columns: string[];
  count: number;
  children: ReactNode;
  canManage: boolean;
  createAction: ReferenceAction;
  createFields: ReferenceFormField[];
  entityLabel: string;
  editPanel?: ReactNode;
}) {
  return (
    <div
      className={
        canManage
          ? "grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]"
          : undefined
      }
    >
      <Card className="min-w-0">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{tableTitle}</CardTitle>
              <CardDescription>{tableDescription}</CardDescription>
            </div>
            <Badge tone="neutral">{count} total</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
                {canManage ? <TableHead>Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>{children}</TableBody>
          </Table>
        </CardContent>
      </Card>

      {canManage ? (
        <div className="space-y-6">
          {editPanel}
          <Card>
            <CardHeader>
              <CardTitle>Add {entityLabel}</CardTitle>
              <CardDescription>
                New {entityLabel} records become available to timetable entries
                immediately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReferenceForm
                action={createAction}
                mode="create"
                entityLabel={entityLabel}
                fields={createFields}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
