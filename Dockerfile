# ==============================================================================
# JourneyMan — Multi-Stage Production Dockerfile
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Base Node Image
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

# ------------------------------------------------------------------------------
# 2. Dependencies & Build
# ------------------------------------------------------------------------------
FROM base AS build
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/
COPY prisma ./prisma/

RUN npm ci

COPY shared ./shared/
COPY client ./client/
COPY server ./server/

RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build --workspace=client

# ------------------------------------------------------------------------------
# 3. Production Runtime Runner
# ------------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/
COPY prisma ./prisma/

RUN npm ci --omit=dev && npx prisma generate --schema=./prisma/schema.prisma

COPY shared ./shared/
COPY server ./server/
COPY --from=build /app/client/dist ./client/dist

EXPOSE 3001

USER node

CMD ["node", "server/src/index.js"]
