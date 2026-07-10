FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.11.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

ENV HUSKY=0
RUN pnpm install --frozen-lockfile

COPY . .

ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN pnpm exec prisma generate
RUN pnpm run build

RUN pnpm prune --prod --ignore-scripts \
  && rm -rf \
    node_modules/.bin/prisma \
    node_modules/prisma \
    node_modules/.pnpm/prisma@* \
    node_modules/.pnpm/@prisma+engines@* \
    node_modules/.pnpm/@prisma+studio-core@* \
    node_modules/.pnpm/@prisma+dev@* \
    node_modules/.pnpm/@prisma+fetch-engine@* \
    node_modules/.pnpm/@prisma+query-plan-executor@* \
    node_modules/.pnpm/@prisma+get-platform@* \
    node_modules/.pnpm/@prisma+streams-local@* \
    node_modules/.pnpm/@electric-sql+pglite* \
    node_modules/.pnpm/typescript@* \
    node_modules/.pnpm/@typescript+typescript-* \
    node_modules/.pnpm/react@* \
    node_modules/.pnpm/react-dom@* \
    node_modules/.pnpm/@types+react@* \
    node_modules/.pnpm/chart.js@* \
    node_modules/.pnpm/effect@* \
    node_modules/.pnpm/hono@* \
    node_modules/.pnpm/@hono+* \
    node_modules/.pnpm/mysql2@* \
    node_modules/.pnpm/jiti@* \
    node_modules/.pnpm/remeda@* \
    node_modules/.pnpm/valibot@* \
    node_modules/.pnpm/fast-check@* \
    node_modules/.pnpm/csstype@* \
    node_modules/.pnpm/luxon@*

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
