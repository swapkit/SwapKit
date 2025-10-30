# Multi-stage build
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ git
WORKDIR /app
# Copy package files
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build-playground

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]