# University Portal

A full-stack university academic services portal with two focused modules:

- **Scholarships** — browse, search, filter, and save scholarship opportunities maintained by authorised staff.
- **Timetable** — manage and view class schedules with teacher, batch, and room conflict checking, plus deterministic automatic room assignment.

The project is intentionally scoped as a student academic services portal, not a complete university ERP.

## Technology

| Area                 | Choice                                        |
| -------------------- | --------------------------------------------- |
| Framework            | Next.js 16 (App Router)                       |
| Language             | TypeScript                                    |
| UI                   | React 19 + Tailwind CSS 4                     |
| Database             | PostgreSQL 15+                                |
| ORM                  | Prisma 7 with the PostgreSQL adapter          |
| Validation           | Zod (introduced with the first data features) |
| Linting / formatting | ESLint + Prettier                             |
| Testing              | Added in the testing phase                    |

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

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

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
| `npm run db:studio`    | Open Prisma Studio                                   |

## Project structure

```text
fyp-project/
├── app/                 # App Router routes, layouts, and global styles
│   └── (portal)/        # Shared portal shell and module pages
├── components/          # Portal shell and reusable UI components
├── lib/                 # Domain utilities, navigation, and database access
│   ├── db/              # Shared Prisma client
│   └── generated/       # Generated Prisma client (ignored by Git)
├── prisma/              # Schema, migrations, and future seed data
├── public/              # Static assets
├── docs/                # Architecture, requirements, database, and UI notes
└── README.md
```

The Prisma client is generated locally and is not committed. `npm install`, `npm run build`, or `npm run db:generate` recreates it.

## Environment variables

| Variable         | Purpose                                                 |
| ---------------- | ------------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string used by Prisma and the app |
| `SESSION_SECRET` | Secret used to sign session cookies                     |

Only variables intended for the browser should use the `NEXT_PUBLIC_` prefix. All current configuration is server-side.

## Documentation

- [Architecture](docs/architecture.md)
- [Requirements](docs/requirements.md)
- [Use cases](docs/use-cases.md)
- [Database design](docs/database.md)
- [Navigation and dashboards](docs/navigation.md)

## Status

Phase 1 is complete. Requirements, use cases, the database schema, the initial migration, navigation, dashboard structure, and the shared UI foundation are in place. Authentication, live scholarship data, and timetable scheduling are implemented in later phases.
