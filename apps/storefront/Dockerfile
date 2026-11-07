# Next.js storefront. Build from the monorepo root:
#   docker build -f apps/storefront/Dockerfile -t wangjia-storefront --build-arg NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_... .
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/storefront/package.json apps/storefront/package.json
RUN pnpm install --frozen-lockfile --filter @b2b-starter/storefront...

FROM deps AS build
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.example.com
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_BASE_URL=https://www.example.com
ARG NEXT_PUBLIC_DEFAULT_REGION=id
ARG NEXT_PUBLIC_WHATSAPP_NUMBER=6281200000000
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL \
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION \
    NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER \
    NEXT_TELEMETRY_DISABLED=1
COPY apps/storefront apps/storefront
WORKDIR /app/apps/storefront
RUN pnpm build

FROM base AS runtime
ENV NODE_ENV=production PORT=8000 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/apps/storefront
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/storefront/node_modules ./node_modules
COPY --from=build /app/apps/storefront/.next ./.next
COPY --from=build /app/apps/storefront/public ./public
COPY --from=build /app/apps/storefront/package.json ./package.json
COPY --from=build /app/apps/storefront/next.config.* ./
EXPOSE 8000
CMD ["pnpm", "start", "--", "-p", "8000"]
