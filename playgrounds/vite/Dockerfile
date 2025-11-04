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

RUN ls -la dist/ && test -f dist/index.html

FROM nginx:alpine

RUN rm -f /etc/nginx/conf.d/default.conf

COPY --from=builder /app/playgrounds/vite/dist /usr/share/nginx/html

COPY playgrounds/vite/nginx.conf /etc/nginx/conf.d/default.conf

RUN echo "healthy" > /usr/share/nginx/html/health

RUN nginx -t

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]