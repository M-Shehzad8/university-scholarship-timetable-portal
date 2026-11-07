# University Portal

A full-stack university academic services portal with two focused modules:

- **Scholarships** — browse, search, filter, and save scholarship opportunities maintained by authorised staff.
- **Timetable** — manage and view class schedules with teacher, batch, and room conflict checking, plus deterministic automatic room assignment.

Live role-specific dashboards, an in-system notification centre, and basic read-only reports connect the two modules. The project is intentionally scoped as a student academic services portal, not a complete university ERP.

## Technology

| Area                 | Choice                                      |
| -------------------- | ------------------------------------------- |
| Framework            | Next.js 16 (App Router)                     |
| Language             | TypeScript                                  |
| UI                   | React 19 + Tailwind CSS 4                   |
| Database             | PostgreSQL 15+                              |
| ORM                  | Prisma 7 with the PostgreSQL adapter        |
| Validation           | Zod                                         |
| Authentication       | Database-backed sessions + bcrypt passwords |
| Linting / formatting | ESLint + Prettier                           |
| Testing              | Vitest (unit + database integration)        |
| Deployment           | Docker Compose + PostgreSQL                 |

## Requirements

- Node.js 20.9 or newer
- npm 10 or newer
- PostgreSQL 15 or newer

## Getting started

1. Install dependencies. This also generates the Prisma client:

   ```bash
   npm install
   ```

2. Create a local environment file and set the values for your machine:

   ```bash
   cp .env.example .env.local
   ```

   `.env.local` is ignored by Git. Never commit real credentials or secrets.

3. Make sure PostgreSQL is running and the database named in `DATABASE_URL` exists. Then apply the schema:

   ```bash
   npm run db:migrate
   ```

4. Create the local demo accounts. The seed script is idempotent and uses `SEED_PASSWORD` from `.env.local`:

   ```bash
   npm run db:seed
   ```

   If `SEED_PASSWORD` is not set, the local default is `PortalDemo2026!`.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) and sign in at `/login`.

### Demo accounts

| Role        | Email                        | Notes                       |
| ----------- | ---------------------------- | --------------------------- |
| Coordinator | `coordinator@university.edu` | User and role management    |
| Staff       | `staff@university.edu`       | Academic data maintenance   |
| Student     | `student@university.edu`     | Linked to batch `BCS-7A`    |
| Student     | `inactive@university.edu`    | Inactive; login is rejected |

All demo accounts use the `SEED_PASSWORD` value. Change it before seeding any shared or non-demo environment. Seeding never runs automatically in production.

The seed also creates seven demo scholarships covering published, closing-soon, expired-by-date, draft, archived, and explicitly expired records, plus two bookmarks for the student account. It also creates two batches (`BCS-7A`, `BCS-7B`), five courses, five teachers, six rooms, and 22 conflict-free timetable rows across Monday to Saturday. Seven demo notifications are created across the student, staff, and coordinator accounts so the notification centre and unread badge are populated immediately. Re-running the seed is idempotent.

## Scholarships

- Students see only published opportunities whose deadline has not passed by default. Search matches title, provider, category, description, and eligibility text.
- Students can filter by category and deadline state, open a read-only detail page, and save or remove a bookmark.
- A published record whose deadline has passed is shown as expired and cannot be newly saved, but saved expired records stay readable.
- Drafts and archived records are hidden from students and return the friendly not-found page.
- Staff and coordinators can create drafts, edit any record, publish, archive, mark expired, and delete. Deleting a record also deletes its bookmarks.
- Publishing a record with a past deadline is rejected. Students active at publication receive a notification row; explicitly expiring a record notifies the students who saved it.
- The portal links to the provider's official application page and never submits an application.

## Timetable

- Staff maintain courses, teachers, batches/sections, and rooms for their own department. Reference records used by a class cannot be deleted.
- Staff create, edit, and delete timetable rows in a table-first UI. A class stores the weekday, start minute, and exclusive end minute.
- Every save checks teacher, batch, and room conflicts on the server using the same overlap rule: `existingStart < newEnd AND existingEnd > newStart`, for the same day. The row being edited is excluded from its own check.
- The room field defaults to automatic assignment. The server orders department rooms by room number, removes rooms with an overlapping class, and assigns the first free room. If no room is free, the class is not saved and the form explains why.
- Staff and coordinators can filter the department timetable by batch, teacher, day, free-text search, or today. The search matches course code, course title, teacher name, and room number. Coordinators have a read-only view.
- Students see only the timetable for their linked batch, including today's classes and the next scheduled class.
- Room records show today's usage so staff can see which spaces are occupied.
- Creating, updating, or deleting a timetable row notifies the active students in the affected batch. A batch change on update notifies both the old and new batches. Notification failures are logged and never roll back a saved schedule change.

## Dashboards, notifications, and reports

- The dashboard is live and role-specific. Students see scholarship, deadline, saved-record, today's-class, and next-class summaries. Staff and coordinators see scholarship, timetable, room, and conflict summaries. Coordinators also see the active-account count.
- The notification centre lists only the signed-in user's messages, supports all/unread views, and records read state. The navigation shows the current unread count.
- Notification types cover scholarship publication and expiry, deadline reminders, timetable changes, room assignment, and timetable conflicts. Scholarship actions already create publication and expiry rows; timetable changes create `TIMETABLE_CHANGED` rows.
- Reports are basic read-only summaries for staff and coordinators: active scholarships, scholarships expiring within 14 days, timetable by batch, timetable by teacher, room usage today, and teacher/batch/room conflicts.
- Reports are intentionally small and explainable. They are not an analytics platform, and PDF export is not included.
- The interface is responsive and includes a persisted light/dark theme toggle in the public, login, and portal headers.

## Available scripts

| Command                | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `npm run dev`          | Start the development server                         |
| `npm run build`        | Generate Prisma Client and create a production build |
| `npm run start`        | Start the production server                          |
| `npm run lint`         | Run ESLint                                           |
| `npm run typecheck`    | Run the TypeScript compiler without emitting files   |
| `npm run check`        | Run linting, type checking, Prisma validation, and tests |
| `npm test`             | Run the full Vitest suite                            |
| `npm run test:unit`    | Run unit tests only                                  |
| `npm run test:integration` | Run database-backed integration tests            |
| `npm run format`       | Format the project with Prettier                     |
| `npm run format:check` | Check formatting without changing files              |
| `npm run db:generate`  | Generate the Prisma client                           |
| `npm run db:validate`  | Validate the Prisma schema                           |
| `npm run db:migrate`   | Create and apply development migrations              |
| `npm run db:seed`      | Create or refresh the local demo data                |
| `npm run db:studio`    | Open Prisma Studio                                   |

## Project structure

```text
fyp-project/
├── app/                 # App Router routes, layouts, and global styles
│   ├── login/           # Public login page and form
│   └── (portal)/        # Authenticated portal shell and module pages
├── components/          # Portal shell, dashboard, notification, report, scholarship, and timetable UI
├── lib/                 # Domain utilities, auth, validation, and database access
│   ├── auth/            # Sessions, passwords, guards, roles, and user actions
│   ├── dashboard/       # Live student and operational dashboard queries
│   ├── db/              # Shared Prisma client
│   ├── generated/       # Generated Prisma client (ignored by Git)
│   ├── notifications/   # Notification labels, queries, read actions, and timetable messages
│   ├── reports/         # Read-only scholarship, timetable, room, and conflict report data
│   ├── scholarships/    # Scholarship rules, queries, actions, and URL builders
│   ├── timetable/       # Timetable rules, queries, actions, URLs, and messages
│   ├── time/            # Shared portal calendar helpers
│   └── validation/      # Server-side Zod schemas
├── prisma/              # Schema, migrations, and seed data
├── public/              # Static assets
├── tests/               # Vitest unit and database integration tests
├── docs/                # Architecture, requirements, database, deployment, and UI notes
├── Dockerfile           # Multi-stage build: dependencies, build, migrate, runtime
├── docker-compose.yml   # PostgreSQL, migrations, app, and optional seed
└── README.md
```

The Prisma client is generated locally and is not committed. `npm install`, `npm run build`, or `npm run db:generate` recreates it.

## Environment variables

| Variable         | Purpose                                                 |
| ---------------- | ------------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string used by Prisma and the app |
| `SESSION_SECRET` | HMAC secret for hashing session tokens (32+ characters) |
| `SEED_PASSWORD`  | Password assigned to local demo accounts by `db:seed`   |

Only variables intended for the browser should use the `NEXT_PUBLIC_` prefix. All current configuration is server-side.

### Authentication model

- Passwords are hashed with bcrypt at cost 12. Plain passwords are never stored or logged.
- Login creates a random 256-bit token. The browser receives it in an HTTP-only, SameSite=Lax cookie.
- The database stores only an HMAC-SHA256 hash of the token, plus the user, expiry, and creation time.
- Sessions last seven days. Logout deletes the database row and clears the cookie.
- Deactivating an account revokes all of its sessions immediately.
- Every protected page and server action checks the session and role on the server. Hiding a navigation item is not treated as authorization.

## Testing

- `npm test` runs the complete Vitest suite.
- Unit tests cover time and interval helpers, teacher/batch/room conflict pairs, deterministic room selection, scholarship deadline states, authorization guards, role navigation, and every server-side validation schema.
- Integration tests run against PostgreSQL and verify the real conflict and free-room queries. They create isolated data and clean it up afterwards; they are skipped automatically when `DATABASE_URL` is not set.
- `npm run check` combines linting, type checking, Prisma validation, and tests.

## Deployment

The supported deployment is Docker Compose: PostgreSQL, a one-shot migration service, a standalone Next.js container, and an optional seed profile. See [Deployment](docs/deployment.md) for commands, environment variables, backups, and the verification checklist.

The app exposes `/api/health`, which returns HTTP 503 when PostgreSQL is unreachable. Production responses include security headers and omit `X-Powered-By`.

## Documentation

- [Architecture](docs/architecture.md)
- [Requirements](docs/requirements.md)
- [Use cases](docs/use-cases.md)
- [Database design](docs/database.md)
- [Navigation and dashboards](docs/navigation.md)
- [Deployment](docs/deployment.md)

## Status

The project is complete. Authentication, database-backed sessions, bcrypt password hashing, role guards, protected portal routes, role-aware navigation, live role-specific dashboards, the scholarship module, the timetable module, the notification centre, basic read-only reports, automated tests, and the Docker deployment are in place.

Verified Phase 3 flows include student search/filter/saved views, draft and archived detail protection, bookmark save/remove/cascade, staff create/edit/publish/archive/expire/delete, past-deadline publication rejection, field-level validation errors, and publication/expiry notification rows.

Verified Phase 4 flows include course/teacher/batch/room create, edit, duplicate rejection, and in-use delete protection; timetable row create/edit/delete; teacher, batch, and room overlap rejection; automatic room assignment in room-number order; the explicit no-room response; staff/coordinator/student access boundaries; and student batch scoping.

Verified Phase 5 flows include live student, staff, and coordinator dashboards; the unread notification badge; individual and bulk mark-read actions; timetable search and empty-state handling; live scholarship, timetable, room, and conflict reports; timetable create/update/delete notifications; and role boundaries for reports, notifications, scholarship editors, timetable editors, and user management.

Verified Phase 6 and 7 flows include 73 passing unit and integration tests, the next-class wrap fix, the dashboard day badge, production security headers, the database-aware health endpoint and its HTTP 503 failure path, Docker Compose startup and migrations, the seeded deployment, role-based access in containers, the 390 px responsive audit, and final database integrity checks.
