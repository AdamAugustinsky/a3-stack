# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb* /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Remove server reference from tsconfig.json for Docker build
RUN sed -i '/"references":/,/}]/d' tsconfig.json

# Set build-time environment variables
ARG PUBLIC_SERVER_URL
ENV PUBLIC_SERVER_URL=$PUBLIC_SERVER_URL

# Debug: Print the environment variable to verify it's set
RUN echo "Building with PUBLIC_SERVER_URL: $PUBLIC_SERVER_URL"

# (optional) tests & build
ENV NODE_ENV=production
RUN bun run build

# copy built application and necessary runtime files to final image
FROM base AS release
COPY --from=prerelease /usr/src/app/build ./build
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/node_modules ./node_modules

# run the app
USER bun
EXPOSE 4001
ENV NODE_ENV=production
ENV PORT=4001
ENTRYPOINT [ "bun", "build/index.js" ]

