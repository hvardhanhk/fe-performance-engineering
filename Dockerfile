##
# Multi-stage Dockerfile for Next.js 15 (standalone output)
#
# Stage 1 (deps):    Install production dependencies only
# Stage 2 (builder): Build the Next.js app
# Stage 3 (runner):  Minimal runtime image (~150MB vs ~1GB full Node image)
#
# Why standalone output?
# `output: 'standalone'` in next.config copies only the necessary files
# into .next/standalone — no need to copy node_modules into the final image.
# This produces a dramatically smaller image that starts faster.
#
# To add standalone output, set output: 'standalone' in next.config.ts.
##

FROM node:20-alpine AS deps

# Install libc6-compat for native module compatibility on Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy manifests first (better layer caching — deps layer only rebuilds when
# package.json or lock file changes, not on every source change)
COPY package.json package-lock.json ./
RUN npm ci --only=production

# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all deps (including devDeps needed for build)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build the app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# DOCKER_BUILD triggers output:'standalone' in next.config.ts
ARG DOCKER_BUILD=true
ENV DOCKER_BUILD=${DOCKER_BUILD}

RUN npm run build

# ─── Stage 3: Runtime ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy the standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check — Docker / ECS will restart the container if this fails
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ > /dev/null || exit 1

CMD ["node", "server.js"]
