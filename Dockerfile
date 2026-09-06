# syntax=docker/dockerfile:1

# ------------------------------------------------------------------------------
# Stage 1: Base environment with Alpine Linux & Node.js 20 LTS
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base

# Install libc6-compat for compatibility with Alpine libc (musl)
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ------------------------------------------------------------------------------
# Stage 2: Install dependencies using npm ci & package-lock.json
# ------------------------------------------------------------------------------
FROM base AS deps

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install exact dependencies deterministically without dev script execution
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 3: Build the application with Next.js 15 standalone output
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

# Copy cached dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy full source tree (filtered by .dockerignore)
COPY . .

# Disable telemetry and set production build environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Ensure public directory exists even if git didn't track empty folders
RUN mkdir -p /app/public

# Compile Next.js 15 app (generates .next/standalone and .next/static)
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 4: Minimal production runner for Google Cloud Run
# ------------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cloud Run defaults: binds to 0.0.0.0 and port 8080 (dynamically overridden by $PORT)
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Create unprivileged system user and group (principle of least privilege)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public static directory (if present)
COPY --from=builder /app/public ./public

# Ensure .next directory exists with correct write permissions for nextjs user
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone server distribution and static assets with non-root ownership
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Run container as unprivileged user
USER nextjs

# Expose standard Cloud Run container port
EXPOSE 8080

# Execute server directly via node (PID 1 receives SIGTERM cleanly for graceful shutdown)
CMD ["node", "server.js"]
