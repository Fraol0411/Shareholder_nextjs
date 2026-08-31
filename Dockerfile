# syntax=docker.io/docker/dockerfile:1

# --- Stage 1: Base image ---
FROM node:20-alpine AS base

# --- Stage 2: Install dependencies ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy ONLY npm-specific files
COPY package.json package-lock.json ./

# 🟢 Streamlined npm cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# --- Stage 3: Build the application ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# If you are using Prisma, uncomment the line below to generate the client
# RUN npx prisma generate

# Build Next.js
RUN npm run build

# --- Stage 4: Production runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]