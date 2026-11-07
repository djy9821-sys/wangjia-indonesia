# Medusa backend (API + admin). Build from the monorepo root:
#   docker build -f apps/backend/Dockerfile -t wangjia-backend .
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/backend/package.json apps/backend/package.json
RUN pnpm install --frozen-lockfile --filter @b2b-starter/backend...

FROM deps AS build
COPY apps/backend apps/backend
WORKDIR /app/apps/backend
RUN pnpm medusa build

FROM base AS runtime
ENV NODE_ENV=production PORT=9000
WORKDIR /app/apps/backend
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/backend/node_modules ./node_modules
COPY --from=build /app/apps/backend/.medusa ./.medusa
COPY --from=build /app/apps/backend/data ./data
COPY --from=build /app/apps/backend/package.json ./package.json
# The built server runs from .medusa/server and needs its own node_modules link
RUN cd .medusa/server && ln -s ../../node_modules node_modules && ln -s ../../data data
EXPOSE 9000
# Migrations run on every start (idempotent), then the server
CMD ["sh", "-c", "cd .medusa/server && npx medusa db:migrate && npx medusa start"]
