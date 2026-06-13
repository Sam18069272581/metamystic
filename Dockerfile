FROM node:20-slim AS base

WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY tsconfig.base.json ./
COPY apps/backend apps/backend
COPY packages/shared packages/shared
RUN pnpm --filter @metamystic/backend prisma:generate
RUN pnpm --filter @metamystic/backend build

FROM base AS runtime

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile --filter @metamystic/backend...

COPY --from=build /app/apps/backend/dist apps/backend/dist
COPY --from=build /app/apps/backend/prisma apps/backend/prisma
COPY --from=build /app/packages/shared/src packages/shared/src
RUN pnpm --filter @metamystic/backend prisma:generate

ENV NODE_ENV=production

CMD ["sh", "-c", "pnpm --filter @metamystic/backend prisma:deploy && pnpm --filter @metamystic/backend start"]
