FROM oven/bun:1-alpine AS builder

RUN apk add --no-cache python3 make g++ git

WORKDIR /app

COPY package.json bun.lock ./

COPY packages ./packages
COPY playgrounds ./playgrounds
COPY tools ./tools
COPY docs ./docs

RUN bun install --frozen-lockfile

WORKDIR /app/playgrounds/vite

ENV NODE_ENV=production
RUN bun run build-playground

# Production stage с nginx
FROM nginx:alpine

COPY --from=builder /app/playgrounds/vite/dist /usr/share/nginx/html

COPY playgrounds/vite/nginx.conf /etc/nginx/conf.d/default.conf

# Health check endpoint
RUN echo "healthy" > /usr/share/nginx/html/health

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]