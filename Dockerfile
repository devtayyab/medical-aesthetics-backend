# FROM node:20-alpine

# RUN corepack enable

# WORKDIR /app

# COPY package.json pnpm-lock.yaml ./

# RUN pnpm install --prod --frozen-lockfile

# COPY . .

# CMD ["node", "dist/main.js"]



# # runner
# FROM node:20-alpine
# WORKDIR /app
# RUN corepack enable
# COPY package.json pnpm-lock.yaml ./
# RUN pnpm install --prod --frozen-lockfile
# COPY --from=builder /app/dist ./dist
# ENV NODE_ENV=production
# EXPOSE 3000
# CMD ["node", "dist/main.js"]

# Stage 1: Build
FROM node:20-alpine AS builder

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Copy only needed files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

CMD ["node", "dist/main.js"]
