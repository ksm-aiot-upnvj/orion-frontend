# --- STAGE 1: BUILDER (Node.js + pnpm) ---
FROM node:22-alpine AS builder

WORKDIR /app

# Enable Corepack and pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package manifests and lockfile
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy full frontend source code
COPY . .

# Build production bundle with Vite
RUN pnpm run build

# --- STAGE 2: RUNNER (Nginx Web Server) ---
FROM nginx:alpine AS runner

# Custom Nginx configuration for multi-page routing and static caching
RUN echo 'server {' \
    '    listen 80;' \
    '    server_name localhost;' \
    '    root /usr/share/nginx/html;' \
    '    index index.html;' \
    '    location / {' \
    '        try_files $uri $uri/ $uri.html /index.html;' \
    '    }' \
    '    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {' \
    '        expires 30d;' \
    '        add_header Cache-Control "public, no-transform";' \
    '    }' \
    '}' > /etc/nginx/conf.d/default.conf

# Copy compiled assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
