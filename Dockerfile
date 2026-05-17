# ──────────────────────────────────────────────────────
#  FarmaCompara — Dockerfile multi-etapa
#  Etapas: base → dev  /  base → builder → runner
# ──────────────────────────────────────────────────────

FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

# ── Desarrollo ─────────────────────────────────────────
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── Compilación ────────────────────────────────────────
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

# ── Runner de producción (imagen mínima) ───────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
