FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# Base tooling required for this repo + for installing claude/codex/op inside the container.
# Note: rust-analyzer isn't available from the default apt sources in this base image.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    jq \
    gnupg \
    unzip \
    gzip \
    postgresql-client \
    nodejs \
    npm \
    docker.io \
  && rm -rf /var/lib/apt/lists/*

# Install Docker Compose v2 plugin so `docker compose` works inside the devcontainer.
# (Ubuntu packages don't always include docker-compose-plugin.)
ARG DOCKER_COMPOSE_VERSION=v2.27.1
RUN set -eux; \
  arch="$(uname -m)"; \
  case "$arch" in \
    x86_64) compose_arch="x86_64" ;; \
    aarch64|arm64) compose_arch="aarch64" ;; \
    *) echo "Unsupported arch: $arch"; exit 1 ;; \
  esac; \
  mkdir -p /usr/local/lib/docker/cli-plugins; \
  curl -fsSL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-${compose_arch}" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose; \
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Ensure pnpm exists even when host mounts are not present.
RUN npm install -g pnpm

# Install 1Password CLI (op) in the devcontainer.
# Ref: https://developer.1password.com/docs/cli/get-started/
RUN set -eux; \
    mkdir -p /usr/share/keyrings; \
    curl -sS https://downloads.1password.com/linux/keys/1password.asc \
      | gpg --dearmor --output /usr/share/keyrings/1password-archive-keyring.gpg; \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/1password-archive-keyring.gpg] https://downloads.1password.com/linux/debian/$(dpkg --print-architecture) stable main" \
      > /etc/apt/sources.list.d/1password.list; \
    apt-get update; \
    apt-get install -y --no-install-recommends 1password-cli; \
    rm -rf /var/lib/apt/lists/*
