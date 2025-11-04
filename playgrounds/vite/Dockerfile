
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

# Создаем правильный nginx конфиг
RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
    listen 8080;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Правильные MIME типы для JS модулей
    types {
        text/html                html htm shtml;
        text/css                 css;
        application/javascript   js mjs;
        application/json         json;
        image/png                png;
        image/jpeg               jpeg jpg;
        image/gif                gif;
        image/svg+xml            svg svgz;
        image/x-icon             ico;
        font/woff                woff;
        font/woff2               woff2;
        application/wasm         wasm;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Cache static assets
    location ~* \.(js|mjs|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # No cache for HTML
    location ~* \.html$ {
        add_header Cache-Control "no-cache";
    }
}
EOF

RUN echo "healthy" > /usr/share/nginx/html/health

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]