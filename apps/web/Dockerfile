# Stage 1: Build the SvelteKit application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./

RUN npm install --legacy-peer-deps

COPY . .
# Remove server reference from tsconfig.json for Docker build
RUN sed -i '/"references":/,/}]/d' tsconfig.json

RUN npm run build

# Stage 2: Create the final production image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

ENV NODE_ENV=production
CMD ["node", "build"]

