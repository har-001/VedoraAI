# ── Stage 1: Install & Build ───────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies based on package-lock
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and config
COPY . .

# Set environment variable for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build Next.js app
RUN npm run build

# ── Stage 2: Production Runner ─────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Install production-only packages
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy static assets and build output from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "run", "start"]
