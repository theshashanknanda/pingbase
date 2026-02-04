# Use Node.js LTS version
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files from monorepo root
COPY package*.json ./
COPY apps/apis/package*.json ./apps/apis/

# Install dependencies
RUN npm install

# Copy Prisma schema and generate client
COPY apps/apis/prisma ./apps/apis/prisma
RUN cd apps/apis && npx prisma generate

# Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/apis/node_modules ./apps/apis/node_modules

# Copy source code
COPY apps/apis ./apps/apis
COPY packages ./packages
COPY turbo.json ./

# Build TypeScript
WORKDIR /app/apps/apis
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy built application
COPY --from=builder /app/apps/apis/dist ./dist
COPY --from=builder /app/apps/apis/node_modules ./node_modules
COPY --from=builder /app/apps/apis/generated ./generated
COPY --from=builder /app/apps/apis/package.json ./package.json

EXPOSE 4000

CMD ["node", "dist/server.js"]
