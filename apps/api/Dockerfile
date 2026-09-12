FROM node:24.15.0-bookworm-slim@sha256:4e6b70dd6cbfc88c8157ba19aa3d9f9cce6ba4703576d55459e45efcbc9c5f5d AS base
RUN apt-get update && apt-get install --yes --no-install-recommends ca-certificates openssl && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /workspace
RUN npm install --global pnpm@11.1.3

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY patches ./patches
COPY apps/api/package.json ./apps/api/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY nessie-node-sdk/package.json ./nessie-node-sdk/package.json
RUN pnpm install --frozen-lockfile

COPY apps/api/ ./apps/api/
COPY packages/api-client/ ./packages/api-client/
COPY nessie-node-sdk/ ./nessie-node-sdk/
RUN pnpm --filter nessie-node-sdk build
RUN pnpm --filter @mirror/api build
RUN pnpm --filter @mirror/api deploy --prod --no-optional /deployment

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build --chown=node:node /deployment/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/apps/api/dist ./dist
COPY --from=build --chown=node:node /workspace/apps/api/package.json ./package.json
USER node
EXPOSE 3000
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD ["node", "--input-type=module", "-e", "try { const response = await fetch('http://127.0.0.1:' + (process.env.PORT ?? '3000') + '/v1/health/ready', { signal: AbortSignal.timeout(4000) }); process.exit(response.ok ? 0 : 1); } catch { process.exit(1); }"]
CMD ["node", "dist/main.js"]
