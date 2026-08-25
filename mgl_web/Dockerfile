# Build-time backend URL (Vite bakes VITE_* vars into the JS bundle at build time --
# changing the backend URL means rebuilding this image, not just restarting the container).
# Must be the bare backend origin, no /api suffix -- src/api/client.ts already prefixes
# every request path with /api itself.
# Example: docker build --build-arg VITE_API_URL=https://api.example.com -t mgl-web .
ARG VITE_API_URL

FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
# Defaults the CSP's connect-src to the same origin the JS bundle was built against;
# override at `docker run -e API_ORIGIN=...` time without rebuilding if it ever needs
# to differ (nginx re-renders this template from the container's real env at startup).
ARG VITE_API_URL
ENV API_ORIGIN=$VITE_API_URL
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/ >/dev/null || exit 1
