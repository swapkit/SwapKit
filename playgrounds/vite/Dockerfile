
FROM oven/bun:1 AS builder

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

WORKDIR /app/playgrounds/vite
RUN rm -rf node_modules dist
RUN bun install

RUN NODE_OPTIONS="--max_old_space_size=4096" bun run build-playground

FROM nginx:alpine

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/playgrounds/vite/dist ./

RUN echo '\
server {\
    listen 8080;\
    root /usr/share/nginx/html;\
    index index.html;\
    location / {\
        try_files \$uri \$uri/ /index.html;\
    }\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]