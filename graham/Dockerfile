# Multi-stage Dockerfile for Graham Stephen Build Backend
# Optimized for Next.js 15 API routes with Node.js runtime

# Stage 1: Base dependencies
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies required for native modules
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Stage 2: Dependencies installation
FROM base AS deps

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies with exact versions for reproducible builds
RUN npm ci --only=production --frozen-lockfile && npm cache clean --force

# Stage 3: Development dependencies (for build)
FROM base AS deps-dev

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies including dev dependencies for build
RUN npm ci --frozen-lockfile

# Stage 4: Builder
FROM deps-dev AS builder

# Copy only necessary files and directories (avoid ui-main and other large folders)
COPY src/ ./src/
COPY public/ ./public/
COPY next.config.ts ./
COPY next-env.d.ts ./
COPY postcss.config.mjs ./
COPY components.json ./
COPY package*.json ./
COPY tsconfig.json ./
COPY eslint.config.mjs ./

COPY --from=deps /app/node_modules ./node_modules

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application with increased memory limit
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Stage 5: Production runner
FROM base AS runner

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts

# Create cache directory for Next.js (if it doesn't exist)
RUN mkdir -p .next/cache && chown nextjs:nodejs .next/cache

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]

# Labels for metadata
LABEL maintainer="Graham Stephen Build Team"
LABEL version="1.0"
LABEL description="Backend API service for Graham Stephen Build - LinkedIn Comment Analysis Platform"
LABEL org.opencontainers.image.source="https://github.com/graham-stephen-build/backend"
LABEL org.opencontainers.image.title="Graham Stephen Build Backend"
LABEL org.opencontainers.image.description="Next.js API backend with PostgreSQL and Redis integration"