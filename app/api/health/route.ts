import { connection } from "next/server";

import { prisma } from "@/lib/db/prisma";

/**
 * Deployment health check. It deliberately uses a cheap aggregate query so a
 * running container reports unhealthy when PostgreSQL is unreachable.
 */
export async function GET() {
  await connection();

  try {
    await prisma.department.count();

    return Response.json(
      { status: "ok", database: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "unavailable", database: "error" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
