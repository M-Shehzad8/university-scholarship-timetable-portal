# University Portal

A full-stack university academic services portal with two focused modules:

- **Scholarships** — browse, search, filter, and save scholarship opportunities maintained by authorised staff.
- **Timetable** — manage and view class schedules with teacher, batch, and room conflict checking, plus deterministic automatic room assignment.

The project is intentionally scoped as a student academic services portal, not a complete university ERP.

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
| Testing              | Added in the testing phase                  |

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

## Available scripts

| Command                | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `npm run dev`          | Start the development server                         |
| `npm run build`        | Generate Prisma Client and create a production build |
| `npm run start`        | Start the production server                          |
| `npm run lint`         | Run ESLint                                           |
| `npm run typecheck`    | Run the TypeScript compiler without emitting files   |
| `npm run check`        | Run linting, type checking, and Prisma validation    |
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
├── components/          # Portal shell and reusable UI components
├── lib/                 # Domain utilities, auth, validation, and database access
│   ├── auth/            # Sessions, passwords, guards, roles, and user actions
│   ├── db/              # Shared Prisma client
│   ├── generated/       # Generated Prisma client (ignored by Git)
│   └── validation/      # Server-side Zod schemas
├── prisma/              # Schema, migrations, and seed data
├── public/              # Static assets
├── docs/                # Architecture, requirements, database, and UI notes
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

## Documentation

- [Architecture](docs/architecture.md)
- [Requirements](docs/requirements.md)
- [Use cases](docs/use-cases.md)
- [Database design](docs/database.md)
- [Navigation and dashboards](docs/navigation.md)

## Status

Phase 2 is complete. Authentication, database-backed sessions, bcrypt password hashing, role guards, protected portal routes, role-aware navigation, role-specific dashboards, and coordinator user management are in place. The scholarship and timetable modules remain honest placeholders until Phases 3 and 4.
