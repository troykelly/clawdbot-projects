-- Issue #17: rollback required Postgres extensions

DROP EXTENSION IF EXISTS vector;
DROP EXTENSION IF EXISTS pg_cron;
DROP EXTENSION IF EXISTS postgis;
DROP EXTENSION IF EXISTS timescaledb;
