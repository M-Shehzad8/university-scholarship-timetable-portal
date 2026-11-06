import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads .env.local, while Prisma CLI would only read .env by default.
// Loading .env.local first keeps one local connection string for both tools.
loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // The fallback keeps generate/validate usable on a fresh checkout before
    // a local database has been configured. Real commands still need a server.
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/fyp_project?schema=public",
  },
});
