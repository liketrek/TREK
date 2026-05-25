# ── Stage 1: shared ──────────────────────────────────────────────────────────
FROM node:24-alpine AS shared-builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
RUN npm ci --workspace=shared
COPY shared/ ./shared/
RUN npm run build --workspace=shared

# ── Stage 2: client ──────────────────────────────────────────────────────────
FROM node:24-alpine AS client-builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
RUN npm ci --workspace=client
COPY --from=shared-builder /app/shared/dist ./shared/dist
COPY client/ ./client/
RUN npm run build --workspace=client

# ── Stage 3: server ──────────────────────────────────────────────────────────
# --ignore-scripts skips native builds (better-sqlite3); they happen in the production stage.
FROM node:24-alpine AS server-builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
RUN npm ci --workspace=server --ignore-scripts
COPY --from=shared-builder /app/shared/dist ./shared/dist
COPY server/ ./server/
RUN npm run build --workspace=server

# ── Stage 4: production runtime ──────────────────────────────────────────────
FROM node:24-alpine
WORKDIR /app

# Workspace manifests only — source never enters this stage.
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# better-sqlite3 native addon requires build tools; purged after install.
RUN apk add --no-cache tzdata dumb-init su-exec python3 make g++ && \
    npm ci --workspace=server --omit=dev && \
    apk del python3 make g++ && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

COPY --from=server-builder /app/server/dist ./server/dist
# tsconfig-paths/register reads this at runtime to resolve MCP SDK paths.
COPY server/tsconfig.json ./server/
COPY --from=shared-builder /app/shared/dist ./shared/dist
COPY --from=client-builder /app/client/dist ./server/public
COPY --from=client-builder /app/client/public/fonts ./server/public/fonts

RUN mkdir -p /app/data/logs /app/uploads/files /app/uploads/covers /app/uploads/avatars /app/uploads/photos && \
    ln -s /app/uploads /app/server/uploads && \
    ln -s /app/data /app/server/data && \
    chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=3000
ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
# cd into server/ so tsconfig-paths/register finds tsconfig.json and ../node_modules resolves correctly.
CMD ["sh", "-c", "chown -R node:node /app/data /app/uploads 2>/dev/null || true; cd /app/server && exec su-exec node node --require tsconfig-paths/register dist/index.js"]
