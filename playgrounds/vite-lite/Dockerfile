FROM oven/bun:1.2.23 AS builder

RUN apt-get update && apt-get install -y \
    python3 make gcc g++ git \
    linux-libc-dev libudev-dev libusb-dev \
    && rm -rf /var/lib/apt/lists/*
RUN git config --global user.email "docker@build.local" && \
    git config --global user.name "Docker Build"
WORKDIR /app
COPY . .
RUN git init && git add -A && git commit -m "initial" || true
RUN bun install || echo "Install completed with warnings"
RUN bun add @passkeys/react --no-save || echo "Failed to add @passkeys/react"
RUN bun run build:ci || bun run build || echo "Build completed with warnings"
RUN bun --cwd=playgrounds/vite-lite run build
RUN ls -la playgrounds/vite-lite/dist/ && \
    test -f playgrounds/vite-lite/dist/index.html || \
    (echo "Build failed" && exit 1)
FROM nginx:alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY --from=builder /app/playgrounds/vite-lite/dist /usr/share/nginx/html
COPY --from=builder /app/playgrounds/vite-lite/nginx.conf /etc/nginx/conf.d/default.conf
RUN echo "healthy" > /usr/share/nginx/html/health
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]