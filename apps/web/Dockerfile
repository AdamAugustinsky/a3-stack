# Stage 1: Build the SvelteKit application
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json ./

RUN npm install --legacy-peer-deps

COPY . .
# Remove server reference from tsconfig.json for Docker build
RUN sed -i '/"references":/,/}]/d' tsconfig.json

# Set build-time environment variables
ARG PUBLIC_SERVER_URL
ENV PUBLIC_SERVER_URL=$PUBLIC_SERVER_URL

# Debug: Print the environment variable to verify it's set
RUN echo "Building with PUBLIC_SERVER_URL: $PUBLIC_SERVER_URL"

RUN npm run build

# Stage 2: Create the final production image
FROM node:24-alpine

WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4001

ENV NODE_ENV=production
ENV PORT=4001
CMD ["node", "build"]

