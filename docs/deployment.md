# Deployment

This document describes how to run the University Scholarship and Academic Timetable Portal in production. The supported deployment is one Next.js container, one PostgreSQL container, and a one-shot migration container, managed by Docker Compose.

## 1. Deployment model

```text
Browser
  |
  v
Next.js application container (port 3000)
  |  DATABASE_URL
  v
PostgreSQL container (private network, persistent volume)
```

Compose starts:

| Service   | Purpose                                                              |
| --------- | -------------------------------------------------------------------- |
| `db`      | PostgreSQL 16 with a persistent `db-data` volume                     |
| `migrate` | Applies every committed Prisma migration, then exits                 |
| `app`     | Runs the standalone Next.js server and exposes `/api/health`         |
| `seed`    | Optional demo data; only runs explicitly with the `tools` profile    |

The application container starts only after the database is healthy and the migration job has completed successfully. The app image is a multi-stage build: dependencies, build, migration/seed, and a minimal non-root runtime image.

## 2. Prerequisites

- Docker Engine 24+ with Docker Compose v2+
- At least 2 GB of free memory for the build
- Port 3000 available on the host, or a reverse proxy in front of it

## 3. Environment variables

| Variable            | Required | Purpose                                                    |
| ------------------- | -------- | ---------------------------------------------------------- |
| `SESSION_SECRET`    | Yes      | HMAC secret for session-token hashes. Use at least 32 chars |
| `POSTGRES_PASSWORD` | No       | Database password; defaults to `postgres` for local use     |
| `SEED_PASSWORD`     | No       | Password given to demo accounts by the optional seed job    |

Generate a production secret with Node:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Do not commit the secret or reuse the local demo password in a real environment.

## 4. Deploy with Docker Compose

From the repository root:

```powershell
$env:SESSION_SECRET = "replace-with-a-32-character-secret"
docker compose up --build -d
docker compose ps
```

Compose builds the images, starts PostgreSQL, applies migrations, and starts the app. Wait until the `app` service reports `healthy`:

```powershell
docker compose ps
curl.exe http://localhost:3000/api/health
```

Expected response:

```json
{ "status": "ok", "database": "ok" }
```

Open `http://localhost:3000/login` and sign in with a real account. The optional demo accounts can be created once:

```powershell
$env:SEED_PASSWORD = "PortalDemo2026!"
docker compose --profile tools run --rm seed
```

Seeding is idempotent but should not be run against production data unless demo records are explicitly wanted.

## 5. Production notes

- Run the service behind an HTTPS reverse proxy (nginx, Caddy, or a cloud load balancer). The Compose file exposes plain HTTP on port 3000 for local deployment; browsers only enforce the HSTS header over HTTPS.
- Keep PostgreSQL on the private Compose network. Do not publish port 5432 in production.
- Change `POSTGRES_PASSWORD` and `SESSION_SECRET` before the first production start.
- The app runs as an unprivileged `nextjs` user inside the runtime image.
- Security headers are applied to every response: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security`. `X-Powered-By` is disabled.
- `/api/health` returns HTTP 503 when the database cannot be reached, so it can be used directly by a load balancer or orchestrator health check.

## 6. Database migrations and backups

Apply new migrations after pulling a new image:

```powershell
docker compose run --rm migrate
```

Create a logical backup:

```powershell
docker compose exec -T db pg_dump -U postgres -d fyp_project > backup.sql
```

Restore into an empty database:

```powershell
Get-Content backup.sql | docker compose exec -T db psql -U postgres -d fyp_project
```

The `db-data` volume persists across container recreation. Removing the volume deletes all data:

```powershell
docker compose down
```

Use `docker compose down -v` only when a full reset is intended.

## 7. Local non-Docker setup

For development without Docker:

```bash
npm install
cp .env.example .env.local
npm run db:migrate
npm run db:seed
npm run dev
```

The local database must be PostgreSQL 15 or newer and must match `DATABASE_URL` in `.env.local`.

## 8. Verification checklist

1. `docker compose ps` shows `db` and `app` healthy and `migrate` exited with code 0.
2. `GET /api/health` returns HTTP 200 with `database: "ok"`.
3. `GET /login` returns the sign-in form.
4. An anonymous request to `/dashboard` is redirected to `/login`.
5. A student can sign in and sees only student navigation.
6. A staff account can open `/rooms` and `/reports` but not `/users`.
7. A coordinator account can open `/users`.
8. Response headers include the configured security headers and no `X-Powered-By`.

## 9. Troubleshooting

| Symptom                                   | Check                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------- |
| `SESSION_SECRET` missing                  | Export the variable in the same shell before `docker compose up`       |
| App unhealthy, database error in health   | `docker compose logs db`, then confirm the migration job succeeded     |
| Migration job fails                       | `docker compose logs migrate`; verify `DATABASE_URL` and credentials   |
| Build fails during `npm ci`               | Ensure the build machine can reach the npm registry                    |
| Port 3000 already in use                  | Stop the other process or change the published port in Compose         |
| Old UI after a change                     | Rebuild with `docker compose build app` and recreate the app service   |

Useful commands:

```powershell
docker compose logs app --tail 100
docker compose logs db --tail 100
docker compose exec db psql -U postgres -d fyp_project
docker compose down
```
