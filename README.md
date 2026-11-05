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
| Database             | PostgreSQL                                    |
| ORM                  | Finalised in Phase 1                          |
| Validation           | Zod (introduced with the first data features) |
| Linting / formatting | ESLint + Prettier                             |
| Testing              | Added in the testing phase                    |

## Requirements

- Node.js 20.9 or newer
- npm 10 or newer
- PostgreSQL 15 or newer (required from Phase 1 onward)

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file and set the values for your machine:

   ```bash
   cp .env.example .env.local
   ```

   `.env.local` is ignored by Git. Never commit real credentials or secrets.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command                | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Start the development server                       |
| `npm run build`        | Create a production build                          |
| `npm run start`        | Start the production server                        |
| `npm run lint`         | Run ESLint                                         |
| `npm run typecheck`    | Run the TypeScript compiler without emitting files |
| `npm run check`        | Run linting and type checking together             |
| `npm run format`       | Format the project with Prettier                   |
| `npm run format:check` | Check formatting without changing files            |

## Project structure

```text
fyp-project/
├── app/                 # App Router routes, layouts, and global styles
├── components/          # Reusable UI components
├── lib/                 # Server-side logic, database access, and validation
├── prisma/              # Database schema and migrations (Phase 1 onward)
├── public/              # Static assets
├── docs/                # Architecture, requirements, and database notes
│   └── reports/         # Local learning reports (not committed)
├── AGENTS.md            # Working agreement for coding agents
├── plan.md              # Implementation plan and project constraints
└── README.md
```

`components/`, `lib/`, and `prisma/` are introduced when their first feature needs them. Keeping them out of the bootstrap avoids empty placeholders.

## Environment variables

| Variable         | Purpose                                              |
| ---------------- | ---------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string used by the application |
| `SESSION_SECRET` | Secret used to sign session cookies                  |

Only variables intended for the browser should use the `NEXT_PUBLIC_` prefix. All current configuration is server-side.

## Documentation

- [Implementation plan](plan.md)
- [Architecture](docs/architecture.md)
- [Requirements](docs/requirements.md)
- [Database design](docs/database.md)

## Status

Phase 0 (project bootstrap) is complete. The application builds, starts, and renders the foundation page. Phase 1 finalises requirements and the database design before feature work begins.
