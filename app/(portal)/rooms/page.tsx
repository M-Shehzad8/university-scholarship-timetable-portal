import type { Metadata } from "next";
import Link from "next/link";

import { DeleteReferenceForm } from "@/components/timetable/delete-reference-form";
import { NoDepartmentNotice } from "@/components/timetable/no-department-notice";
import { ReferenceAlerts } from "@/components/timetable/reference-alerts";
import { ReferenceManager } from "@/components/timetable/reference-manager";
import {
  ReferenceForm,
  type ReferenceFormField,
} from "@/components/timetable/reference-form";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { TableCell, TableRow } from "@/components/ui/table";
import { requireStaffOrCoordinator } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/time/portal";
import {
  createRoomAction,
  deleteRoomAction,
  updateRoomAction,
} from "@/lib/timetable/actions";
import { getRoomsWithTodaySchedule } from "@/lib/timetable/queries";
import {
  DAY_LABELS,
  formatTimeRange,
  getPortalDayOfWeek,
} from "@/lib/timetable/rules";

export const metadata: Metadata = {
  title: "Rooms",
};

export const instant = false;

const roomFields: ReferenceFormField[] = [
  {
    name: "roomNumber",
    label: "Room number",
    defaultValue: "",
    placeholder: "101",
    maxLength: 20,
  },
  {
    name: "building",
    label: "Building",
    defaultValue: "",
    placeholder: "Main Block",
    hint: "Optional.",
    maxLength: 80,
    required: false,
  },
];

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; notice?: string; problem?: string }>;
}) {
  const user = await requireStaffOrCoordinator();
  const params = await searchParams;
  const canManage = user.role === "STAFF";
  const todayDay = getPortalDayOfWeek();

  const header = (
    <PageHeader
      eyebrow="Operations"
      title="Rooms"
      description="Department teaching spaces used by the timetable. Automatic assignment considers these rooms in ascending room-number order."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/timetable"
            className={buttonStyles({ variant: "secondary", size: "md" })}
          >
            Back to timetable
          </Link>
          <Badge tone={canManage ? "info" : "warning"}>
            {canManage ? "Staff editor" : "Read-only"}
          </Badge>
        </div>
      }
    />
  );

  if (!user.department) {
    return (
      <div className="space-y-8">
        {header}
        <NoDepartmentNotice />
      </div>
    );
  }

  const rooms = await getRoomsWithTodaySchedule(user.department.id, todayDay);
  const editing = params.edit
    ? rooms.find((room) => room.id === params.edit)
    : undefined;

  const editPanel = editing ? (
    <Card id="edit-record" key={editing.id}>
      <CardHeader>
        <CardTitle>Edit room</CardTitle>
        <CardDescription>
          Room {editing.roomNumber} is used by {editing._count.entries}{" "}
          {editing._count.entries === 1 ? "class" : "classes"} across the week.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReferenceForm
          action={updateRoomAction}
          mode="edit"
          entityLabel="room"
          fields={roomFields.map((field) => ({
            ...field,
            defaultValue:
              field.name === "roomNumber"
                ? editing.roomNumber
                : (editing.building ?? ""),
          }))}
          idField="roomId"
          idValue={editing.id}
          cancelHref="/rooms"
        />
      </CardContent>
    </Card>
  ) : params.edit ? (
    <Alert tone="warning" title="Room not found">
      That room no longer exists in your department. Choose another row to edit.
    </Alert>
  ) : undefined;

  const columnCount = canManage ? 6 : 5;

  return (
    <div className="space-y-8">
      {header}
      <ReferenceAlerts notice={params.notice} problem={params.problem} />

      <section aria-labelledby="room-usage-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="room-usage-heading"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Today&apos;s room usage
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {DAY_LABELS[todayDay]} classes for each department room.
            </p>
          </div>
          <Badge tone="info">{rooms.length} rooms</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.length === 0 ? (
            <Card className="sm:col-span-2 xl:col-span-3">
              <EmptyState
                title="No rooms yet"
                description="Add the first room so the timetable can schedule and auto-assign classes."
                className="py-10"
              />
            </Card>
          ) : (
            rooms.map((room) => (
              <Card key={room.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>Room {room.roomNumber}</CardTitle>
                      <CardDescription>
                        {room.building ?? "Building not set"}
                      </CardDescription>
                    </div>
                    <Badge tone={room.entries.length > 0 ? "info" : "success"}>
                      {room.entries.length > 0
                        ? `${room.entries.length} today`
                        : "Free all day"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  {room.entries.length > 0 ? (
                    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {room.entries.map((entry) => (
                        <li
                          key={entry.id}
                          className="flex items-start justify-between gap-3 px-5 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {entry.course.code}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {entry.batch.name}-{entry.batch.section}
                            </p>
                          </div>
                          <p className="font-mono text-xs whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                            {formatTimeRange(
                              entry.startMinute,
                              entry.endMinute,
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-5 pb-5 text-sm text-zinc-500 dark:text-zinc-400">
                      No class is scheduled in this room today.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <ReferenceManager
        tableTitle="Department rooms"
        tableDescription="Room numbers are unique within a department."
        columns={["Room", "Building", "Today", "All classes", "Updated"]}
        count={rooms.length}
        canManage={canManage}
        createAction={createRoomAction}
        createFields={roomFields}
        entityLabel="room"
        editPanel={editPanel}
      >
        {rooms.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columnCount} className="p-0">
              <EmptyState
                title="No rooms yet"
                description="Add the first room so the timetable can schedule and auto-assign classes."
                className="py-10"
              />
            </TableCell>
          </TableRow>
        ) : (
          rooms.map((room) => (
            <TableRow key={room.id}>
              <TableCell className="font-medium whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                {room.roomNumber}
              </TableCell>
              <TableCell className="text-xs">{room.building ?? "—"}</TableCell>
              <TableCell>
                <Badge tone={room.entries.length > 0 ? "info" : "success"}>
                  {room.entries.length}
                </Badge>
              </TableCell>
              <TableCell>{room._count.entries}</TableCell>
              <TableCell className="text-xs whitespace-nowrap">
                {formatDateTime(room.updatedAt)}
              </TableCell>
              {canManage ? (
                <TableCell>
                  <div className="flex flex-col items-start gap-2">
                    <Link
                      href={`/rooms?edit=${room.id}#edit-record`}
                      className={buttonStyles({
                        variant: "secondary",
                        size: "sm",
                      })}
                    >
                      Edit
                    </Link>
                    <DeleteReferenceForm
                      action={deleteRoomAction}
                      id={room.id}
                      returnTo="/rooms"
                      label="Delete room"
                      description={`Delete room ${room.roomNumber}? Rooms used by a class cannot be deleted.`}
                    />
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          ))
        )}
      </ReferenceManager>
    </div>
  );
}
