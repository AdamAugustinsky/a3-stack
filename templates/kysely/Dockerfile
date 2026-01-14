# syntax=docker/dockerfile:1.7

# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install dependencies once and leverage BuildKit cache
FROM base AS install
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.cache/bun bun install --frozen-lockfile

# prune dev dependencies for the runtime image
FROM install AS prod-deps
RUN bun install --frozen-lockfile --production

# build the application with dev + build tooling available
FROM base AS build
ENV NODE_ENV=production
ARG BETTER_AUTH_SECRET
ARG DATABASE_URL
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ENV DATABASE_URL=${DATABASE_URL}
COPY --link --from=install /usr/src/app/node_modules node_modules
COPY . .
RUN bun --bun run build

# create the final runtime image
FROM arigaio/atlas:latest AS atlas

FROM base AS release
ENV NODE_ENV=production

# Read build-time environment variables for runtime
ARG BETTER_AUTH_SECRET
ARG DATABASE_URL
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ENV DATABASE_URL=${DATABASE_URL}

# Install Atlas binary from official image
COPY --from=atlas /atlas /usr/local/bin/atlas
RUN chmod +x /usr/local/bin/atlas

COPY --link --from=prod-deps /usr/src/app/node_modules node_modules
COPY --link --from=build /usr/src/app/ .

# Make scripts executable
RUN chmod +x ./scripts/apply-migration.sh ./docker-entrypoint.sh

# run the app
USER bun
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["bun", "./build/index.js"]
