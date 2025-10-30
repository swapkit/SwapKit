FROM oven/bun:1-alpine AS deps

WORKDIR /app

COPY package.json bun.lockb ./
COPY packages/*/package.json ./packages/
COPY playground/vite/package.json ./playground/vite/

RUN bun install --frozen-lockfile --production

# Build stage
FROM oven/bun:1-alpine AS builder

RUN apk add --no-cache python3 make g++ git

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

COPY package.json bun.lockb ./
COPY playground ./playground

RUN bun install --frozen-lockfile

WORKDIR /app/playground/vite
ENV NODE_ENV=production
RUN bun run build-playground

# Production stage
FROM nginx:alpine

COPY --from=builder /app/playground/vite/dist /usr/share/nginx/html
COPY playground/vite/nginx.conf /etc/nginx/conf.d/default.conf

RUN echo "healthy" > /usr/share/nginx/html/health

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]