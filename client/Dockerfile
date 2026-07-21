# Questigo frontend — build the Vite app, then serve the static files with nginx.

# ---- Stage 1: build ----
FROM node:20-alpine AS build
WORKDIR /app

# API base is same-origin (/api/v1); nginx proxies /api to the backend container.
# Passed as a build arg so it is baked into the bundle deterministically.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Install deps first for layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Build.
COPY . .
RUN npm run build

# ---- Stage 2: serve ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
