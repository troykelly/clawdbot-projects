FROM migrate/migrate:v4.18.3

# Copy SQL migrations into the image so the compose stack can be launched from any
# working directory (and without relying on host bind mounts).
COPY migrations /migrations

ENTRYPOINT ["migrate"]
