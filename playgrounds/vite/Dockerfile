# Stage 1: Dependencies
FROM oven/bun:1.2.23 AS deps
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Stage 2: Build
FROM oven/bun:1.2.23 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    gcc \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN bun run build:ci

WORKDIR /app/playgrounds/vite
RUN bun run build-playground

# Stage 3: Production
FROM nginx:alpine AS production

COPY --from=builder /app/playgrounds/vite/dist /usr/share/nginx/html

RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # JavaScript files with correct MIME type
    location ~ \.js$ {
        try_files $uri =404;
        add_header Content-Type application/javascript;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
EOF

RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]