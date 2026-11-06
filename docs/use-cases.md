# Use Cases

> **Status:** finalised in Phase 1. These use cases describe intended behaviour. They do not claim that a later phase has already been implemented.

## Actors

| Actor       | Description                                                            |
| ----------- | ---------------------------------------------------------------------- |
| Student     | Portal user linked to one batch/section                                |
| Staff       | Authorised academic user linked to one department                      |
| Coordinator | Management user responsible for access, department data, and oversight |

## Catalogue

| ID    | Use case                                  | Primary actor               | Phase |
| ----- | ----------------------------------------- | --------------------------- | ----- |
| UC-01 | Log in and open the correct dashboard     | All roles                   | 2     |
| UC-02 | Manage users and roles                    | Coordinator                 | 2     |
| UC-03 | Browse, search, and filter scholarships   | Student                     | 3     |
| UC-04 | View scholarship details                  | Student                     | 3     |
| UC-05 | Save or remove a scholarship bookmark     | Student                     | 3     |
| UC-06 | Create or edit a scholarship              | Staff                       | 3     |
| UC-07 | Publish, archive, or expire a scholarship | Staff                       | 3     |
| UC-08 | Maintain timetable reference data         | Staff                       | 4     |
| UC-09 | Create or edit a timetable entry          | Staff                       | 4     |
| UC-10 | Assign a free room automatically          | Staff                       | 4     |
| UC-11 | View a timetable                          | Student, staff, coordinator | 4     |
| UC-12 | Use a role-based dashboard                | All roles                   | 5     |
| UC-13 | Read and update notifications             | All roles                   | 5     |
| UC-14 | View operational reports                  | Staff, coordinator          | 5     |

---

## UC-01 — Log in and open the correct dashboard

**Actor:** Student, staff, or coordinator
**Goal:** Start an authenticated session and land on the dashboard for the account's role.
**Precondition:** The account exists, is active, and has a password hash.

**Main flow:**

1. The user opens the login page.
2. The user submits email and password.
3. The server normalises the email, finds the account, and verifies the password hash.
4. The server creates a session and sets an HTTP-only cookie.
5. The user is redirected to the dashboard for their role.

**Exceptions:**

- Invalid credentials return a generic failure message.
- An inactive account is rejected with the same generic message.
- A missing or expired session sends a protected request back to login.

**Postcondition:** A valid session exists and the role is available to server-side authorization checks.
**Phase:** 2

---

## UC-02 — Manage users and roles

**Actor:** Coordinator
**Goal:** Keep portal access accurate.
**Precondition:** The coordinator is authenticated.

**Main flow:**

1. The coordinator opens People.
2. The coordinator searches existing accounts.
3. The coordinator creates an account or edits an existing one.
4. The coordinator selects `STUDENT`, `STAFF`, or `COORDINATOR`.
5. The coordinator links a student to a batch, or a staff/coordinator account to a department when required.
6. The server validates the values and role and saves the change.

**Exceptions:**

- Duplicate email addresses are rejected.
- A role outside the three supported values is rejected.
- A coordinator cannot silently remove the last active coordinator account.
- Deactivating an account invalidates future logins but keeps historical records.

**Postcondition:** The account has the intended role and an auditable updated timestamp.
**Phase:** 2

---

## UC-03 — Browse, search, and filter scholarships

**Actor:** Student
**Goal:** Find relevant, currently available opportunities.
**Precondition:** The student is authenticated.

**Main flow:**

1. The student opens Scholarships.
2. The system lists active scholarships with title, provider, category, deadline, and status.
3. The student enters a keyword or selects a category/deadline filter.
4. The server validates the filter values and returns matching active records.
5. The student opens a record or saves it.

**Exceptions:**

- No match returns an empty state with a clear way to clear filters.
- Expired and archived records are excluded from default results.
- An invalid filter value is ignored or rejected with a visible message.

**Postcondition:** The student sees only records they are allowed to see.
**Phase:** 3

---

## UC-04 — View scholarship details

**Actor:** Student
**Goal:** Understand eligibility, benefits, documents, and how to apply.
**Precondition:** The student is authenticated and the scholarship is published.

**Main flow:**

1. The student selects a scholarship.
2. The server loads the record and confirms it is published.
3. The page shows description, eligibility, benefits, required documents, deadline, and official application link.
4. The student follows the official link or saves the record.

**Exceptions:**

- An archived or missing record returns not-found.
- A published record whose deadline passed is shown as expired and cannot be newly saved.
- The official link opens externally; the portal does not submit an application.

**Postcondition:** The student has the information needed to apply outside the portal.
**Phase:** 3

---

## UC-05 — Save or remove a scholarship bookmark

**Actor:** Student
**Goal:** Keep an opportunity for later review.
**Precondition:** The student is authenticated and the scholarship is active.

**Main flow:**

1. The student selects Save on an active scholarship.
2. The server creates one `SavedScholarship` row for the student and scholarship pair.
3. The dashboard count and saved list update.
4. The student can remove the bookmark later.

**Exceptions:**

- Saving the same record twice returns the existing bookmark instead of creating a duplicate.
- Saving an expired or unpublished record is rejected.
- Removing a bookmark that does not exist is treated as already removed.

**Postcondition:** Exactly zero or one bookmark exists for the student and scholarship pair.
**Phase:** 3

---

## UC-06 — Create or edit a scholarship

**Actor:** Staff
**Goal:** Maintain accurate scholarship information from an official source.
**Precondition:** The staff member is authenticated and authorised.

**Main flow:**

1. The staff member opens the scholarship management area.
2. The staff member creates a draft or opens an existing record.
3. The staff member enters title, provider, category, description, eligibility, benefits, required documents, deadline, and official application URL.
4. The server validates every field and saves the record.
5. The record remains a draft until published.

**Exceptions:**

- Missing required fields return field-level errors.
- An invalid URL or an invalid deadline is rejected.
- A staff member cannot edit records outside their permitted scope.
- Duplicate submissions are prevented by the unique record ID and normal form handling.

**Postcondition:** A valid draft or updated record exists with a current `updatedAt`.
**Phase:** 3

---

## UC-07 — Publish, archive, or expire a scholarship

**Actor:** Staff
**Goal:** Control which opportunities students can see.
**Precondition:** The staff member is authenticated and the record exists.

**Main flow:**

1. The staff member opens a record.
2. The staff member chooses Publish, Archive, or Expire.
3. The server checks the requested transition and saves the new status.
4. Student listings and dashboards reflect the new visibility.

**Exceptions:**

- Publishing a record with invalid required fields is rejected.
- Archiving or expiring an already archived/expired record is treated as no change.
- Republishing is allowed only when the deadline has not passed.
- A published record whose deadline passes becomes effectively expired without a status rewrite.

**Postcondition:** The record has a valid status and the correct student visibility.
**Phase:** 3

---

## UC-08 — Maintain timetable reference data

**Actor:** Staff
**Goal:** Keep courses, teachers, batches, and rooms accurate.
**Precondition:** The staff member is authenticated and linked to a department.

**Main flow:**

1. The staff member opens the timetable management area.
2. The staff member selects a reference-data tab: courses, teachers, batches, or rooms.
3. The staff member creates or edits a record.
4. The server validates the values and the department relationship.
5. The record becomes available for timetable entries.

**Exceptions:**

- A duplicate course code, batch/section, or room number in the same department is rejected.
- A teacher email may be empty but must be unique within its department when present.
- A record referenced by a timetable entry cannot be deleted.
- A department with owned records cannot be deleted.

**Postcondition:** Reference data is valid and available for scheduling.
**Phase:** 4

---

## UC-09 — Create or edit a timetable entry

**Actor:** Staff
**Goal:** Add a class to the weekly timetable without conflicts.
**Precondition:** Course, batch, teacher, room, day, and interval are selected.

**Main flow:**

1. The staff member opens the timetable table and selects Add Class.
2. The staff member chooses a course, batch, teacher, day, start time, and end time.
3. The staff member chooses a room or requests automatic assignment.
4. The server validates the interval and checks teacher, batch, and room overlap.
5. The server saves the entry and refreshes the table.

**Exceptions:**

- End time must be greater than start time.
- The same teacher, batch, or room with an overlapping interval rejects the save and names the conflicting rule.
- On edit, the record being edited is excluded from conflict checks.
- Reference data from different departments is rejected.
- No free room returns a clear result instead of saving an invalid room.

**Postcondition:** Exactly one valid entry is saved and no teacher, batch, or room conflict exists.
**Phase:** 4

---

## UC-10 — Assign a free room automatically

**Actor:** Staff
**Goal:** Let the system choose a free department room for a selected interval.
**Precondition:** Day, start time, end time, and batch are selected.

**Main flow:**

1. The staff member selects Auto Assign Room.
2. The server loads the selected batch's department rooms in ascending room-number order.
3. The server removes rooms with an overlapping entry on the same day.
4. The server selects the first remaining room.
5. The interface shows the assigned room.
6. The selected room is saved with the timetable entry.

**Exceptions:**

- A room occupied by any overlapping class is skipped.
- If no room remains, the server returns a no-room-available result and does not save an invented room.
- The same input and timetable state always produce the same room choice.

**Postcondition:** The entry has a free department room, or the staff member receives an explicit failure.
**Phase:** 4

---

## UC-11 — View a timetable

**Actor:** Student, staff, or coordinator
**Goal:** See a useful weekly schedule.
**Precondition:** The user is authenticated.

**Main flow:**

1. A student opens Timetable and sees only their linked batch.
2. Staff and coordinators can switch between batch and teacher views.
3. The page groups entries by day and orders them by start time.
4. Each row shows course, batch, teacher, day, time, and room.
5. Today's and next classes are highlighted where relevant.

**Exceptions:**

- A student without a linked batch sees a clear empty state.
- A batch or teacher with no entries shows an empty state.
- Unauthorised access to another batch is rejected by the server.

**Postcondition:** The user sees only schedules they are allowed to see.
**Phase:** 4

---

## UC-12 — Use a role-based dashboard

**Actor:** Student, staff, or coordinator
**Goal:** See the small set of values that help with the next action.
**Precondition:** The user is authenticated.

**Main flow:**

1. The server identifies the role.
2. A student sees active scholarships, deadlines soon, saved scholarships, today's classes, and next class.
3. Staff and coordinators see active scholarships, expiring soon, total rooms, scheduled classes, free rooms today, and timetable conflicts.
4. Each card links to the relevant module or report.

**Exceptions:**

- No data shows a zero or an explicit empty state, not fake sample values.
- A failed query shows an error state with a retry path.

**Postcondition:** The dashboard reflects the signed-in role and current database state.
**Phase:** 5

---

## UC-13 — Read and update notifications

**Actor:** Student, staff, or coordinator
**Goal:** Learn about relevant scholarship or timetable changes.
**Precondition:** The user is authenticated.

**Main flow:**

1. The server creates an in-system notification for the relevant recipients.
2. The header or dashboard shows the unread count.
3. The user opens the notification list.
4. The user marks one or all notifications as read.

**Exceptions:**

- A notification for another user cannot be read or updated.
- Deleting a user removes that user's notifications.
- No external SMS, WhatsApp, email, or push service is called.

**Postcondition:** The notification is visible only to its recipient and its read state is stored.
**Phase:** 5

---

## UC-14 — View operational reports

**Actor:** Staff or coordinator
**Goal:** Review a focused operational summary.
**Precondition:** The user is authenticated and authorised.

**Main flow:**

1. The user opens Reports.
2. The user selects active scholarships, expiring scholarships, timetable by batch, timetable by teacher, room usage, or conflict summary.
3. The server validates any filter or selection and returns the report rows.
4. The user reads or prints the report.

**Exceptions:**

- Unauthorised roles cannot open staff/coordinator reports.
- Empty results show a clear empty state.
- PDF export is optional; its absence does not break the report.

**Postcondition:** The user has a read-only summary that matches current data.
**Phase:** 5

---

## Cross-cutting acceptance rules

- Every protected operation checks the session and role on the server.
- Every mutation validates input before writing.
- Every list screen has loading, empty, and error states.
- Business rules are shared functions, not copied page logic.
- No out-of-scope feature is added without explicit approval.
