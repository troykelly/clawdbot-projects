FROM postgres:18-bookworm

# Install required extensions:
# - timescaledb (preload)
# - postgis
# - pg_cron (preload)
# - pgvector
RUN set -eux; \
  apt-get update; \
  apt-get install -y --no-install-recommends ca-certificates curl gnupg lsb-release; \
  echo "deb http://apt.postgresql.org/pub/repos/apt $(. /etc/os-release && echo $VERSION_CODENAME)-pgdg main" > /etc/apt/sources.list.d/pgdg.list; \
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/pgdg.gpg; \
  \
  # TimescaleDB repo
  curl -fsSL https://packagecloud.io/timescale/timescaledb/gpgkey | gpg --dearmor -o /etc/apt/trusted.gpg.d/timescale.gpg; \
  echo "deb https://packagecloud.io/timescale/timescaledb/debian/ $(. /etc/os-release && echo $VERSION_CODENAME) main" > /etc/apt/sources.list.d/timescaledb.list; \
  \
  apt-get update; \
  apt-get install -y --no-install-recommends \
    postgresql-18-postgis-3 \
    postgresql-18-postgis-3-scripts \
    postgresql-18-cron \
    postgresql-18-pgvector \
    timescaledb-2-postgresql-18; \
  \
  rm -rf /var/lib/apt/lists/*
