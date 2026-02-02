FROM node:25-bookworm-slim

WORKDIR /app

# Install pnpm via corepack
RUN corepack enable

# Copy lockfile + package manifests first for better caching
COPY package.json pnpm-lock.yaml ./

# Install all deps
RUN pnpm install --frozen-lockfile

COPY . ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

# Use Node 25's native TypeScript support
CMD ["node", "--experimental-transform-types", "--experimental-detect-module", "src/api/run.ts"]
