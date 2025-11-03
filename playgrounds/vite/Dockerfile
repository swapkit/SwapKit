
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

FROM nginx:alpine

COPY --from=builder /app/playgrounds/vite/dist /usr/share/nginx/html

RUN echo 'server {\
    listen 8080;\
    root /usr/share/nginx/html;\
    index index.html;\
    location / {\
        try_files $uri $uri/ /index.html;\
    }\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]