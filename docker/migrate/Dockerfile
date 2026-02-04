# Hardened migrate Dockerfile for openclaw-projects
# https://github.com/troykelly/openclaw-projects

# Pin to specific version for reproducibility
FROM migrate/migrate:v4.19.1

# OCI Image specification labels
# https://github.com/opencontainers/image-spec/blob/main/annotations.md
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.opencontainers.image.title="openclaw-projects-migrate" \
      org.opencontainers.image.description="Database migration runner for openclaw-projects using golang-migrate" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.source="https://github.com/troykelly/openclaw-projects" \
      org.opencontainers.image.url="https://github.com/troykelly/openclaw-projects" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.authors="Troy Kelly <troy@troykelly.com>" \
      org.opencontainers.image.base.name="docker.io/migrate/migrate:v4.19.1"

# Copy SQL migrations into the image so the compose stack can be launched from any
# working directory (and without relying on host bind mounts).
COPY migrations /migrations

# The migrate/migrate base image runs as root by default.
# Create a non-root user for security hardening.
# Alpine uses 'adduser' syntax (the base image is Alpine-based).
RUN adduser -D -u 1000 migrate && \
    chown -R migrate:migrate /migrations

# Switch to non-root user
USER migrate

ENTRYPOINT ["migrate"]
