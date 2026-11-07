# syntax=docker/dockerfile:1

# Shared base with the native dependencies Prisma and bcrypt expect.
FROM node:24-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies with the schema present because `postinstall`
# regenerates the Prisma client.
FROM base AS deps
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `next build` imports the database module, so a syntactically valid URL must
# exist at build time. The real URL is supplied at runtime by Compose.
ARG DATABASE_URL="postgresql://postgres:postgres@db:5432/fyp_project?schema=public"
ENV DATABASE_URL=$DATABASE_URL
RUN npm run build

# Migration/seed image: keeps the Prisma CLI and the TypeScript seed runner.
FROM base AS migrator
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json /app/package-lock.json /app/prisma.config.ts /app/tsconfig.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/lib ./lib
CMD ["npx", "prisma", "migrate", "deploy"]

# Minimal runtime image built from Next's traced standalone output.
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
