# ---- build ----
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build \
  && npm prune --omit=dev

# ---- runtime ----
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
  NODE_OPTIONS=--max-old-space-size=128

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist ./dist

USER app

CMD ["node", "dist/index.js"]
