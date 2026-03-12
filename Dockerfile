# ===================================
# PRODUCTION BUILD
# ===================================
# Builder stage
FROM node:20-alpine AS builder

RUN corepack enable

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev dependencies for building)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the NestJS application
RUN pnpm run build

# Remove dev dependencies
RUN pnpm prune --prod

# Runner stage
FROM node:20-alpine AS production

RUN corepack enable

# Install dumb-init for proper signal handling and curl for healthchecks
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Set environment to production
ENV NODE_ENV=production

# Expose the port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]

# ===================================
# DEVELOPMENT BUILD
# ===================================
# FROM node:20-alpine AS dev

# RUN corepack enable

# WORKDIR /app

# # Copy package files
# COPY package.json pnpm-lock.yaml ./

# # Install dependencies
# RUN pnpm install --frozen-lockfile

# # Copy source code
# COPY . .

# # Expose the port
# EXPOSE 3001

# # Start the application using pnpm exec
# CMD ["pnpm", "exec", "nest", "start", "--watch"]