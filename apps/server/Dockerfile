FROM oven/bun:1.2.7-alpine AS base

WORKDIR /app

FROM base AS deps
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

FROM base AS build
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM base AS production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY package.json ./

# Create data directory for local database file
RUN mkdir -p /app/data

EXPOSE 4000

# Initialize database schema on container start
CMD ["sh", "-c", "bun run db:migrate && bun run start"]

