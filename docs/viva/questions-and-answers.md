# Viva Questions and Answers

**Project:** University Scholarship and Academic Timetable Portal  
**Purpose:** Concise, defensible answers for the final demonstration.

---

## A. Project overview and scope

### A1. What problem does the project solve?

It gives one authenticated portal for two academic services. Students find scholarship opportunities and their own class timetable. Staff maintain both datasets with validation and conflict checks. Coordinators manage accounts and review department activity.

### A2. Why only scholarships and timetables?

Because the project is assessed on correct, explainable business logic, not on breadth. Two modules allow a complete data model, real rules, tests, and a deployment that can be defended line by line. Adding fees, payroll, attendance, and examinations would dilute that.

### A3. What is explicitly out of scope?

Email/SMS/WhatsApp delivery, AI or genetic timetable generation, full ERP modules, PDF export, payment processing, and multi-department switching in the interface.

### A4. Who are the users?

Students, authorised staff, and coordinators. No additional institutional roles were invented.

### A5. What is the single most important design decision?

Keep the system small and deterministic. Every rule must be explainable in the viva and testable without a browser.

---

## B. Architecture and technology

### B1. Why Next.js?

The App Router lets pages read the database on the server, so protected data never has to be sent to the browser to render. Server actions keep mutations close to their validation and authorization, which reduces API boilerplate.

### B2. What is the architecture in one sentence?

A server-rendered Next.js application with server actions, a shared domain-rule layer, centralized Prisma queries, and one PostgreSQL database.

### B3. Why PostgreSQL?

It provides strong relational integrity, unique constraints, indexes, transactions, and reliable date handling. The domain is naturally relational: a timetable row links four entities.

### B4. Why Prisma?

It gives a typed client generated from the schema, versioned migrations, and parameterized queries. That reduces SQL injection risk and keeps database access consistent.

### B5. Where does business logic live?

Pure rules live in `lib/timetable/rules.ts` and `lib/scholarships/rules.ts`. Database-backed checks live in the query modules. Server actions orchestrate validation, authorization, rule checks, and writes.

### B6. Why not put queries directly in components?

It duplicates logic, makes testing harder, and allows one page to disagree with another. Centralized queries ensure dashboards, reports, and detail pages use the same source of truth.

### B7. What is a Server Component?

A React component that runs on the server and sends rendered output, not its data-access code, to the browser. It is the default in the App Router.

### B8. What is a Server Action?

A server-side function invoked from a form. The browser never receives the database code. The action validates input, checks the role, mutates data, and revalidates affected paths.

---

## C. Database and ER model

### C1. What are the main entities?

Department, User, Session, Scholarship, SavedScholarship, Notification, Course, Teacher, Batch, Room, and TimetableEntry.

### C2. Explain the relationship between users and batches.

A batch can contain many student users, but each student may link to at most one batch. Staff and coordinators are not batch-bound. The foreign key is optional because not every account needs a batch.

### C3. Explain the many-to-many scholarship relationship.

A student can save many scholarships and a scholarship can be saved by many students. `SavedScholarship` is the join table, with a composite primary key `(userId, scholarshipId)` and a `savedAt` timestamp.

### C4. Why is `TimetableEntry` the central table?

It is the intersection of course, batch, teacher, and room at a specific day and time. Each foreign key is required, so an incomplete class cannot be stored.

### C5. What happens if someone deletes a room that has classes?

The foreign key uses `onDelete: Restrict`, so the database rejects the deletion. This protects schedule history and forces the user to remove or reassign classes first.

### C6. What cascades on delete?

Sessions, saved scholarships, and notifications cascade with their user or scholarship. They are dependent records with no meaning on their own.

### C7. Why store start and end as integers?

Minutes from midnight make overlap checks simple integer comparisons and index-friendly queries. The weekly timetable has no timezone conversion because it is a local wall-clock schedule.

### C8. Why not store a full timestamp for each class?

The timetable repeats weekly. A timestamp would force a date dimension, semester handling, and timezone rules that are outside the scope. The portal fixes one time zone (`Asia/Karachi`) for “today” and “now”.

### C9. What indexes exist on the timetable?

Indexes on day/time, teacher/day/time, batch/day/time, and room/day/time. The conflict queries filter by one of those resources plus the day and interval.

### C10. Where are uniqueness rules enforced?

Course code is unique per department, room number is unique per department, teacher email is unique per department when present, and batch name plus section is unique per department. User email is globally unique.

### C11. Are database constraints enough to prevent timetable conflicts?

No. A database exclusion constraint could enforce interval overlap, but it requires additional PostgreSQL extensions and a more complex migration. The application performs the check, and integration tests verify it. A database-level constraint is a sensible future hardening step.

### C12. What about two staff saving conflicting classes at the same moment?

A race is theoretically possible: both requests could pass the check before either insert commits. The honest answer is that the current implementation is application-enforced, not serializable. The correct hardening is a PostgreSQL exclusion constraint or a transaction with an appropriate isolation level.

---

## D. Authentication and authorization

### D1. How are passwords stored?

With bcrypt, which salts each password and applies a deliberately slow hash. The plain password is never stored.

### D2. How does login work?

The email is normalised, the user is loaded, inactive accounts are rejected, bcrypt compares the password, a random token is created, its HMAC hash is stored in `Session`, and the raw token is placed in an HTTP-only cookie.

### D3. Why hash the session token?

If the database leaks, the stored hashes cannot be replayed as cookies because the raw token is not stored. Hashing makes a database read alone insufficient for account takeover.

### D4. Why HMAC-SHA256 instead of bcrypt for session tokens?

Session tokens are already high-entropy random values, so a slow password hash is unnecessary. HMAC is deterministic, which allows a direct indexed lookup by `tokenHash`. Bcrypt would require scanning every session.

### D5. Why not JWT?

A database session is easy to revoke: delete the row and the next request fails. A stateless JWT remains valid until expiry unless a revocation list is added, which reintroduces database state.

### D6. What makes the cookie safe?

It is HTTP-only, same-site, limited to seven days, and marked secure in production. JavaScript cannot read it.

### D7. Where is authorization enforced?

In the authenticated layout, in page-level role guards, and again inside every protected server action. The menu is filtered by role, but the menu is not the security boundary.

### D8. Prove that hiding a button is not enough.

A user can type `/users` directly. The page guard calls `requireCoordinator()` and redirects before reading user data. The same check exists in the user action.

### D9. What happens when an account is deactivated?

Login is rejected, and the session lookup also rejects an inactive user, so existing sessions stop working.

### D10. How are CSRF attacks handled?

Mutations use POST-based server actions, the session cookie is same-site, and Next.js applies its built-in server-action origin checks. There are no state-changing GET requests.

### D11. How is SQL injection prevented?

All database access goes through Prisma, which uses parameterized queries. User input is never concatenated into SQL.

### D12. How is XSS prevented?

React escapes rendered text by default, the project does not use `dangerouslySetInnerHTML`, and application URLs are restricted to `http` or `https`, blocking `javascript:` URLs.

### D13. How are open redirects prevented?

Return paths are sanitised against an allow-list of portal paths. A value such as `https://evil.example` or `//evil.example` falls back to a safe default.

### D14. Why is there no Content Security Policy?

Next.js injects inline bootstrap scripts. A strict CSP requires nonces or hashes wired through the framework. Adding a broken policy would be worse than documenting the limitation. A nonce-based CSP is listed as future work.

---

## E. Scholarship rules

### E1. When is a scholarship active?

When its stored status is `PUBLISHED` and its deadline is today or later.

### E2. Why derive expiry instead of updating the status on a timer?

A scheduled job adds moving parts and can fail silently. Deriving the effective state from status and deadline means the answer is always correct at read time, with no background process.

### E3. Is the deadline inclusive?

Yes. A scholarship remains open through the end of its deadline date.

### E4. What is “closing soon”?

A published scholarship whose deadline is within the next 14 days, inclusive of the boundary.

### E5. Can a student see drafts or archived records?

No. Those are staff-only. An expired published record remains readable by students as a reference in the saved view, but it is not presented as open.

### E6. Why keep expired records instead of deleting them?

Students may have saved them, and staff may need the history. Hiding them from the active catalogue is enough.

### E7. How is a scholarship URL validated?

It must parse as a URL and use the `http` or `https` scheme. Relative or `javascript:` values are rejected.

---

## F. Timetable and conflict logic

### F1. State the overlap rule.

```text
existingStart < newEnd AND existingEnd > newStart
```

This is the standard half-open interval test.

### F2. Why is the end exclusive?

It matches normal scheduling: a class from 09:00 to 10:00 and another from 10:00 to 11:00 do not overlap. Back-to-back classes are valid.

### F3. What three conflicts are checked?

Teacher, batch, and room. They are checked independently, so one pair of classes can produce more than one conflict type.

### F4. What happens when editing a class?

The row being edited is excluded from its own conflict query. Otherwise every edit would report a conflict with itself.

### F5. Are conflicts checked on the client?

The form may show errors, but the authoritative check is on the server before the write. Client checks are only for convenience.

### F6. How are conflicts shown?

The action returns a list of human-readable conflict messages, and the form displays them next to the relevant fields. Reports also show a department-wide conflict summary.

### F7. How does the student see only their batch?

The query uses the `batchId` from the authenticated user record. It is not taken from a URL parameter, so a student cannot request another batch by editing the address.

### F8. What happens if a student has no batch?

The timetable page shows a clear message instead of an empty or misleading table.

### F9. Why does the dashboard sometimes show a class from next week?

If every class for today has ended, the next occurrence is the same class next week. The rule wraps the day difference to seven and labels it correctly. A unit test covers this.

### F10. How is “today” determined?

With a fixed portal time zone (`Asia/Karachi`), so the server's own time zone cannot change the result. This makes the behaviour deterministic and testable.

---

## G. Automatic room assignment

### G1. Explain the algorithm.

Load the department rooms in ascending room-number order, remove rooms with an overlapping entry in the requested slot, and return the first remaining room.

### G2. Why is it deterministic?

The same rooms and the same time slot always produce the same result. That makes it testable and explainable. There is no randomness or optimisation.

### G3. What if no room is free?

The form reports that no room is available and does not save a class without a room.

### G4. Why not choose the “best” room by capacity or distance?

That is an optimisation problem outside the locked scope. Rooms have no capacity data in the required model, and a scoring system would add subjectivity without strengthening the demonstration.

### G5. What if the user edits a class and asks for auto assignment?

The class being edited is excluded from the occupancy check, so its current room can be selected again if it is otherwise free.

### G6. Is the room-number ordering numeric or lexical?

It is the database's ascending string order. With the seeded three-digit room numbers this is intuitive. Numeric ordering would be a future refinement if room numbers had mixed lengths.

### G7. What is the hardest part of this feature?

Correctly excluding the edited row and treating touching intervals as free. Both are covered by integration tests against real PostgreSQL.

---

## H. Dashboards, notifications, and reports

### H1. What is the difference between the student and staff dashboard?

The student dashboard is personal: active scholarships, deadlines, saved items, today's classes, and next class. The staff dashboard is operational: totals, room availability, classes scheduled, and conflicts.

### H2. Are dashboard numbers cached?

The pages are server-rendered with the project's caching configuration, and mutations revalidate affected paths. The numbers are not maintained by hand.

### H3. How do notifications work?

They are rows owned by one user. The user can mark one or all as read. The unread count is queried per user.

### H4. Why no email notifications?

Email requires an external provider, retries, delivery tracking, and credentials. In-system notifications demonstrate the rule without that operational burden.

### H5. How are reports kept consistent with the working pages?

Reports call the same query and rule modules. They do not reimplement counts or conflict logic.

### H6. What does the conflict report show?

Each pair of overlapping classes, the conflict type, the shared resource, and the slot. A clean department shows an empty state instead of an empty table.

---

## I. Testing

### I1. What testing framework is used?

Vitest, because it runs TypeScript directly with minimal configuration and fits the Next.js project.

### I2. How many tests are there?

73: 66 unit tests across four files and 7 database integration tests in one file.

### I3. What is the difference between your unit and integration tests?

Unit tests exercise pure rules, validation, and authorization with mocks and no database. Integration tests run real Prisma queries against PostgreSQL and verify conflict detection and room assignment.

### I4. How do integration tests avoid polluting data?

They create an isolated department with a unique suffix and delete every created row in dependency order after the run.

### I5. Give an example of a bug the tests found.

The next-class rule skipped a class that had already ended that day. When all of today's classes were over, the dashboard could show nothing even though the class recurs next week. The rule now wraps to seven days ahead, and a test locks it.

### I6. What is not covered by automated tests?

Full browser end-to-end flows, visual regression, load testing, and accessibility automation. Critical flows were verified manually with a headless browser and screenshots.

### I7. How do you know the build is healthy?

`npm run check` runs linting, type checking, Prisma validation, and all tests. `npm run build` produces the production build. The container health endpoint checks the database.

### I8. Why not test with a mocked database only?

Mocks would not prove that the Prisma `where` clauses and interval comparisons work against real SQL. The integration suite catches that class of error.

---

## J. Deployment and operations

### J1. Describe the deployment.

Docker Compose runs PostgreSQL, a one-shot migration container, and a standalone Next.js container. An optional seed service runs only with the `tools` profile.

### J2. Why a separate migration service?

The app should not start against an outdated schema. The migration job runs `prisma migrate deploy`, and the app waits for it to complete successfully.

### J3. What does `/api/health` check?

It runs a cheap database aggregate. If PostgreSQL is unreachable, it returns HTTP 503, so an orchestrator can restart or remove the instance.

### J4. Why standalone output?

Next.js traces only the files the server needs, which keeps the runtime image small and avoids shipping the full build toolchain.

### J5. Does the container run as root?

No. The runtime image creates a non-root `nextjs` user and runs the server as that user.

### J6. What security headers are set?

`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security`. `X-Powered-By` is disabled.

### J7. Where does the database password come from?

From an environment variable passed by Compose. It is not committed. The session secret is also an environment variable and must be at least 32 characters.

### J8. How would you back up the database?

Use `pg_dump` inside the database container and store the dump outside the volume. Restore with `psql`. The commands are documented in `docs/deployment.md`.

---

## K. Scope and limitations

### K1. What would you add with more time?

A semester and holiday calendar, CSV/PDF export, email delivery behind a queue, a nonce-based CSP, end-to-end browser tests, soft deletion with an audit trail, and multi-department switching.

### K2. What is the biggest technical limitation?

Timetable conflicts are enforced in the application, not by a database exclusion constraint. Concurrent conflicting writes are therefore theoretically possible.

### K3. What is the biggest scope limitation?

The interface demonstrates one department, although the schema is department-scoped.

### K4. Why should the examiner accept the limited scope?

Because every included feature is complete, validated, tested, and documented. The project demonstrates the full lifecycle: design, implementation, authorization, testing, deployment, and explanation.

### K5. If you had to prove one thing is correct, what would it be?

The timetable conflict rule. It is a pure function, tested at the boundary, and verified again against real PostgreSQL with integration tests.

---

## L. Rapid-fire answers

| Question | Answer |
| --- | --- |
| Overlap condition? | `existingStart < newEnd && existingEnd > newStart` |
| Room choice? | First free department room in room-number order |
| Scholarship active? | Published and deadline today or later |
| Session stored? | HMAC hash of the token, never the raw token |
| Password stored? | bcrypt hash |
| Authorization location? | Server layout, page guard, and server action |
| Student timetable scope? | The batch linked to the authenticated user |
| Health failure code? | HTTP 503 |
| Unit tests? | 66 |
| Integration tests? | 7 |
| Total tests? | 73 |
| Why no AI scheduling? | Out of scope; deterministic logic is testable and defensible |
