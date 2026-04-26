FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.29-alpine
# Patch OS packages to pick up latest CVE fixes (libssl, libxml2, etc.)
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*
COPY --from=builder /app/dist/clinique_backend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost/ || exit 1
