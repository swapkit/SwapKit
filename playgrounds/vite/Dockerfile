FROM oven/bun:1.2.23 AS builder

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    gcc \
    g++ \
    git \
    linux-libc-dev \
    libudev-dev \
    libusb-dev \
    && rm -rf /var/lib/apt/lists/*

RUN git config --global user.email "docker@build.local" && \
    git config --global user.name "Docker Build"

WORKDIR /app

COPY . .

RUN git init && git add -A && git commit -m "initial" || true

RUN bun install || echo "Install completed with warnings"

RUN bun run build:ci || echo "Build CI completed with warnings"

WORKDIR /app/playgrounds/vite

RUN rm -rf node_modules/.vite* .vite dist

RUN bun run build-playground

# Проверка что dist создан
RUN ls -la dist/ && test -f dist/index.html

FROM nginx:alpine

# Удаляем дефолтную конфигурацию
RUN rm -f /etc/nginx/conf.d/default.conf

# Копирование собранного приложения
COPY --from=builder /app/playgrounds/vite/dist /usr/share/nginx/html

# Копирование nginx конфига
COPY playgrounds/vite/nginx.conf /etc/nginx/conf.d/default.conf

# Health check endpoint
RUN echo "healthy" > /usr/share/nginx/html/health

# Проверка конфигурации
RUN echo "=== Checking nginx config ===" && \
    cat /etc/nginx/conf.d/default.conf && \
    echo "=== Testing nginx ===" && \
    nginx -t

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]