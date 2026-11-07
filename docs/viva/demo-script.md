# Viva Demonstration Script

**Application:** University Scholarship and Academic Timetable Portal  
**Recommended duration:** 10–12 minutes  
**Deployment used:** Docker Compose at `http://localhost:3000`

---

## 1. Before the demonstration

### 1.1 Start the deployment

```powershell
$env:SESSION_SECRET = "replace-with-the-demo-secret"
docker compose up -d
docker compose ps
```

Confirm:

- `db` is healthy;
- `migrate` exited with code 0;
- `app` is healthy.

Then open:

```text
http://localhost:3000/api/health
```

Expected:

```json
{ "status": "ok", "database": "ok" }
```

### 1.2 Accounts

| Role | Email | Password |
| --- | --- | --- |
| Coordinator | `coordinator@university.edu` | `PortalDemo2026!` |
| Staff | `staff@university.edu` | `PortalDemo2026!` |
| Student | `student@university.edu` | `PortalDemo2026!` |
| Inactive student | `inactive@university.edu` | `PortalDemo2026!` |

If the database is empty, seed it once:

```powershell
$env:SEED_PASSWORD = "PortalDemo2026!"
docker compose --profile tools run --rm seed
```

### 1.3 Keep these commands ready

```powershell
npm test
npm run check
npm run build
docker compose ps
curl.exe http://localhost:3000/api/health
```

---

## 2. Demonstration flow

### Part 0 — Prove the deployment (about 1 minute)

**Say:**

> The application is deployed as two containers: a Next.js runtime and PostgreSQL. A one-shot migration service runs before the app starts, so the schema is always current.

**Show:**

```powershell
docker compose ps
curl.exe http://localhost:3000/api/health
```

**Point out:**

- both services are healthy;
- the health endpoint checks the database, not only the web process.

---

### Part 1 — Public page and sign-in (about 1 minute)

1. Open `http://localhost:3000/`.
2. Show the public overview and the two modules.
3. Click **Sign in**.

**Say:**

> The public page explains the scope: scholarships and timetables, not a full ERP.

4. Sign in as the **student**.

**Expected:** redirect to `/dashboard`, heading “Welcome back, Sara Malik”, sidebar shows only Dashboard, Notifications, Scholarships, and Timetable.

**Say:**

> The navigation is filtered by role, but the real protection is on the server. I will prove that later by requesting a staff URL directly.

---

### Part 2 — Student journey (about 3 minutes)

#### 2.1 Dashboard

Point out:

- active scholarships;
- deadlines soon;
- saved scholarships;
- today's classes;
- next class with the correct day and room.

**Say:**

> The next-class card is computed from the student's batch timetable and the portal time zone. A class that already ended today correctly wraps to the same class next week.

#### 2.2 Scholarships

1. Open **Scholarships**.
2. Search for `merit`.
3. Show the category and deadline filters.
4. Open a scholarship detail page.
5. Press **Save scholarship**.
6. Open the **Saved** tab.

**Say:**

> The catalogue only shows published records whose deadline has not passed. A published record whose date has passed is treated as expired without a background job rewriting rows.

#### 2.3 Timetable

1. Open **Timetable**.
2. Point out the batch label and the weekly rows.
3. Show that the student does not see other batches.

**Say:**

> The student view is filtered by the batch linked to the account, not by a query parameter the user can change.

#### 2.4 Notifications

1. Open **Notifications**.
2. Mark one notification as read.
3. Show the unread count decrease.

**Say:**

> Notifications are stored per user. There is no email or SMS provider in scope.

---

### Part 3 — Staff journey, conflict logic, and auto assignment (about 4 minutes)

Sign out, then sign in as **staff**.

#### 3.1 Staff dashboard

Point out:

- active scholarships;
- expiring soon;
- rooms;
- classes scheduled;
- free rooms today;
- conflicts.

**Say:**

> The dashboard is a summary, not an analytics platform. Each value comes from the same query layer as the detail pages.

#### 3.2 Show the timetable

1. Open **Timetable**.
2. Point out the reference-data shortcuts: courses, teachers, batches, rooms.
3. Show the existing Monday class for BCS-7A, CS-301, 09:00–10:00, Room 101.
4. Press **Add class**.

#### 3.3 Demonstrate a rejected conflict

Fill the form with:

| Field | Value |
| --- | --- |
| Course | any course, for example CS-302 |
| Batch / section | BCS-7B |
| Teacher | a teacher **different** from the Monday 09:00 class |
| Day | Monday |
| Start time | 09:00 |
| End time | 10:00 |
| Room | Room 101 |

Submit.

**Expected:** the form is rejected because Room 101 is already occupied at that time.

**Say:**

> The server compares the new interval with every existing interval on the same day. The rule is `existingStart < newEnd AND existingEnd > newStart`. Because the end is exclusive, a class ending at 10:00 does not conflict with a class starting at 10:00.

#### 3.4 Demonstrate automatic room assignment

Change **Room** to:

```text
Auto assign a free department room
```

Submit again.

**Expected:** the class is saved with the first free room in ascending room-number order, for example Room 102.

**Say:**

> The automatic feature loads the department rooms in room-number order, removes rooms with an overlapping class, and picks the first remaining room. The result is deterministic, so it is easy to test and explain. If every room is occupied, the form reports that clearly instead of guessing.

#### 3.5 Undo the demonstration row

Find the new row and press **Delete class**, then confirm.

**Say:**

> I am removing the demonstration row so the seeded timetable stays unchanged.

#### 3.6 Show reports

1. Open **Reports**.
2. Point out active scholarships, expiring soon, timetable by batch, timetable by teacher, room usage, and the conflict summary.
3. Resize the browser to a narrow width.

**Say:**

> Tables scroll inside their cards. The page itself does not overflow on a phone-sized viewport.

---

### Part 4 — Coordinator journey (about 1.5 minutes)

Sign out and sign in as **coordinator**.

1. Open **People**.
2. Show the account list, roles, and active status.
3. Create a user or show the create form.
4. Open **Reports**.
5. Open **Rooms**.

**Say:**

> Only the coordinator can manage accounts. Staff can manage academic data but cannot create users. The server checks the role again inside the action, so hiding a button is not the security boundary.

---

### Part 5 — Prove authorization (about 1 minute)

Sign in as the **student**, then request a staff URL directly:

```text
http://localhost:3000/users
http://localhost:3000/rooms
http://localhost:3000/reports
```

**Expected:** the student is sent back to the dashboard with a forbidden message, and no protected data is rendered.

**Say:**

> Next.js may return HTTP 200 for a redirect in some cases, so I verify the result by the rendered content, not only by the status code. The important part is that the protected data is not served.

Optionally repeat with the **staff** account on `/users`.

---

### Part 6 — Prove the quality gates (about 1 minute)

Run:

```powershell
npm test
```

**Say:**

> The suite has 73 tests: 66 unit tests and 7 database integration tests. The unit tests cover the overlap rule, room selection, scholarship deadlines, authorization, and every validation schema. The integration tests run against PostgreSQL and clean up the data they create.

Optionally run:

```powershell
npm run check
npm run build
```

**Say:**

> `check` combines linting, type checking, Prisma schema validation, and the full test suite. The production build also passes.

---

### Part 7 — Close (about 30 seconds)

**Say:**

> The project deliberately covers two services well instead of many services poorly. The strongest parts are the rules an examiner can challenge line by line: interval overlap, deterministic room assignment, derived scholarship state, and session security. Email delivery, AI scheduling, PDF export, and a full ERP were excluded because they would add operational complexity without improving the core demonstration.

---

## 3. Timing summary

| Part | Topic | Time |
| --- | --- | ---: |
| 0 | Deployment health | 1 min |
| 1 | Public page and sign-in | 1 min |
| 2 | Student journey | 3 min |
| 3 | Staff, conflict, auto room, reports | 4 min |
| 4 | Coordinator | 1.5 min |
| 5 | Authorization proof | 1 min |
| 6 | Tests and build | 1 min |
| 7 | Close | 0.5 min |
| **Total** | | **~12 min** |

---

## 4. If something goes wrong

| Problem | Recovery |
| --- | --- |
| Login fails | Confirm the seed was run and use `PortalDemo2026!`. Check `docker compose logs app`. |
| Health endpoint fails | Run `docker compose ps` and `docker compose logs db`; the database may still be starting. |
| No scholarships appear | The seed may not have run, or all deadlines are in the past. Re-run the seed. |
| Auto assignment says no room | The seeded timetable may have changed. Use a slot with a free room, or reseed. |
| Browser shows an old page | Rebuild the app image with `docker compose build app` and recreate the service. |
| Port 3000 is busy | Stop the other process or change the published port in `docker-compose.yml`. |

---

## 5. Screenshot fallback

If the live deployment cannot be shown, use the captures in `docs/reports/screenshots/2026-11-07/`:

- `01-public-overview.png`
- `02-login.png`
- `03-student-dashboard.png`
- `04-student-scholarships.png`
- `05-student-timetable.png`
- `06-student-notifications.png`
- `07-staff-dashboard.png`
- `08-staff-timetable.png`
- `09-staff-rooms.png`
- `10-staff-reports.png`
- `11-staff-scholarships.png`
- `12-coordinator-dashboard.png`
- `13-coordinator-users.png`
- `14-coordinator-reports.png`
- `15-public-mobile.png` to `18-staff-reports-mobile.png`
