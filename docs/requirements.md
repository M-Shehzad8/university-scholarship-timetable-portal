# Requirements

> **Status:** finalised in Phase 1. This document defines the functional scope, roles, business rules, and acceptance criteria used by later phases. The authoritative project scope remains `plan.md`.

## 1. Purpose

Provide two useful university academic services in one focused application:

1. A maintained catalogue of scholarship opportunities that students can browse, search, filter, and save.
2. A departmental timetable that staff can maintain, with conflict checking and deterministic automatic room assignment.

The portal is a student academic services application. It is not a university ERP and does not attempt to replace institutional systems.

## 2. Actors and roles

Only the three roles below are in scope.

| Role        | Account scope                   | Primary responsibilities                                                                                     |
| ----------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Student     | Linked to one batch/section     | Browse, search, filter, and save scholarships; view the timetable for their batch; use the student dashboard |
| Staff       | Linked to one department        | Maintain scholarship records and timetable reference data; create timetable entries; request room assignment |
| Coordinator | Department and portal oversight | Manage users and roles; maintain department records; view scholarship and timetable status and reports       |

Authorization is enforced on the server. A hidden button or missing navigation item is not a security control.

## 3. Functional requirements

### 3.1 Authentication and access

| ID      | Requirement                                                                                                 | Phase |
| ------- | ----------------------------------------------------------------------------------------------------------- | ----- |
| AUTH-01 | Users can log in with an email address and password.                                                        | 2     |
| AUTH-02 | Passwords are stored only as a strong one-way hash.                                                         | 2     |
| AUTH-03 | Sessions are stored in an HTTP-only cookie and can be revoked by logging out.                               | 2     |
| AUTH-04 | Protected routes and server operations reject unauthenticated requests.                                     | 2     |
| AUTH-05 | Server-side role checks protect every student, staff, and coordinator operation.                            | 2     |
| AUTH-06 | Inactive accounts cannot log in.                                                                            | 2     |
| AUTH-07 | Coordinators can assign one of the three supported roles and can deactivate accounts.                       | 2     |
| AUTH-08 | A student account may be linked to one batch; a staff or coordinator account may be linked to a department. | 2     |

### 3.2 Scholarship catalogue

| ID     | Requirement                                                                                                                         | Phase |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- | ----- |
| SCH-01 | Students see published scholarships whose deadline has not passed, newest/soonest first.                                            | 3     |
| SCH-02 | Students can search by title, provider, and keyword text.                                                                           | 3     |
| SCH-03 | Students can filter by category and deadline state.                                                                                 | 3     |
| SCH-04 | A scholarship detail page shows description, eligibility, benefits, required documents, deadline, and official link.                | 3     |
| SCH-05 | Students can save and remove a scholarship bookmark; the pair is unique per student.                                                | 3     |
| SCH-06 | Expired and archived scholarships are excluded from default student listings but may remain readable by direct reference for staff. | 3     |
| SCH-07 | Staff can create a scholarship as a draft and edit it before publication.                                                           | 3     |
| SCH-08 | Staff can publish, archive, or explicitly expire a scholarship.                                                                     | 3     |
| SCH-09 | Staff can delete a scholarship; its saved-bookmark rows are removed with it.                                                        | 3     |
| SCH-10 | Staff see the last-updated timestamp on every scholarship record.                                                                   | 3     |
| SCH-11 | Scholarship input is validated on the server before writing.                                                                        | 3     |
| SCH-12 | A published scholarship whose deadline passes is treated as expired without losing the record.                                      | 3     |

### 3.3 Timetable

| ID    | Requirement                                                                                    | Phase |
| ----- | ---------------------------------------------------------------------------------------------- | ----- |
| TT-01 | Staff can create, edit, and remove courses within their department.                            | 4     |
| TT-02 | Staff can create, edit, and remove teachers within their department.                           | 4     |
| TT-03 | Staff can create, edit, and remove batches/sections within their department.                   | 4     |
| TT-04 | Staff can create, edit, and remove rooms within their department.                              | 4     |
| TT-05 | Staff can create, edit, and delete timetable entries using a compact table-oriented interface. | 4     |
| TT-06 | A timetable entry stores course, batch, teacher, day, start time, end time, and room.          | 4     |
| TT-07 | The server rejects a teacher conflict before saving.                                           | 4     |
| TT-08 | The server rejects a batch conflict before saving.                                             | 4     |
| TT-09 | The server rejects a room conflict before saving.                                              | 4     |
| TT-10 | Staff can request automatic assignment of a free department room for the selected interval.    | 4     |
| TT-11 | Automatic assignment returns the selected room or a clear no-room-available result.            | 4     |
| TT-12 | Students can view the weekly timetable for their linked batch.                                 | 4     |
| TT-13 | Staff and coordinators can view timetables by batch and by teacher.                            | 4     |
| TT-14 | All timetable input is validated on the server before writing.                                 | 4     |

### 3.4 Dashboards, notifications, and reports

| ID       | Requirement                                                                                                                                          | Phase |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| DASH-01  | The student dashboard shows active scholarships, deadlines soon, saved scholarships, today's classes, and next class.                                | 5     |
| DASH-02  | The staff/coordinator dashboard shows active scholarships, expiring soon, total rooms, scheduled classes, free rooms today, and timetable conflicts. | 5     |
| NOTIF-01 | In-system notifications cover scholarship publication, approaching deadlines, expiry, timetable changes, room assignment, and detected conflicts.    | 5     |
| NOTIF-02 | Users can mark notifications as read.                                                                                                                | 5     |
| NOTIF-03 | No SMS, WhatsApp, email, or external push infrastructure is required.                                                                                | 5     |
| REP-01   | Staff and coordinators can view active scholarships and scholarships expiring soon.                                                                  | 5     |
| REP-02   | Staff and coordinators can view timetable by batch, timetable by teacher, room usage, and a conflict summary.                                        | 5     |
| REP-03   | Reports remain small, read-only summaries; PDF export is optional and must not destabilise core features.                                            | 5     |

### 3.5 Platform behaviour

| ID     | Requirement                                                                                     | Phase |
| ------ | ----------------------------------------------------------------------------------------------- | ----- |
| SYS-01 | Every server input is validated before it reaches the database.                                 | 2–5   |
| SYS-02 | Database access is centralised through the shared Prisma client and data-access modules.        | 1–5   |
| SYS-03 | Screens provide loading, empty, and error states where data is involved.                        | 2–5   |
| SYS-04 | Business rules are implemented once in shared domain functions and reused by every entry point. | 2–5   |
| SYS-05 | The application leaves the repository runnable after every phase.                               | All   |
| SYS-06 | Secrets stay in environment variables and are never committed.                                  | All   |

## 4. Business rules

### 4.1 Scholarship state and visibility

- `DRAFT`: editable by staff, hidden from students.
- `PUBLISHED`: visible to students while the deadline has not passed.
- `ARCHIVED`: hidden from default listings; kept for reference.
- `EXPIRED`: explicitly expired by staff, or effectively expired because a published deadline has passed.
- **Active scholarship:** `status = PUBLISHED` and `deadline >= today`.
- **Deadline soon:** active scholarship whose deadline is within the next 14 calendar days.
- The deadline is a calendar date and remains inclusive through the end of that date.
- Saved bookmarks remain visible to the student with an expired marker, but the opportunity cannot be newly saved after it expires.
- Deleting a scholarship removes its bookmarks; it never leaves orphaned rows.

### 4.2 Timetable interval rule

Two entries conflict only when they are on the same day and their intervals overlap:

```text
existingStart < newEnd
AND
existingEnd > newStart
```

The end time is exclusive: `09:00–10:00` and `10:00–11:00` do not overlap. The rule is applied separately to:

- the same teacher;
- the same batch/section;
- the same room.

An update ignores the record being edited when checking for conflicts.

### 4.3 Department consistency

- Courses, teachers, batches, and rooms belong to a department.
- A timetable entry must use a course, batch, teacher, and room from the same department.
- Automatic room assignment uses the selected batch's department and only considers rooms owned by that department.

### 4.4 Automatic room assignment

1. Load the selected batch's department rooms in ascending room-number order.
2. Remove rooms with an overlapping timetable entry on the selected day and interval.
3. Select the first remaining room.
4. Return the selected room and save it on the entry.
5. If no room remains, return an explicit no-room-available result and do not invent a room.

No scoring, optimisation, genetic algorithm, AI scheduling, or complete timetable generation is used.

### 4.5 Data ownership and deletion

- A department cannot be deleted while it still owns courses, teachers, batches, or rooms.
- A course, batch, teacher, or room cannot be deleted while a timetable entry references it.
- Deleting a user removes that user's saved scholarships and notifications.
- Deleting a batch or department unlinks affected users instead of deleting their accounts.

## 5. Use cases

The detailed use-case catalogue is in [use-cases.md](use-cases.md).

## 6. Acceptance criteria

Phase 1 is complete when:

- the three roles and their permissions are documented;
- use cases cover authentication, scholarships, timetable, room assignment, dashboards, notifications, and reports;
- the database schema validates and matches the ER model;
- teacher, batch, and room conflict rules are defined with one interval rule;
- automatic room assignment is deterministic and has a no-room outcome;
- the navigation and dashboard structure exists in the application;
- the UI foundation demonstrates reusable controls, cards, tables, alerts, and empty states;
- lint, type-check, Prisma validation, and production build pass.

Later phases add their own acceptance criteria.

## 7. Non-functional requirements

- **Security:** server-side authentication and authorization, hashed passwords, HTTP-only sessions, validated input, and no secrets in source control.
- **Usability:** clear navigation, responsive layouts, readable tables, and explicit empty/error states.
- **Maintainability:** TypeScript types, shared domain functions, centralised data access, and no duplicated business rules.
- **Testability:** interval overlap and room assignment must be testable without a browser.
- **Performance:** indexes support the documented queries; pagination is added if lists grow beyond a reasonable single page.
- **Explainability:** every business rule has a short, accurate explanation.

## 8. Out of scope

The following remain excluded unless the project scope is formally changed:

- Scholarship scraping, crawling, or automatic application submission.
- Scholarship recommendation engines as a required feature.
- Full automatic timetable generation, advanced scheduling optimisation, or AI scheduling.
- Attendance, fees, hostel, library, transport, LMS, or ERP integration.
- Chat, video calls, WhatsApp, SMS, or native mobile applications.
- Custom machine-learning training or large data collection.
- Blockchain, microservices, or multi-university tenancy.

## 9. Assumptions

- One PostgreSQL database serves the application.
- A department is the ownership boundary for timetable reference data and rooms.
- The timetable is a weekly recurring schedule, not a date-specific calendar.
- Times are stored as minutes from midnight and displayed as 24-hour clock values.
- The system serves one university deployment; multi-tenant behaviour is not required.
